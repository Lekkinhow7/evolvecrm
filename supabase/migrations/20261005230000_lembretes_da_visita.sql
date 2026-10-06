-- Lembretes automáticos da visita técnica.
--
-- Quando a visita ganha técnico e telefone, o CRM gera o link do formulário e
-- deixa duas mensagens prontas na fila: uma duas horas antes e outra quinze
-- minutos antes. Quem envia é o disparador, que roda de cinco em cinco minutos.

ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS technician_phone TEXT;

CREATE TABLE IF NOT EXISTS public.outbound_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  form_link_id UUID REFERENCES public.form_links(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  to_phone TEXT NOT NULL,
  body TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (kind IN ('visita_2h', 'visita_15min', 'visita_cobranca'))
);

-- Uma mensagem de cada tipo por visita: reagendar não duplica o aviso.
CREATE UNIQUE INDEX IF NOT EXISTS outbound_messages_unicas
  ON public.outbound_messages (activity_id, kind)
  WHERE activity_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS outbound_messages_fila
  ON public.outbound_messages (scheduled_for)
  WHERE sent_at IS NULL AND cancelled_at IS NULL;

ALTER TABLE public.outbound_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS outbound_messages_org_isolate ON public.outbound_messages;
CREATE POLICY outbound_messages_org_isolate ON public.outbound_messages FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

REVOKE ALL ON public.outbound_messages FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outbound_messages TO authenticated;
