-- ============================================================
-- PAIXAOFLIX — home_sections configurável
-- Cole no SQL Editor do Supabase
-- ============================================================

-- ── TABELA: home_sections ──────────────────────────────────
-- Cada linha = uma seção da home
-- Admin edita diretamente no Supabase Table Editor
CREATE TABLE IF NOT EXISTS public.home_sections (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Nome que aparece na home (ex: "Ação e Aventura")
  titulo        TEXT NOT NULL,

  -- Categorias de conteúdo — aceita múltiplas separadas por vírgula
  -- Exemplos: "Ação", "Ação,Aventura", "Drama,Romance"
  -- Deve corresponder ao campo category da tabela cinema
  categorias    TEXT[] NOT NULL DEFAULT '{}',

  -- Fonte dos dados:
  -- 'cinema'  → busca da tabela cinema do Supabase
  -- 'tmdb'    → busca da API TMDB (trending, popular etc.)
  fonte         TEXT NOT NULL DEFAULT 'cinema'
                CHECK (fonte IN ('cinema','tmdb')),

  -- Para fonte='tmdb': qual endpoint usar
  -- ex: 'trending/movie/week', 'movie/popular', 'tv/popular'
  tmdb_endpoint TEXT,

  -- Tipo de layout da seção
  -- 'row'     → carrossel horizontal (padrão)
  -- 'grid'    → grade responsiva
  -- 'featured'→ destaque grande
  layout        TEXT NOT NULL DEFAULT 'row'
                CHECK (layout IN ('row','grid','featured')),

  -- Máximo de capas na seção (máx 5 conforme especificado)
  limite        INTEGER NOT NULL DEFAULT 5
                CHECK (limite BETWEEN 1 AND 5),

  -- Ordenação das capas
  -- 'created_at_desc' → mais recentes
  -- 'rating_desc'     → melhor avaliados
  -- 'year_desc'       → mais novos por ano
  -- 'random'          → aleatório (muda a cada visita)
  ordenacao     TEXT NOT NULL DEFAULT 'created_at_desc'
                CHECK (ordenacao IN ('created_at_desc','rating_desc','year_desc','random')),

  -- Posição na home (0 = topo)
  posicao       INTEGER NOT NULL DEFAULT 0,

  -- Seção visível?
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,

  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_home_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER home_sections_updated_at
  BEFORE UPDATE ON public.home_sections
  FOR EACH ROW EXECUTE FUNCTION update_home_sections_updated_at();

-- Índices
CREATE INDEX IF NOT EXISTS idx_home_sections_ativo    ON public.home_sections(ativo);
CREATE INDEX IF NOT EXISTS idx_home_sections_posicao  ON public.home_sections(posicao);

-- RLS
ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "home_sections_read"  ON public.home_sections FOR SELECT TO authenticated USING (true);
CREATE POLICY "home_sections_write" ON public.home_sections FOR ALL    TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ── SEÇÕES PADRÃO ──────────────────────────────────────────
INSERT INTO public.home_sections (titulo, categorias, fonte, layout, limite, ordenacao, posicao) VALUES
  ('Em Destaque',          ARRAY[]::TEXT[],              'tmdb', 'featured', 5, 'random',          0),
  ('Lançamentos',          ARRAY[]::TEXT[],              'cinema','row',     5, 'created_at_desc', 1),
  ('Mais Bem Avaliados',   ARRAY[]::TEXT[],              'cinema','row',     5, 'rating_desc',     2),
  ('Ação e Aventura',      ARRAY['Ação','Aventura'],     'cinema','row',     5, 'rating_desc',     3),
  ('Comédia',              ARRAY['Comédia'],             'cinema','row',     5, 'created_at_desc', 4),
  ('Drama',                ARRAY['Drama'],               'cinema','row',     5, 'rating_desc',     5),
  ('Suspense e Terror',    ARRAY['Suspense','Terror'],   'cinema','row',     5, 'rating_desc',     6),
  ('Ficção Científica',    ARRAY['Ficção Científica'],   'cinema','row',     5, 'created_at_desc', 7),
  ('Documentários',        ARRAY['Documentário'],        'cinema','grid',    5, 'year_desc',       8),
  ('Populares no TMDB',    ARRAY[]::TEXT[],              'tmdb', 'row',      5, 'random',          9);

-- ── FUNÇÃO: buscar conteúdo de uma seção ──────────────────
-- Uso: SELECT * FROM get_home_section('uuid-da-secao');
CREATE OR REPLACE FUNCTION get_home_section(section_id UUID)
RETURNS TABLE (
  id          BIGINT,
  titulo      TEXT,
  poster      TEXT,
  banner      TEXT,
  backdrop    TEXT,
  year        BIGINT,
  rating      DOUBLE PRECISION,
  description TEXT,
  category    TEXT,
  type        TEXT,
  url         TEXT,
  trailer     TEXT,
  duration    TEXT
) AS $$
DECLARE
  sec public.home_sections;
  order_clause TEXT;
BEGIN
  SELECT * INTO sec FROM public.home_sections WHERE home_sections.id = section_id AND ativo = TRUE;
  IF NOT FOUND THEN RETURN; END IF;

  order_clause := CASE sec.ordenacao
    WHEN 'rating_desc'     THEN 'rating DESC NULLS LAST'
    WHEN 'year_desc'       THEN 'year DESC NULLS LAST'
    WHEN 'random'          THEN 'RANDOM()'
    ELSE 'created_at DESC NULLS LAST'
  END;

  RETURN QUERY EXECUTE format(
    'SELECT c.id, c.titulo, c.poster, c.banner, c.backdrop,
            c.year, c.rating, c.description, c.category, c.type,
            c.url, c.trailer, c.duration
     FROM public.cinema c
     WHERE ($1 = ARRAY[]::TEXT[] OR c.category = ANY($1))
     ORDER BY %s
     LIMIT %s',
    order_clause,
    sec.limite
  ) USING sec.categorias;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ── VIEW: todas as seções ativas com dados ─────────────────
CREATE OR REPLACE VIEW public.home_sections_ativas AS
SELECT * FROM public.home_sections
WHERE ativo = TRUE
ORDER BY posicao ASC;

-- ============================================================
-- COMO USAR NO SUPABASE TABLE EDITOR:
--
-- 1. Acesse app.supabase.com → Table Editor → home_sections
-- 2. Para CRIAR uma seção: clique em "Insert Row"
--    - titulo: "Minha Seção"
--    - categorias: {"Ação","Aventura"}  ← array de strings
--    - fonte: cinema (ou tmdb)
--    - limite: 5  ← máximo de capas
--    - posicao: 10  ← onde aparece na home
--    - ativo: true
-- 3. Para DESATIVAR: mude ativo = false
-- 4. Para REORDENAR: mude o campo posicao
-- ============================================================
