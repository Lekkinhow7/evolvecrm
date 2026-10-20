'use client';

import React, { useState } from 'react';
import { Badge, Button, Modal, ModalSection } from '@/design-system';
import { useFreeSlots, useUpdateMeeting, type FreeSlot } from '@/lib/query/hooks/useAgendaQuery';
import type { Activity } from '@/types';
import {
  HorariosLivres,
  MSG_AGENDA_FORA,
  MSG_HORARIO_OCUPADO,
  MSG_SEM_HORARIOS,
  novoPedidoId,
} from './HorariosLivres';
import { useOptionalToast } from '@/context/ToastContext';
import { sanitizeUrl } from '@/lib/utils/sanitize';
import { useContacts } from '@/lib/query/hooks/useContactsQuery';
import { useDealsView } from '@/lib/query/hooks/useDealsQuery';

const quandoFmt = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});
const horaFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });

const MSG_REMARCADA_PENDENTE = 'Reunião remarcada. Ela aparece na agenda em instantes.';

const SITUACAO: Record<string, { texto: string; tone: 'info' | 'success' | 'warning' | 'danger' }> = {
  agendada: { texto: 'Agendada', tone: 'info' },
  realizada: { texto: 'Realizada', tone: 'success' },
  nao_compareceu: { texto: 'Não compareceu', tone: 'warning' },
  cancelada: { texto: 'Cancelada', tone: 'danger' },
};

interface Props {
  activity: Activity;
  onClose: () => void;
}

export const ReuniaoDetalhe: React.FC<Props> = ({ activity, onClose }) => {
  const update = useUpdateMeeting();
  const [remarcando, setRemarcando] = useState(false);
  const [slot, setSlot] = useState<FreeSlot | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pedidoId, setPedidoId] = useState<string>('');
  const { addToast } = useOptionalToast();
  const slotsQuery = useFreeSlots(remarcando);
  const { data: contacts = [] } = useContacts();
  const { data: deals = [] } = useDealsView();
  const contactId = activity.contactId || deals.find((d) => d.id === activity.dealId)?.contactId;
  const contato = contactId ? contacts.find((c) => c.id === contactId) : undefined;
  const linkConversa = contato?.phone
    ? `/messaging?${new URLSearchParams({
        newConversation: 'true',
        contactId: contato.id,
        contactName: contato.name || '',
        contactPhone: contato.phone,
      }).toString()}`
    : null;
  const linkReuniao = sanitizeUrl(activity.meetingUrl);

  const status = activity.meetingStatus ?? 'agendada';
  const cancelada = status === 'cancelada';
  const situacao = SITUACAO[status] ?? SITUACAO.agendada;
  const inicio = new Date(activity.date);
  const quando = `${quandoFmt.format(inicio)}${activity.endsAt ? ` até ${horaFmt.format(new Date(activity.endsAt))}` : ''}`;

  const executar = async (corpo: Parameters<typeof update.mutateAsync>[0]) => {
    setErro(null);
    try {
      const resposta = await update.mutateAsync(corpo);
      if (resposta?.pendente) addToast(MSG_REMARCADA_PENDENTE, 'success');
      onClose();
    } catch (e) {
      if ((e as { code?: string })?.code === 'HORARIO_OCUPADO') {
        setErro(MSG_HORARIO_OCUPADO);
        setSlot(null);
        slotsQuery.refetch();
      } else {
        setErro(MSG_AGENDA_FORA);
      }
    }
  };

  // Remarcar só oferece horários do mesmo formato da reunião.
  const formato = activity.meetingFormat;
  const slots = (slotsQuery.data ?? []).filter((s) => !formato || !s.formato || s.formato === formato);

  return (
    <Modal
      open
      onClose={onClose}
      title={activity.title}
      subtitle={quando}
      footer={
        cancelada ? (
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        ) : remarcando ? (
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setRemarcando(false);
                setSlot(null);
              }}
            >
              Voltar
            </Button>
            <Button
              disabled={!slot || update.isPending || slotsQuery.isError}
              onClick={() =>
                slot &&
                executar({
                  id: activity.id,
                  acao: 'remarcar',
                  inicio: slot.inicio,
                  fim: slot.fim,
                  ...(formato ? { formato } : {}),
                  ...(pedidoId ? { pedido_id: pedidoId } : {}),
                })
              }
            >
              Confirmar novo horário
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" disabled={update.isPending} onClick={() => executar({ id: activity.id, acao: 'status', status: 'realizada' })}>
              Marcar como realizada
            </Button>
            <Button variant="secondary" disabled={update.isPending} onClick={() => executar({ id: activity.id, acao: 'status', status: 'nao_compareceu' })}>
              Não compareceu
            </Button>
            <Button
              variant="outline"
              disabled={update.isPending}
              onClick={() => {
                setPedidoId(novoPedidoId());
                setRemarcando(true);
              }}
            >
              Remarcar
            </Button>
            <Button variant="ghost" disabled={update.isPending} onClick={() => executar({ id: activity.id, acao: 'cancelar' })}>
              Cancelar reunião
            </Button>
          </>
        )
      }
    >
      <ModalSection title="Situação">
        <Badge tone={situacao.tone}>{situacao.texto}</Badge>{' '}
        {activity.meetingFormat && <Badge tone="neutral">{activity.meetingFormat === 'online' ? 'Online' : 'Presencial'}</Badge>}
        {activity.dealTitle && <p style={{ marginTop: 'var(--space-2)' }}>{activity.dealTitle}</p>}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
          {activity.dealId && (
            <Button size="sm" variant="secondary" href={`/boards?deal=${encodeURIComponent(activity.dealId)}`}>
              Abrir negócio
            </Button>
          )}
          {linkConversa && (
            <Button size="sm" variant="secondary" href={linkConversa}>
              Abrir conversa
            </Button>
          )}
        </div>
      </ModalSection>

      {activity.meetingFormat === 'online' && linkReuniao && (
        <ModalSection title="Link">
          <a href={linkReuniao} target="_blank" rel="noopener noreferrer">
            {linkReuniao}
          </a>
        </ModalSection>
      )}
      {activity.meetingFormat === 'presencial' && activity.address && (
        <ModalSection title="Endereço">
          <p>{activity.address}</p>
        </ModalSection>
      )}
      {activity.description && (
        <ModalSection title="Resumo">
          <p>{activity.description}</p>
        </ModalSection>
      )}

      {remarcando && !cancelada && (
        <ModalSection title="Novo horário">
          {slotsQuery.isLoading ? (
            <Badge tone="neutral">Carregando horários...</Badge>
          ) : slotsQuery.isError ? (
            <p role="alert">{MSG_AGENDA_FORA}</p>
          ) : slots.length === 0 ? (
            <p>{MSG_SEM_HORARIOS}</p>
          ) : (
            <HorariosLivres slots={slots} selecionado={slot} onSelect={setSlot} />
          )}
        </ModalSection>
      )}
      {erro && (
        <p role="alert" style={{ marginTop: 'var(--space-3)' }}>
          {erro}
        </p>
      )}
    </Modal>
  );
};
