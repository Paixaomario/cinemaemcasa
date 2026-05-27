-- Normalizar campos de capa/poster para consistência
-- Este script garante que o campo 'poster' seja sempre preenchido com a capa correta

-- 1. Para tabela cinema: garantir que poster tenha valor
UPDATE public.cinema 
SET poster = COALESCE(poster, capa, poster_path, backdrop, banner)
WHERE poster IS NULL AND (capa IS NOT NULL OR poster_path IS NOT NULL OR backdrop IS NOT NULL OR banner IS NOT NULL);

-- 2. Para tabela series: garantir que poster tenha valor (priorizar capa)
UPDATE public.series 
SET poster = COALESCE(poster, capa, banner)
WHERE poster IS NULL AND (capa IS NOT NULL OR banner IS NOT NULL);

-- 3. Para tabela temporadas: garantir que capa tenha valor
UPDATE public.temporadas 
SET capa = COALESCE(capa, poster, banner)
WHERE capa IS NULL AND (poster IS NOT NULL OR banner IS NOT NULL);

-- 4. Adicionar comentários para documentar os campos
COMMENT ON COLUMN public.cinema.poster IS 'Capa/poster principal do filme (prioridade: poster > capa > poster_path > backdrop > banner)';
COMMENT ON COLUMN public.cinema.capa IS 'Campo legado para capa, usar poster como principal';
COMMENT ON COLUMN public.series.poster IS 'Capa/poster principal da série (prioridade: poster > capa > banner)';
COMMENT ON COLUMN public.series.capa IS 'Campo legado para capa, usar poster como principal';
COMMENT ON COLUMN public.temporadas.capa IS 'Capa da temporada (prioridade: capa > poster > banner)';

-- 5. Criar função para normalizar capas automaticamente
CREATE OR REPLACE FUNCTION normalize_cover_fields()
RETURNS VOID AS $$
BEGIN
  -- Normalizar cinema
  UPDATE public.cinema 
  SET poster = COALESCE(poster, capa, poster_path, backdrop, banner)
  WHERE poster IS NULL AND (capa IS NOT NULL OR poster_path IS NOT NULL OR backdrop IS NOT NULL OR banner IS NOT NULL);
  
  -- Normalizar series
  UPDATE public.series 
  SET poster = COALESCE(poster, capa, banner)
  WHERE poster IS NULL AND (capa IS NOT NULL OR banner IS NOT NULL);
  
  -- Normalizar temporadas
  UPDATE public.temporadas 
  SET capa = COALESCE(capa, poster, banner)
  WHERE capa IS NULL AND (poster IS NOT NULL OR banner IS NOT NULL);
END;
$$ LANGUAGE plpgsql;

-- 6. Criar trigger para normalizar automaticamente antes de insert/update
CREATE OR REPLACE FUNCTION trigger_normalize_cover_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Para cinema
  IF TG_TABLE_NAME = 'cinema' THEN
    NEW.poster := COALESCE(NEW.poster, NEW.capa, NEW.poster_path, NEW.backdrop, NEW.banner);
  END IF;
  
  -- Para series
  IF TG_TABLE_NAME = 'series' THEN
    NEW.poster := COALESCE(NEW.poster, NEW.capa, NEW.banner);
  END IF;
  
  -- Para temporadas
  IF TG_TABLE_NAME = 'temporadas' THEN
    NEW.capa := COALESCE(NEW.capa, NEW.poster, NEW.banner);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Adicionar triggers
DROP TRIGGER IF EXISTS normalize_cinema_cover ON public.cinema;
CREATE TRIGGER normalize_cinema_cover
  BEFORE INSERT OR UPDATE ON public.cinema
  FOR EACH ROW
  EXECUTE FUNCTION trigger_normalize_cover_fields();

DROP TRIGGER IF EXISTS normalize_series_cover ON public.series;
CREATE TRIGGER normalize_series_cover
  BEFORE INSERT OR UPDATE ON public.series
  FOR EACH ROW
  EXECUTE FUNCTION trigger_normalize_cover_fields();

DROP TRIGGER IF EXISTS normalize_temporadas_cover ON public.temporadas;
CREATE TRIGGER normalize_temporadas_cover
  BEFORE INSERT OR UPDATE ON public.temporadas
  FOR EACH ROW
  EXECUTE FUNCTION trigger_normalize_cover_fields();
