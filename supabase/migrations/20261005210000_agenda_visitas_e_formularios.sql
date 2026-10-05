-- Agenda de visitas técnicas e formulários operacionais.
--
-- Mantém um modelo só: a visita é uma activity tipada e o orçamento/venda são
-- colunas reais de deals, porque são os números que o dashboard mede. As
-- perguntas que mudam com o tempo ficam em form_fields/form_submissions.

-- -----------------------------------------------------------------------------
-- 1. VISITA TÉCNICA SOBRE ACTIVITIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS visit_status TEXT,
  ADD COLUMN IF NOT EXISTS technician_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS technician_label TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS address_note TEXT,
  ADD COLUMN IF NOT EXISTS arrival_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS report_filled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS external_ref TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'activities_visit_status_check'
  ) THEN
    ALTER TABLE public.activities
      ADD CONSTRAINT activities_visit_status_check CHECK (
        visit_status IS NULL OR visit_status IN (
          'agendada', 'confirmada', 'em_atendimento', 'concluida', 'cancelada', 'nao_compareceu'
        )
      );
  END IF;
END $$;

-- Uma visita por agendamento de origem, para a sincronização não duplicar.
CREATE UNIQUE INDEX IF NOT EXISTS activities_external_ref_unique
  ON public.activities (organization_id, external_ref)
  WHERE external_ref IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS activities_agenda_idx
  ON public.activities (organization_id, date)
  WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- 2. ORÇAMENTO E VENDA SOBRE DEALS
-- -----------------------------------------------------------------------------
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS quote_status TEXT,
  ADD COLUMN IF NOT EXISTS quote_value NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS quote_items TEXT,
  ADD COLUMN IF NOT EXISTS quote_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS sold_value NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS discount_value NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS install_date DATE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deals_quote_status_check'
  ) THEN
    ALTER TABLE public.deals
      ADD CONSTRAINT deals_quote_status_check CHECK (
        quote_status IS NULL OR quote_status IN ('enviado', 'aprovado', 'recusado')
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS deals_sold_at_idx
  ON public.deals (organization_id, sold_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS deals_closed_at_idx
  ON public.deals (organization_id, closed_at)
  WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- 3. FORMULÁRIOS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  audience TEXT NOT NULL DEFAULT 'tecnico',
  target TEXT NOT NULL DEFAULT 'activity',
  intro TEXT,
  thanks_message TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, key),
  CHECK (audience IN ('tecnico', 'vendedor', 'gestor', 'cliente')),
  CHECK (target IN ('activity', 'deal'))
);

CREATE TABLE IF NOT EXISTS public.form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  help_text TEXT,
  type TEXT NOT NULL DEFAULT 'text',
  options TEXT[],
  required BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0,
  target_column TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (form_id, key),
  CHECK (type IN ('text', 'textarea', 'number', 'currency', 'date', 'time', 'select', 'boolean', 'phone', 'file')),
  CHECK (
    target_column IS NULL OR target_column IN (
      'activity.arrival_at',
      'activity.visit_status',
      'deal.quote_status',
      'deal.quote_value',
      'deal.quote_items',
      'deal.payment_method',
      'deal.loss_reason',
      'deal.sold_value',
      'deal.discount_value',
      'deal.install_date'
    )
  )
);

CREATE INDEX IF NOT EXISTS form_fields_form_idx ON public.form_fields (form_id, position);

-- Link assinado: quem recebe abre sem login, só aquele registro, com validade.
CREATE TABLE IF NOT EXISTS public.form_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  recipient_label TEXT,
  recipient_phone TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (deal_id IS NOT NULL OR activity_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS form_links_pendentes_idx
  ON public.form_links (organization_id, form_id, used_at);

CREATE TABLE IF NOT EXISTS public.form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  form_link_id UUID REFERENCES public.form_links(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  files JSONB NOT NULL DEFAULT '[]'::jsonb,
  author_label TEXT,
  author_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS form_submissions_deal_idx ON public.form_submissions (organization_id, deal_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS form_submissions_activity_idx ON public.form_submissions (organization_id, activity_id, submitted_at DESC);

-- -----------------------------------------------------------------------------
-- 4. SEGURANÇA: mesmo padrão das demais tabelas (isolamento por organização)
-- -----------------------------------------------------------------------------
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS forms_org_isolate ON public.forms;
CREATE POLICY forms_org_isolate ON public.forms FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS form_fields_org_isolate ON public.form_fields;
CREATE POLICY form_fields_org_isolate ON public.form_fields FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS form_links_org_isolate ON public.form_links;
CREATE POLICY form_links_org_isolate ON public.form_links FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS form_submissions_org_isolate ON public.form_submissions;
CREATE POLICY form_submissions_org_isolate ON public.form_submissions FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

REVOKE ALL ON public.forms FROM anon;
REVOKE ALL ON public.form_fields FROM anon;
REVOKE ALL ON public.form_links FROM anon;
REVOKE ALL ON public.form_submissions FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.forms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_fields TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_links TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_submissions TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. DASHBOARD COMERCIAL: números agregados no banco, com data certa
-- -----------------------------------------------------------------------------
-- Aquisição conta por criação, venda conta por fechamento, funil é foto do
-- momento. Executa com as permissões de quem chamou, então respeita o RLS.
CREATE OR REPLACE FUNCTION public.crm_commercial_dashboard(
  p_from TIMESTAMPTZ,
  p_to TIMESTAMPTZ,
  p_board_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH org AS (
    SELECT public.get_user_org_id() AS id
  ),
  negocios AS (
    SELECT d.*
    FROM public.deals d, org
    WHERE d.organization_id = org.id
      AND d.deleted_at IS NULL
      AND (p_board_id IS NULL OR d.board_id = p_board_id)
  ),
  criados AS (
    SELECT * FROM negocios WHERE created_at >= p_from AND created_at <= p_to
  ),
  fechados AS (
    SELECT * FROM negocios
    WHERE COALESCE(sold_at, closed_at) >= p_from
      AND COALESCE(sold_at, closed_at) <= p_to
      AND (is_won OR is_lost)
  ),
  visitas AS (
    SELECT a.*
    FROM public.activities a, org
    WHERE a.organization_id = org.id
      AND a.deleted_at IS NULL
      AND a.type = 'VISITA'
      AND a.date >= p_from AND a.date <= p_to
  )
  SELECT jsonb_build_object(
    'periodo', jsonb_build_object('de', p_from, 'ate', p_to),
    'leads_novos', (SELECT count(*) FROM public.contacts c, org
                     WHERE c.organization_id = org.id AND c.deleted_at IS NULL
                       AND c.created_at >= p_from AND c.created_at <= p_to),
    'oportunidades_criadas', (SELECT count(*) FROM criados),
    'carteira_aberta', (SELECT count(*) FROM negocios WHERE NOT is_won AND NOT is_lost),
    'carteira_aberta_valor', (SELECT COALESCE(sum(COALESCE(quote_value, value, 0)), 0)
                                FROM negocios WHERE NOT is_won AND NOT is_lost),
    'ganhos', (SELECT count(*) FROM fechados WHERE is_won),
    'perdidos', (SELECT count(*) FROM fechados WHERE is_lost),
    'receita_ganha', (SELECT COALESCE(sum(COALESCE(sold_value, value, 0)), 0) FROM fechados WHERE is_won),
    'ticket_medio', (SELECT CASE WHEN count(*) FILTER (WHERE is_won) = 0 THEN NULL
                                 ELSE round(sum(COALESCE(sold_value, value, 0)) FILTER (WHERE is_won)
                                            / count(*) FILTER (WHERE is_won), 2) END
                       FROM fechados),
    'conversao', (SELECT CASE WHEN count(*) = 0 THEN NULL
                              ELSE round(100.0 * count(*) FILTER (WHERE is_won) / count(*), 1) END
                    FROM fechados),
    'ciclo_dias', (SELECT round(avg(EXTRACT(EPOCH FROM (COALESCE(sold_at, closed_at) - created_at)) / 86400)::numeric, 1)
                     FROM fechados WHERE is_won),
    'orcamentos_enviados', (SELECT count(*) FROM negocios
                              WHERE quote_sent_at >= p_from AND quote_sent_at <= p_to),
    'orcamentos_valor', (SELECT COALESCE(sum(quote_value), 0) FROM negocios
                           WHERE quote_sent_at >= p_from AND quote_sent_at <= p_to),
    'visitas_agendadas', (SELECT count(*) FROM visitas),
    'visitas_realizadas', (SELECT count(*) FROM visitas WHERE visit_status = 'concluida'),
    'visitas_nao_compareceu', (SELECT count(*) FROM visitas WHERE visit_status = 'nao_compareceu'),
    'laudos_preenchidos', (SELECT count(*) FROM visitas WHERE report_filled_at IS NOT NULL),
    'horas_ate_laudo', (SELECT round(avg(EXTRACT(EPOCH FROM (report_filled_at - date)) / 3600)::numeric, 1)
                          FROM visitas WHERE report_filled_at IS NOT NULL),
    'por_etapa', (SELECT COALESCE(jsonb_agg(x ORDER BY x->>'ordem'), '[]'::jsonb) FROM (
        SELECT jsonb_build_object(
                 'etapa', s.name,
                 'ordem', s."order",
                 'quantidade', count(n.id),
                 'valor', COALESCE(sum(COALESCE(n.quote_value, n.value, 0)), 0)
               ) AS x
        FROM public.board_stages s
        LEFT JOIN negocios n ON n.stage_id = s.id AND NOT n.is_won AND NOT n.is_lost
        WHERE s.organization_id = (SELECT id FROM org)
          AND (p_board_id IS NULL OR s.board_id = p_board_id)
        GROUP BY s.name, s."order"
      ) t),
    'por_origem', (SELECT COALESCE(jsonb_agg(x ORDER BY x->>'quantidade' DESC), '[]'::jsonb) FROM (
        SELECT jsonb_build_object(
                 'origem', COALESCE(NULLIF(c.source, ''), 'não informado'),
                 'quantidade', count(*)
               ) AS x
        FROM public.contacts c, org
        WHERE c.organization_id = org.id AND c.deleted_at IS NULL
          AND c.created_at >= p_from AND c.created_at <= p_to
        GROUP BY COALESCE(NULLIF(c.source, ''), 'não informado')
      ) t)
  );
$$;

REVOKE ALL ON FUNCTION public.crm_commercial_dashboard(TIMESTAMPTZ, TIMESTAMPTZ, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_commercial_dashboard(TIMESTAMPTZ, TIMESTAMPTZ, UUID) TO authenticated;
