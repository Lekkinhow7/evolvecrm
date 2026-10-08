-- Ficha da call do vendedor.
--
-- A call é uma activity do tipo MEETING: a Marina marca, o vendedor atende pelo
-- Google Meet e registra o resultado na ficha, sem sair do CRM. Quem é o vendedor
-- e quem é o técnico vem do banco do agente, como na visita: aqui só fica gravado.

ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS meeting_url TEXT,
  ADD COLUMN IF NOT EXISTS seller_label TEXT,
  ADD COLUMN IF NOT EXISTS seller_phone TEXT,
  ADD COLUMN IF NOT EXISTS seller_ref TEXT,
  ADD COLUMN IF NOT EXISTS call_result TEXT,
  ADD COLUMN IF NOT EXISTS call_notes TEXT,
  ADD COLUMN IF NOT EXISTS call_result_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS return_at TIMESTAMPTZ,
  -- A visita aponta para a call em que foi agendada.
  ADD COLUMN IF NOT EXISTS origin_activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'activities_call_result_check'
  ) THEN
    ALTER TABLE public.activities
      ADD CONSTRAINT activities_call_result_check CHECK (
        call_result IS NULL OR call_result IN ('agendar_visita', 'sem_interesse', 'retornar', 'nao_atendeu')
      );
  END IF;
END $$;

-- Calls que já terminaram e ainda não têm resultado: é o que o aviso do topo mostra.
CREATE INDEX IF NOT EXISTS activities_calls_pendentes_idx
  ON public.activities (organization_id, ends_at)
  WHERE type = 'MEETING' AND call_result IS NULL AND deleted_at IS NULL;
