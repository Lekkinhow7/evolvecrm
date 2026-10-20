-- Selos de documentos do Kanban: arquivos novos ou removidos chegam pelo Realtime.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'deal_files') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE deal_files;
    END IF;
END $$;
