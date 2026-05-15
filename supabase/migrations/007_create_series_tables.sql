-- 007_create_series_tables.sql

-- Tabela para Series (metadados adicionais além da tabela cinema)
CREATE TABLE IF NOT EXISTS public.series (
  id_n BIGINT PRIMARY KEY, -- ID local da série, pode ser o mesmo que cinema.id ou um novo
  titulo TEXT,
  descricao TEXT,
  ano BIGINT,
  tmdb_id BIGINT UNIQUE, -- TMDB ID para linkar com cinema e TMDB API
  capa TEXT,
  banner TEXT,
  trailer TEXT,
  genero TEXT,
  classificacao TEXT,
  rating DOUBLE PRECISION,
  poster TEXT,
  tmdb_runtime TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para Temporadas
CREATE TABLE IF NOT EXISTS public.temporadas (
  id_n BIGINT PRIMARY KEY, -- ID local da temporada
  serie_id BIGINT REFERENCES public.series(id_n) ON DELETE CASCADE NOT NULL,
  numero_temporada BIGINT,
  capa TEXT,
  banner TEXT,
  titulo TEXT,
  ano BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para Episódios
CREATE TABLE IF NOT EXISTS public.episodios (
  id_n BIGINT PRIMARY KEY, -- ID local do episódio
  temporada_id BIGINT REFERENCES public.temporadas(id_n) ON DELETE CASCADE NOT NULL,
  numero_episodio BIGINT,
  titulo TEXT,
  descricao TEXT,
  duracao TEXT,
  arquivo TEXT, -- URL do arquivo de vídeo do episódio
  imagem_185 TEXT,
  imagem_342 TEXT,
  imagem_500 TEXT,
  banner TEXT,
  trailer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para as novas tabelas (assumindo is_admin() e update_updated_at() existem)
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temporadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "series_select_all" ON public.series FOR SELECT TO authenticated USING (true);
CREATE POLICY "temporadas_select_all" ON public.temporadas FOR SELECT TO authenticated USING (true);
CREATE POLICY "episodios_select_all" ON public.episodios FOR SELECT TO authenticated USING (true);

CREATE POLICY "series_admin_write" ON public.series FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "temporadas_admin_write" ON public.temporadas FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "episodios_admin_write" ON public.episodios FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER series_updated_at BEFORE UPDATE ON public.series FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER temporadas_updated_at BEFORE UPDATE ON public.temporadas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER episodios_updated_at BEFORE UPDATE ON public.episodios FOR EACH ROW EXECUTE FUNCTION update_updated_at();