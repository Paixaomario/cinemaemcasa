-- Adiciona suporte a agendamento por horário e data
ALTER TABLE public.home_sections 
ADD COLUMN IF NOT EXISTS hora_inicio TIME NULL,
ADD COLUMN IF NOT EXISTS hora_fim TIME NULL,
ADD COLUMN IF NOT EXISTS data_inicio TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS data_fim TIMESTAMPTZ NULL;

-- Comentários para ajudar na administração
COMMENT ON COLUMN public.home_sections.hora_inicio IS 'Horário diário inicial para exibição (ex: 23:59:00)';
COMMENT ON COLUMN public.home_sections.hora_fim IS 'Horário diário final para exibição (ex: 05:59:00)';
COMMENT ON COLUMN public.home_sections.data_inicio IS 'Data e hora exata para início de exibições temáticas';
COMMENT ON COLUMN public.home_sections.data_fim IS 'Data e hora exata para fim de exibições temáticas';

-- Garante que a ordenação 'random' seja sempre respeitada no front
-- e que o RLS continue permitindo a leitura.