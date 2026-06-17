-- 007_create_series_tables.sql
-- Migration: Refined Series Schema
-- Description: Updated series, temporadas and episodios tables with better constraints, metadata and RLS

-- Garantir que as funções auxiliares existam antes de serem usadas em políticas e triggers
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.series (
  id_n BIGINT PRIMARY KEY,
  titulo TEXT,
  descricao TEXT,
  ano BIGINT,
  tmdb_id BIGINT UNIQUE,
  capa TEXT,
  banner TEXT,
  poster TEXT,
  trailer TEXT,
  genero TEXT,
  classificacao TEXT,
  rating DOUBLE PRECISION,
  tmdb_runtime TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.temporadas (
  id_n BIGINT PRIMARY KEY,
  serie_id BIGINT REFERENCES public.series(id_n) ON DELETE CASCADE NOT NULL,
  numero_temporada INTEGER,
  titulo TEXT,
  descricao TEXT,
  ano BIGINT,
  capa TEXT,
  banner TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.episodios (
  id_n BIGINT PRIMARY KEY,
  temporada_id BIGINT REFERENCES public.temporadas(id_n) ON DELETE CASCADE NOT NULL,
  numero_episodio BIGINT,
  titulo TEXT,
  descricao TEXT,
  duracao TEXT,
  arquivo TEXT,
  imagem_185 TEXT,
  imagem_342 TEXT,
  imagem_500 TEXT,
  banner TEXT,
  poster TEXT,
  capa TEXT,
  trailer TEXT,
  subtitles JSONB DEFAULT '[]'::jsonb,
  audio_tracks JSONB DEFAULT '[]'::jsonb,
  tmdb_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garantia de colunas para tabelas existentes (Correção para erro 42703)
DO $$ 
BEGIN 
  -- 1. Verificar series
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='series' AND column_name='tmdb_id') THEN
    ALTER TABLE public.series ADD COLUMN tmdb_id BIGINT;
  END IF;

  -- 2. Verificar episodios (trata o typo tmd_id_ref)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='episodios' AND column_name='tmd_id_ref') THEN
    ALTER TABLE public.episodios RENAME COLUMN tmd_id_ref TO tmdb_id;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='episodios' AND column_name='tmdb_id') THEN
    ALTER TABLE public.episodios ADD COLUMN tmdb_id BIGINT;
  END IF;

  -- 3. Adicionar colunas de metadados que podem faltar em episodios
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='episodios' AND column_name='poster') THEN
    ALTER TABLE public.episodios ADD COLUMN poster TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='episodios' AND column_name='capa') THEN
    ALTER TABLE public.episodios ADD COLUMN capa TEXT;
  END IF;
END $$;

-- Índices para otimização de performance profissional
CREATE INDEX IF NOT EXISTS idx_series_tmdb_id ON public.series(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_temporadas_serie_id ON public.temporadas(serie_id);
CREATE INDEX IF NOT EXISTS idx_episodios_temporada_id ON public.episodios(temporada_id);
CREATE INDEX IF NOT EXISTS idx_episodios_tmdb_id ON public.episodios(tmdb_id);

-- Configuração de RLS (Row Level Security)
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temporadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodios ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura: Qualquer usuário autenticado pode ver o catálogo
DROP POLICY IF EXISTS "series_select_all" ON public.series;
CREATE POLICY "series_select_all" ON public.series FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "temporadas_select_all" ON public.temporadas;
CREATE POLICY "temporadas_select_all" ON public.temporadas FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "episodios_select_all" ON public.episodios;
CREATE POLICY "episodios_select_all" ON public.episodios FOR SELECT TO authenticated USING (true);

-- Políticas de Escrita: Apenas administradores (assumindo a função is_admin())
-- Nota: Caso a função is_admin() não exista, você pode substituir por: (auth.jwt() ->> 'email' = 'seu-email@admin.com')
DROP POLICY IF EXISTS "series_admin_write" ON public.series;
CREATE POLICY "series_admin_write" ON public.series FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "temporadas_admin_write" ON public.temporadas;
CREATE POLICY "temporadas_admin_write" ON public.temporadas FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "episodios_admin_write" ON public.episodios;
CREATE POLICY "episodios_admin_write" ON public.episodios FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Triggers para atualização automática de timestamp
-- Nota: Assume que a função update_updated_at() já existe no banco
DROP TRIGGER IF EXISTS tr_series_updated_at ON public.series;
CREATE TRIGGER tr_series_updated_at BEFORE UPDATE ON public.series 
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tr_temporadas_updated_at ON public.temporadas;
CREATE TRIGGER tr_temporadas_updated_at BEFORE UPDATE ON public.temporadas 
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tr_episodios_updated_at ON public.episodios;
CREATE TRIGGER tr_episodios_updated_at BEFORE UPDATE ON public.episodios 
FOR EACH ROW EXECUTE FUNCTION update_updated_at();