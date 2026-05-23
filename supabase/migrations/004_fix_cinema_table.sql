-- 1. Garante que as colunas necessárias existam na tabela cinema
ALTER TABLE public.cinema 
ADD COLUMN IF NOT EXISTS tmdb_id BIGINT,
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

-- 3. Adiciona índices para melhorar a performance das buscas da Home
CREATE INDEX IF NOT EXISTS idx_cinema_tmdb_id ON public.cinema(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_cinema_category ON public.cinema(category);

-- Habilitar RLS se não estiver
ALTER TABLE public.cinema ENABLE ROW LEVEL SECURITY;