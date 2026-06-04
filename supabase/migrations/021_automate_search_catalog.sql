-- Função para Sincronizar Filmes (cinema) para o Catálogo
CREATE OR REPLACE FUNCTION sync_movie_to_catalog()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.search_catalog (source_table, source_id, tipo, titulo, descricao, genero, ano, poster, banner)
  VALUES (
    'cinema',
    NEW.id,
    'movie',
    NEW.titulo,
    NEW.descricao,
    NEW.category,
    NEW.ano,
    NEW.poster,
    NEW.backdrop
  )
  ON CONFLICT (source_table, source_id) DO UPDATE SET
    titulo = EXCLUDED.titulo,
    descricao = EXCLUDED.descricao,
    genero = EXCLUDED.genero,
    ano = EXCLUDED.ano,
    poster = EXCLUDED.poster,
    banner = EXCLUDED.banner;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para Sincronizar Séries para o Catálogo
CREATE OR REPLACE FUNCTION sync_series_to_catalog()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.search_catalog (source_table, source_id, tipo, titulo, descricao, genero, ano, poster, banner)
  VALUES (
    'series',
    NEW.id_n,
    'series',
    NEW.titulo,
    NEW.descricao,
    NEW.genero,
    NEW.ano,
    NEW.capa,
    NEW.banner
  )
  ON CONFLICT (source_table, source_id) DO UPDATE SET
    titulo = EXCLUDED.titulo,
    descricao = EXCLUDED.descricao,
    genero = EXCLUDED.genero,
    ano = EXCLUDED.ano,
    poster = EXCLUDED.poster,
    banner = EXCLUDED.banner;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Gatilhos (Triggers)
CREATE TRIGGER trigger_sync_movie AFTER INSERT OR UPDATE ON public.cinema FOR EACH ROW EXECUTE FUNCTION sync_movie_to_catalog();
CREATE TRIGGER trigger_sync_series AFTER INSERT OR UPDATE ON public.series FOR EACH ROW EXECUTE FUNCTION sync_series_to_catalog();