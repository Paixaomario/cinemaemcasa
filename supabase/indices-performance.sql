-- Índices recomendados para o Cinema em Casa suportar catálogos
-- grandes (dezenas/centenas de milhares de títulos) sem lentidão.
-- Rode isso no SQL Editor do Supabase. Não altera nenhuma coluna
-- existente — só adiciona índices (seguro, reversível, não quebra
-- nada que já funciona).

-- Necessário para os índices de trigram (busca por padrão/substring)
create extension if not exists pg_trgm;

-- As páginas de Filmes/Séries buscam por categoria com ILIKE (um
-- título pode estar em mais de uma categoria, separadas por vírgula
-- no mesmo campo). Sem este índice, cada busca de categoria vira uma
-- varredura da tabela inteira — catastrófico em 200 mil linhas.
create index if not exists idx_cinema_category_trgm
  on public.cinema using gin (category gin_trgm_ops);

create index if not exists idx_series_genero_trgm
  on public.series using gin (genero gin_trgm_ops);

-- Acelera "melhor avaliado" (usado no banner hero e nas recomendações),
-- que hoje faz ORDER BY rating em toda consulta.
create index if not exists idx_cinema_rating_desc
  on public.cinema using btree (rating desc nulls last);

create index if not exists idx_series_rating_desc
  on public.series using btree (rating desc nulls last);

-- Acelera a lista de episódios por temporada, ordenada por número.
create index if not exists idx_episodios_temporada_numero
  on public.episodios using btree (temporada_id, numero_episodio);

-- Acelera a busca de "Continuar assistindo" (Home) por usuário mais
-- recente ainda não terminado.
create index if not exists idx_view_progress_user_naofinalizado
  on public.view_progress using btree (user_id, updated_at desc)
  where is_finished = false;

analyze public.cinema;
analyze public.series;
analyze public.episodios;
analyze public.view_progress;
