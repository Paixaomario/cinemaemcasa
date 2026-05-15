-- ============================================================
-- PAIXAOFLIX — Migração inicial do banco de dados
-- Execute no Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username    TEXT UNIQUE,
  full_name   TEXT,
  avatar_url  TEXT,
  is_admin    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- TABELA: content (filmes, series, episodios)
-- ============================================================
CREATE TYPE content_type AS ENUM ('movie', 'series', 'episode');

CREATE TABLE IF NOT EXISTS public.content (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title            TEXT NOT NULL,
  description      TEXT,
  type             content_type NOT NULL,
  genre            TEXT[] DEFAULT '{}',
  categories       TEXT[] DEFAULT '{}',
  thumbnail_url    TEXT,
  backdrop_url     TEXT,
  video_url        TEXT,
  trailer_url      TEXT,
  duration_seconds INTEGER,
  year             INTEGER,
  rating           TEXT,
  cast_names       TEXT[] DEFAULT '{}',
  director         TEXT,
  parent_id        UUID REFERENCES public.content(id) ON DELETE CASCADE,
  season_number    INTEGER,
  episode_number   INTEGER,
  is_published     BOOLEAN DEFAULT FALSE,
  is_featured      BOOLEAN DEFAULT FALSE,
  views_count      INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER content_updated_at
  BEFORE UPDATE ON public.content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_content_type       ON public.content(type);
CREATE INDEX IF NOT EXISTS idx_content_published  ON public.content(is_published);
CREATE INDEX IF NOT EXISTS idx_content_featured   ON public.content(is_featured);
CREATE INDEX IF NOT EXISTS idx_content_parent     ON public.content(parent_id);
CREATE INDEX IF NOT EXISTS idx_content_genre      ON public.content USING GIN(genre);
CREATE INDEX IF NOT EXISTS idx_content_categories ON public.content USING GIN(categories);

-- ============================================================
-- TABELA: home_sections
-- Controla dinamicamente o que aparece na home
-- ============================================================
CREATE TABLE IF NOT EXISTS public.home_sections (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Nome que aparece na home
  title          TEXT NOT NULL,

  -- Tipo de layout:
  -- 'hero'      = banner grande (use apenas 1 por home)
  -- 'row'       = carrossel de posters (2:3)
  -- 'row_wide'  = carrossel de cards wide (16:9)
  -- 'grid'      = grade de posters
  layout         TEXT NOT NULL DEFAULT 'row'
                 CHECK (layout IN ('hero', 'row', 'row_wide', 'grid')),

  -- Filtros (multiplos valores, combinados com OR dentro de cada campo)
  content_types  TEXT[] DEFAULT '{}',   -- ex: ARRAY['movie','series']
  genres         TEXT[] DEFAULT '{}',   -- ex: ARRAY['Acao','Aventura'] — vazio = todos
  categories     TEXT[] DEFAULT '{}',   -- ex: ARRAY['Lancamentos'] — vazio = sem filtro

  -- Ordenacao
  order_by       TEXT NOT NULL DEFAULT 'created_at_desc'
                 CHECK (order_by IN ('created_at_desc','views_desc','year_desc','title_asc')),

  -- Maximo de itens
  item_limit     INTEGER NOT NULL DEFAULT 20 CHECK (item_limit BETWEEN 1 AND 100),

  -- Posicao na home (menor aparece primeiro)
  position       INTEGER NOT NULL DEFAULT 0,

  -- Secao visivel na home?
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,

  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER home_sections_updated_at
  BEFORE UPDATE ON public.home_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_home_sections_active   ON public.home_sections(is_active);
CREATE INDEX IF NOT EXISTS idx_home_sections_position ON public.home_sections(position);

-- Secoes padrao (voce pode editar no admin depois)
INSERT INTO public.home_sections (title, layout, content_types, genres, categories, order_by, item_limit, position) VALUES
  ('Destaques',         'hero',     ARRAY['movie','series'],  ARRAY[]::TEXT[], ARRAY[]::TEXT[],        'created_at_desc', 5,  0),
  ('Lancamentos',       'row',      ARRAY['movie','series'],  ARRAY[]::TEXT[], ARRAY['Lancamentos'],   'created_at_desc', 20, 2),
  ('Filmes em Alta',    'row',      ARRAY['movie'],           ARRAY[]::TEXT[], ARRAY[]::TEXT[],        'views_desc',      20, 3),
  ('Series Populares',  'row',      ARRAY['series'],          ARRAY[]::TEXT[], ARRAY[]::TEXT[],        'views_desc',      20, 4),
  ('Acao e Aventura',   'row',      ARRAY['movie','series'],  ARRAY['Acao','Aventura'], ARRAY[]::TEXT[],'views_desc',     20, 5),
  ('Comedia',           'row',      ARRAY['movie','series'],  ARRAY['Comedia'], ARRAY[]::TEXT[],       'created_at_desc', 20, 6),
  ('Documentarios',     'row_wide', ARRAY['movie'],           ARRAY['Documentario'], ARRAY[]::TEXT[],  'year_desc',       20, 7),
  ('Top 10 da Semana',  'grid',     ARRAY['movie','series'],  ARRAY[]::TEXT[], ARRAY['Top 10'],        'views_desc',      10, 8);

-- ============================================================
-- TABELA: watch_history
-- ============================================================
CREATE TABLE IF NOT EXISTS public.watch_history (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id       UUID REFERENCES public.content(id) ON DELETE CASCADE NOT NULL,
  progress_seconds INTEGER DEFAULT 0,
  completed        BOOLEAN DEFAULT FALSE,
  watched_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_watch_history_user ON public.watch_history(user_id);

-- ============================================================
-- TABELA: favorites
-- ============================================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_sections  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY "content_select"      ON public.content FOR SELECT TO authenticated
  USING (is_published = true OR is_admin());
CREATE POLICY "content_admin_write" ON public.content FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "home_sections_read"        ON public.home_sections FOR SELECT TO authenticated USING (true);
CREATE POLICY "home_sections_admin_write" ON public.home_sections FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "watch_history_own" ON public.watch_history FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorites_own" ON public.favorites FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- STORAGE
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('thumbnails', 'thumbnails', true)  ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('backdrops',  'backdrops',  true)  ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('videos',     'videos',     false) ON CONFLICT DO NOTHING;

CREATE POLICY "thumbnails_read"  ON storage.objects FOR SELECT USING (bucket_id = 'thumbnails');
CREATE POLICY "backdrops_read"   ON storage.objects FOR SELECT USING (bucket_id = 'backdrops');
CREATE POLICY "thumbnails_admin" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'thumbnails' AND is_admin());
CREATE POLICY "backdrops_admin"  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'backdrops'  AND is_admin());
CREATE POLICY "videos_read"      ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'videos');
CREATE POLICY "videos_admin"     ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'videos'     AND is_admin());

-- ============================================================
-- APOS CRIAR SUA CONTA, EXECUTE PARA VIRAR ADMIN:
-- UPDATE public.profiles SET is_admin = true WHERE id = 'SEU-USER-ID';
-- ============================================================
