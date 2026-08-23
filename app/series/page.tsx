import { supabaseServer } from '@/lib/supabase/server';
import { CategoryCarousel } from '@/components/CategoryCarousel';
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

async function getGeneros(): Promise<string[]> {
  const { data } = await supabaseServer.from('series').select('genero').not('genero', 'is', null);
  return Array.from(new Set((data || []).map((d) => d.genero as string)));
}

async function getByGenero(genero: string): Promise<Cinema[]> {
  const { data } = await supabaseServer
    .from('series')
    .select('*')
    .eq('genero', genero)
    .order('created_at', { ascending: false });
  return (data || []).map(toCardShape);
}

export default async function SeriesPage() {
  const generos = await getGeneros();
  const grupos = await Promise.all(
    generos.map(async (g) => ({ genero: g, items: await getByGenero(g) }))
  );

  return (
    <div className="pt-8">
      <h1 className="px-5 text-xl font-medium mb-2">Séries</h1>
      {grupos.map(({ genero, items }) => (
        <CategoryCarousel key={genero} titulo={genero} items={items} basePath="series" />
      ))}
    </div>
  );
}
