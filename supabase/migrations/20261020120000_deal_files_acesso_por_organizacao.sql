-- Documentos dos negócios: cada escritório só vê, envia e apaga os próprios.
--
-- A tabela deal_files já é isolada por organização (20260221200000), mas o
-- bucket "deal-files" do Storage aceitava qualquer usuário logado. Os arquivos
-- ficam em uma de duas pastas:
--   <deal_id>/...                  (upload pelo CRM)
--   <organization_id>/<deal_id>/... (documentos que chegam pela API/WhatsApp)
-- A regra libera o arquivo quando a primeira pasta é a organização do usuário
-- ou um negócio dela. Idempotente.

-- Tabela (reaplica a regra por organização, caso a migration antiga não tenha rodado)
DROP POLICY IF EXISTS "deal_files_access" ON public.deal_files;
DROP POLICY IF EXISTS "deal_files_org_isolate" ON public.deal_files;
CREATE POLICY "deal_files_org_isolate" ON public.deal_files
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = deal_files.deal_id
        AND d.organization_id = (SELECT p.organization_id FROM public.profiles p WHERE p.id = (SELECT auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = deal_files.deal_id
        AND d.organization_id = (SELECT p.organization_id FROM public.profiles p WHERE p.id = (SELECT auth.uid()))
    )
  );

-- Storage: a primeira pasta do caminho tem que ser da organização do usuário.
CREATE OR REPLACE FUNCTION public.deal_file_path_is_mine(object_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH minha AS (
    SELECT p.organization_id AS org
    FROM public.profiles p
    WHERE p.id = auth.uid()
  ),
  pasta AS (
    SELECT (storage.foldername(object_name))[1] AS primeira
  )
  SELECT EXISTS (
    SELECT 1 FROM minha, pasta
    WHERE minha.org IS NOT NULL
      AND (
        pasta.primeira = minha.org::text
        OR EXISTS (
          SELECT 1 FROM public.deals d
          WHERE d.id::text = pasta.primeira
            AND d.organization_id = minha.org
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.deal_file_path_is_mine(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deal_file_path_is_mine(TEXT) TO authenticated;

DROP POLICY IF EXISTS "deal_files_upload" ON storage.objects;
CREATE POLICY "deal_files_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'deal-files' AND public.deal_file_path_is_mine(name));

DROP POLICY IF EXISTS "deal_files_read" ON storage.objects;
CREATE POLICY "deal_files_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'deal-files' AND public.deal_file_path_is_mine(name));

DROP POLICY IF EXISTS "deal_files_delete" ON storage.objects;
CREATE POLICY "deal_files_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'deal-files' AND public.deal_file_path_is_mine(name));
