-- Agenda da Alice: reuniões em activities, papel de etapa, documentos do deal.
-- Idempotente.

-- 1. Reuniões em activities
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS external_ref text,
  ADD COLUMN IF NOT EXISTS meeting_status text,
  ADD COLUMN IF NOT EXISTS meeting_format text,
  ADD COLUMN IF NOT EXISTS meeting_url text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS source text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activities_meeting_status_check') THEN
    ALTER TABLE public.activities ADD CONSTRAINT activities_meeting_status_check
      CHECK (meeting_status IS NULL OR meeting_status IN ('agendada','realizada','cancelada','nao_compareceu'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activities_meeting_format_check') THEN
    ALTER TABLE public.activities ADD CONSTRAINT activities_meeting_format_check
      CHECK (meeting_format IS NULL OR meeting_format IN ('online','presencial'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activities_source_check') THEN
    ALTER TABLE public.activities ADD CONSTRAINT activities_source_check
      CHECK (source IS NULL OR source IN ('ia','equipe'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_activities_org_external_ref
  ON public.activities (organization_id, external_ref)
  WHERE external_ref IS NOT NULL AND deleted_at IS NULL;

-- 2. Papel da etapa
ALTER TABLE public.board_stages ADD COLUMN IF NOT EXISTS role text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'board_stages_role_check') THEN
    ALTER TABLE public.board_stages ADD CONSTRAINT board_stages_role_check
      CHECK (role IS NULL OR role IN ('reuniao_agendada','analise_documentos'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_board_stages_board_role
  ON public.board_stages (board_id, role)
  WHERE role IS NOT NULL;

-- 3. Aguardando documentos
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS awaiting_documents boolean NOT NULL DEFAULT false;

-- 4. Documentos do deal
ALTER TABLE public.deal_files
  ADD COLUMN IF NOT EXISTS external_ref text,
  ADD COLUMN IF NOT EXISTS organization_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS uq_deal_files_deal_external_ref
  ON public.deal_files (deal_id, external_ref)
  WHERE external_ref IS NOT NULL;

-- 5. Limite do bucket (25 MB)
UPDATE storage.buckets SET file_size_limit = 26214400 WHERE id = 'deal-files';
