-- Rode isso no SQL Editor do Supabase e me mande o resultado (print
-- ou copiar o texto). Isso mostra exatamente o que está salvo pra cada
-- filme da saga Harry Potter — vou comparar os valores de poster/
-- banner/backdrop entre eles pra ver se são realmente diferentes ou
-- se algum está repetido.

select id, titulo, poster, banner, backdrop, tmdb_id, category
from public.cinema
where titulo ilike '%harry potter%'
order by titulo;

-- Se puder, rode também esse aqui pra "Velozes e Furiosos":
select id, titulo, poster, banner, backdrop, tmdb_id, category
from public.cinema
where titulo ilike '%velozes%' or titulo ilike '%furious%'
order by titulo;
