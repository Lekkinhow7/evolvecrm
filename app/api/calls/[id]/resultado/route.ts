/**
 * @fileoverview Resultado da call, registrado pelo vendedor na ficha.
 *
 * Primeiro grava no banco do agente, pelo n8n: é de lá que saem os avisos do
 * técnico e é lá que o follow-up lê o que aconteceu. Só depois grava no CRM.
 * Se o n8n não responder, nada é gravado e o vendedor tenta de novo; as
 * anotações não se perdem porque a ficha já salva enquanto ele digita.
 */

import { NextResponse } from 'next/server';

import { isAllowedOrigin } from '@/lib/security/sameOrigin';
import { createStaticAdminClient } from '@/lib/supabase/server';
import { abrirCallDaSessao } from '@/lib/calls/sessao';
import {
  agendamentoDaAtividade,
  MOTIVOS_SEM_INTERESSE,
  refDoAgendamento,
  ResultadoSchema,
} from '@/lib/calls/ficha';
import { chamarFichaNoN8n, FichaN8nError } from '@/lib/calls/n8n';
import { agendarVisita } from '@/lib/visits/agendar';
import { moveStageByDealId } from '@/lib/public-api/dealsMoveStage';

export const runtime = 'nodejs';

interface VisitaNoAgente {
  agendamento_id?: string | number;
  tecnico?: { id: string | number; nome: string; whatsapp: string };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Origem não permitida' }, { status: 403 });
  }
  const { id } = await params;
  const aberta = await abrirCallDaSessao(id);
  if (!aberta.ok) return aberta.resposta;
  const call = aberta.call;

  if (call.call_result) {
    return NextResponse.json({ error: 'O resultado desta call já foi registrado' }, { status: 409 });
  }

  const parsed = ResultadoSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dados inválidos' }, { status: 422 });
  }
  const body = parsed.data;
  const anotacoes = body.anotacoes ?? call.call_notes ?? '';

  const admin = createStaticAdminClient();
  const contato = call.contact_id
    ? await admin.from('contacts').select('name, phone').eq('id', call.contact_id).maybeSingle()
    : null;
  const nome = String(contato?.data?.name || call.title || '').trim();
  const telefone = String(contato?.data?.phone || '');
  const identificador = telefone.replace(/\D/g, '');

  const base = {
    call_agendamento_id: agendamentoDaAtividade(call.external_ref),
    identificador,
    nome,
    vendedor_id: call.seller_ref,
    anotacoes,
  };

  const agora = new Date().toISOString();
  let visitaId: string | null = null;

  try {
    if (body.resultado === 'agendar_visita') {
      const v = body.visita!;
      const inicio = new Date(v.inicio);
      const fim = new Date(inicio.getTime() + v.duracaoMin * 60_000);
      const noAgente = await chamarFichaNoN8n<VisitaNoAgente>('agendar_visita', {
        ...base,
        inicio: inicio.toISOString(),
        fim: fim.toISOString(),
        endereco: v.endereco,
        referencia: v.referencia || '',
        tecnico_id: v.tecnicoId,
      });
      if (!noAgente.agendamento_id || !noAgente.tecnico?.whatsapp) {
        return NextResponse.json({ error: 'O banco da SucçãoZero não confirmou a visita' }, { status: 502 });
      }

      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/+$/, '');
      const visita = await agendarVisita(admin, {
        organizationId: call.organization_id,
        dealId: call.deal_id,
        phone: telefone || null,
        name: nome || null,
        startsAt: inicio.toISOString(),
        endsAt: fim.toISOString(),
        address: v.endereco,
        addressNote: v.referencia || null,
        technician: {
          name: noAgente.tecnico.nome,
          phone: noAgente.tecnico.whatsapp,
          ref: String(noAgente.tecnico.id),
        },
        title: `Visita técnica${nome ? ` - ${nome}` : ''}`,
        externalRef: refDoAgendamento(noAgente.agendamento_id),
        // Os avisos do técnico saem pelo n8n, que lê o banco do agente.
        programarLembretes: false,
        appUrl,
      });
      visitaId = visita.activityId;
      await admin.from('activities').update({ origin_activity_id: call.id }).eq('id', visitaId);
    } else {
      await chamarFichaNoN8n('resultado', {
        ...base,
        resultado: body.resultado,
        motivo: body.motivo || '',
        retornar_em: body.retornarEm ? new Date(body.retornarEm).toISOString() : '',
      });
    }
  } catch (erro) {
    const mensagem = erro instanceof FichaN8nError ? erro.message : 'Falha ao gravar o resultado';
    console.error('[ficha-call] resultado não gravado', erro);
    return NextResponse.json({ error: `Não foi possível gravar: ${mensagem}` }, { status: 502 });
  }

  const gravou = await admin
    .from('activities')
    .update({
      call_result: body.resultado,
      call_notes: anotacoes || null,
      call_result_at: agora,
      return_at: body.retornarEm ? new Date(body.retornarEm).toISOString() : null,
      completed: true,
      visit_status: body.resultado === 'nao_atendeu' ? 'nao_compareceu' : 'concluida',
    })
    .eq('id', call.id);
  if (gravou.error) {
    console.error('[ficha-call] falha ao fechar a call no CRM', gravou.error);
  }

  if (body.resultado === 'sem_interesse' && call.deal_id) {
    // Etapa "Perdido" se o funil tiver; sem ela, o negócio é fechado como perdido do mesmo jeito.
    await moveStageByDealId({
      organizationId: call.organization_id,
      dealId: call.deal_id,
      target: { to_stage_label: 'Perdido' },
      mark: 'lost',
    }).catch(() => null);
    // A data de fechamento só é gravada se o negócio ainda não estava perdido.
    await admin
      .from('deals')
      .update({ is_lost: true, is_won: false, closed_at: agora })
      .eq('id', call.deal_id)
      .eq('is_lost', false);
    await admin.from('deals').update({ loss_reason: MOTIVOS_SEM_INTERESSE[body.motivo!] }).eq('id', call.deal_id);
  }

  return NextResponse.json({ ok: true, resultado: body.resultado, visita_id: visitaId });
}
