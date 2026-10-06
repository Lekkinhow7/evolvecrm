-- Um aviso de cada tipo por visita, com índice que o upsert consegue usar.
--
-- O índice anterior era parcial (WHERE activity_id IS NOT NULL), e o upsert
-- pela API não casa com índice parcial. Toda mensagem da fila tem visita, e
-- valor nulo nunca colide num índice único, então o parcial não protegia nada.

DROP INDEX IF EXISTS public.outbound_messages_unicas;

CREATE UNIQUE INDEX IF NOT EXISTS outbound_messages_visita_tipo
  ON public.outbound_messages (activity_id, kind);
