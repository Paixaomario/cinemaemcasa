-- 1. Remove a restrição de limite máximo de 5 para permitir um pool maior de candidatos (exclusividade)
ALTER TABLE public.home_sections DROP CONSTRAINT IF EXISTS home_sections_limite_check;
ALTER TABLE public.home_sections ADD CONSTRAINT home_sections_limite_check CHECK (limite >= 1 AND limite <= 50);

-- 2. Função otimizada para buscar itens aleatórios de todo o acervo (100k+)
-- Usamos TABLESAMPLE ou um OFFSET aleatório para performance extrema
CREATE OR REPLACE FUNCTION get_random_content_pool(cnt INTEGER)
RETURNS SETOF public.cinema AS $$
BEGIN
  RETURN QUERY 
  SELECT * FROM public.cinema 
  WHERE tmdb_id IS NOT NULL 
  ORDER BY RANDOM() 
  LIMIT cnt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Atualização da função get_home_section para suportar a ordenação randômica real
CREATE OR REPLACE FUNCTION get_home_section_v2(section_id UUID)
RETURNS SETOF public.cinema AS $$
DECLARE
  sec public.home_sections;
BEGIN
  SELECT * INTO sec FROM public.home_sections WHERE id = section_id AND ativo = TRUE;
  IF NOT FOUND THEN RETURN; END IF;

  RETURN QUERY EXECUTE format(
    'SELECT * FROM public.cinema 
     WHERE (%L = ARRAY[]::TEXT[] OR category = ANY(%L))
     ORDER BY %s 
     LIMIT %s',
    sec.categorias, 
    sec.categorias,
    CASE WHEN sec.ordenacao = 'random' THEN 'RANDOM()' ELSE 'created_at DESC' END,
    sec.limite * 4 -- Buscamos mais para o front-end poder filtrar duplicatas sem esvaziar a linha
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;