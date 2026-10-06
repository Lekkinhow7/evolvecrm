-- Equipe técnica.
--
-- Quem faz as visitas. O agendamento feito pela IA escolhe daqui o técnico e o
-- WhatsApp para onde vão os lembretes, sem ninguém digitar nada.

CREATE TABLE IF NOT EXISTS public.technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  note TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS technicians_phone_unique
  ON public.technicians (organization_id, phone);

ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS technician_id UUID REFERENCES public.technicians(id) ON DELETE SET NULL;

-- Rodízio simples da equipe: guarda em quem parou a distribuição.
CREATE TABLE IF NOT EXISTS public.technician_rotation (
  organization_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  next_position INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technician_rotation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS technicians_org_isolate ON public.technicians;
CREATE POLICY technicians_org_isolate ON public.technicians FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS technician_rotation_org_isolate ON public.technician_rotation;
CREATE POLICY technician_rotation_org_isolate ON public.technician_rotation FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

REVOKE ALL ON public.technicians FROM anon;
REVOKE ALL ON public.technician_rotation FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technicians TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technician_rotation TO authenticated;
