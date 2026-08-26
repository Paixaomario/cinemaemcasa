import { supabaseServer } from '@/lib/supabase/server';
import { CategoryCarousel } from '@/components/CategoryCarousel';
import { HeroBanner } from '@/components/HeroBanner';
import { enrichHeroes } from '@/lib/heroEnrichment';
import { getPosterDoTMDB } from '@/lib/tmdb';
import type { Cinema, Serie } from '@/lib/types';

function toCardShape(serie: Serie): Cinema {
  return {
    id: serie.id_n,
    titulo: serie.titulo || '',
    description: serie.descricao,
    tmdb_id: serie.tmdb_id,
    url: null,
    trailer: serie.trailer,
    year: serie.ano,
    rating: serie.rating,
    duration: serie.tmdb_runtime,
    duration_seconds: null,
    category: serie.genero,
    genre: serie.genero,
    type: 'series',
    poster: serie.poster || serie.capa,
    banner: serie.banner,
    backdrop: null,
    created_at: '',
    subtitles: null,
    audio_tracks: null,
    elenco: serie.elenco,
    relacionados: serie.relacionados
  };
}

// Se a série não tem NENHUMA imagem própria (poster/capa/banner vazios
// no Supabase) mas tem tmdb_id, busca o pôster no TMDB como último
// recurso — evita capa em branco quando o dado só existe lá fora.
async function comFallbackDeCapa(item: Cinema): Promise<Cinema> {
  if (item.poster || item.banner || !item.tmdb_id) return item;
  const posterTMDB = await getPosterDoTMDB(item.tmdb_id, 'series');
  return posterTMDB ? { ...item, poster: posterTMDB } : item;
}

async function getGeneros(): Promise<string[]> {
  const { data } = await supabaseServer.from('series').select('genero').not('genero', 'is', null);
  const unicos = Array.from(new Set((data || []).map((d) => d.genero as string)));
  // Agente de Séries: categorias em ordem alfabética (pt-BR).
  return unicos.sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

async function getByGenero(genero: string): Promise<Cinema[]> {
  const { data } = await supabaseServer
    .from('series')
    .select('*')
    .eq('genero', genero)
    .order('created_at', { ascending: false });
  const itens = (data || []).map(toCardShape);
  return Promise.all(itens.map(comFallbackDeCapa));
}

// Agente da página Séries: sem título de página (removido a pedido) —
// o banner hero já identifica a seção visualmente.
export default async function SeriesPage() {
  const generos = await getGeneros();
  const grupos = await Promise.all(
    generos.map(async (g) => ({ genero: g, items: await getByGenero(g) }))
  );

  const todasSeries = grupos.flatMap((g) => g.items);
  const heroesBase = [...todasSeries].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 40);

  const idsHero = heroesBase.map((h) => h.id);
  const { data: classificacoes } = idsHero.length
    ? await supabaseServer.from('series').select('id_n, classificacao').in('id_n', idsHero)
    : { data: [] as { id_n: number; classificacao: string | null }[] };

  const mapaClassificacao = new Map(
    (classificacoes || []).map((c) => [c.id_n, c.classificacao] as const)
  );
  const heroes = await enrichHeroes(heroesBase, mapaClassificacao);

  return (
    <div>
      {heroes.length > 0 && <HeroBanner heroes={heroes} />}
      <div className="pt-4">
        {grupos.map(({ genero, items }) => (
          <CategoryCarousel key={genero} titulo={genero} items={items} basePath="series" />
        ))}
      </div>
    </div>
  );
}
