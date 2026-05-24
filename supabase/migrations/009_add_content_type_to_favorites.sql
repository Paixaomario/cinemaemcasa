-- Adicionar coluna content_type para distinguir filmes de séries
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS content_type VARCHAR(10);
