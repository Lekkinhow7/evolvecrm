-- O técnico, a disponibilidade e os slots moram no banco do agente.
--
-- A tentativa anterior criou uma lista de técnicos dentro do CRM, o que daria
-- duas fontes para a mesma informação. O CRM volta a só receber quem é o
-- técnico daquela visita, junto com o agendamento, e guarda a referência dele
-- no sistema de origem.

ALTER TABLE public.activities
  DROP COLUMN IF EXISTS technician_id,
  ADD COLUMN IF NOT EXISTS technician_ref TEXT;

COMMENT ON COLUMN public.activities.technician_ref IS
  'Id do profissional no banco do agente, de onde a agenda e a equipe vêm.';

DROP TABLE IF EXISTS public.technician_rotation;
DROP TABLE IF EXISTS public.technicians;
