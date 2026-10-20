'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, ChipGroup, Modal, ModalSection, SearchInput } from '@/design-system';
import { useFreeSlots, useScheduleMeeting, type FreeSlot, type MeetingFormat } from '@/lib/query/hooks/useAgendaQuery';
import { useDealsView } from '@/lib/query/hooks/useDealsQuery';
import { HorariosLivres, MSG_AGENDA_FORA, MSG_HORARIO_OCUPADO, MSG_SEM_HORARIOS } from './HorariosLivres';

interface Props {
  open: boolean;
  onClose: () => void;
  dealId?: string;
}

const FORMATOS = [
  { value: 'online', label: 'Online' },
  { value: 'presencial', label: 'Presencial' },
];

export const NovaReuniaoModal: React.FC<Props> = ({ open, onClose, dealId }) => {
  const slotsQuery = useFreeSlots(open);
  const schedule = useScheduleMeeting();
  const { data: deals = [] } = useDealsView();

  const [busca, setBusca] = useState('');
  const [dealEscolhido, setDealEscolhido] = useState<string | null>(null);
  const [formato, setFormato] = useState<MeetingFormat>('online');
  const [slot, setSlot] = useState<FreeSlot | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Estado limpo a cada abertura.
  useEffect(() => {
    if (open) {
      setBusca('');
      setDealEscolhido(null);
      setFormato('online');
      setSlot(null);
      setErro(null);
    }
  }, [open]);

  const negocioId = dealId ?? dealEscolhido;

  const negociosAbertos = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return deals
      .filter((d) => !d.isWon && !d.isLost)
      .filter((d) => !q || `${d.title} ${d.contactName ?? ''}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [deals, busca]);

  const slots = useMemo(
    () => (slotsQuery.data ?? []).filter((s) => !s.formato || s.formato === formato),
    [slotsQuery.data, formato],
  );

  const falhaAgenda = slotsQuery.isError;
  const podeMarcar = !!negocioId && !!slot && !falhaAgenda && !schedule.isPending;

  const confirmar = async () => {
    if (!negocioId || !slot) return;
    setErro(null);
    try {
      await schedule.mutateAsync({ deal_id: negocioId, inicio: slot.inicio, fim: slot.fim, formato });
      setSlot(null);
      setBusca('');
      setDealEscolhido(null);
      setFormato('online');
      setErro(null);
      onClose();
    } catch (e) {
      const code = (e as { code?: string })?.code;
      setSlot(null);
      if (code === 'HORARIO_OCUPADO') {
        setErro(MSG_HORARIO_OCUPADO);
        slotsQuery.refetch();
      } else {
        setErro(MSG_AGENDA_FORA);
      }
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nova reunião"
      subtitle="Escolha um horário livre da agenda"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={confirmar} disabled={!podeMarcar}>
            Marcar reunião
          </Button>
        </>
      }
    >
      {!dealId && (
        <ModalSection title="Negócio">
          <SearchInput value={busca} onChange={setBusca} placeholder="Buscar negócio ou contato" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
            {negociosAbertos.map((d) => (
              <Button
                key={d.id}
                variant={dealEscolhido === d.id ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setDealEscolhido(d.id)}
              >
                {d.contactName ? `${d.title} - ${d.contactName}` : d.title}
              </Button>
            ))}
          </div>
        </ModalSection>
      )}

      <ModalSection title="Formato">
        <ChipGroup
          options={FORMATOS}
          value={formato}
          onChange={(v) => {
            setFormato(v as MeetingFormat);
            setSlot(null);
          }}
        />
      </ModalSection>

      <ModalSection title="Horários livres">
        {slotsQuery.isLoading ? (
          <Badge tone="neutral">Carregando horários...</Badge>
        ) : falhaAgenda ? (
          <p role="alert" style={{ color: 'var(--status-danger, var(--text-primary))' }}>
            {MSG_AGENDA_FORA}
          </p>
        ) : slots.length === 0 ? (
          <p>{MSG_SEM_HORARIOS}</p>
        ) : (
          <HorariosLivres slots={slots} selecionado={slot} onSelect={setSlot} />
        )}
        {erro && (
          <p role="alert" style={{ marginTop: 'var(--space-3)' }}>
            {erro}
          </p>
        )}
      </ModalSection>
    </Modal>
  );
};
