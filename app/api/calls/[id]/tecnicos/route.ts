/**
 * @fileoverview Técnicos que o vendedor pode escolher para a visita.
 *
 * A equipe e a agenda dos técnicos estão no banco do agente: o n8n responde
 * quem existe, quem está livre no horário e quantas visitas cada um tem na
 * semana. O CRM só escolhe qual já vem marcado. A contagem não vai para a tela:
 * o vendedor pode estar compartilhando a ficha com o cliente.
 */

import { NextResponse } from 'next/server';

import { abrirCallDaSessao } from '@/lib/calls/sessao';
import { DURACAO_VISITA_MIN, sugerirTecnico, type TecnicoDaLista } from '@/lib/calls/ficha';
import { chamarFichaNoN8n, FichaN8nError } from '@/lib/calls/n8n';

export const runtime = 'nodejs';

interface RespostaN8n {
  tecnicos?: Array<{ id: string | number; nome: string; livre: boolean; visitas_semana?: number | string }>;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const aberta = await abrirCallDaSessao(id);
  if (!aberta.ok) return aberta.resposta;

  const busca = new URL(request.url).searchParams;
  const inicio = new Date(busca.get('inicio') || '');
  if (Number.isNaN(inicio.getTime())) {
    return NextResponse.json({ error: 'Informe o dia e a hora da visita' }, { status: 422 });
  }
  const duracao = Math.min(Math.max(Number(busca.get('duracao')) || DURACAO_VISITA_MIN, 15), 480);
  const fim = new Date(inicio.getTime() + duracao * 60_000);

  try {
    const resposta = await chamarFichaNoN8n<RespostaN8n>('tecnicos', {
      inicio: inicio.toISOString(),
      fim: fim.toISOString(),
    });
    const lista: TecnicoDaLista[] = (resposta.tecnicos || []).map((t) => ({
      id: String(t.id),
      nome: t.nome,
      livre: Boolean(t.livre),
      visitasSemana: Number(t.visitas_semana) || 0,
    }));
    return NextResponse.json({
      sugerido: sugerirTecnico(lista),
      tecnicos: lista
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
        .map((t) => ({ id: t.id, nome: t.nome, livre: t.livre })),
    });
  } catch (erro) {
    const mensagem = erro instanceof FichaN8nError ? erro.message : 'Falha ao buscar os técnicos';
    return NextResponse.json({ error: mensagem }, { status: 502 });
  }
}
