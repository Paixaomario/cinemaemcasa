import { supabaseServer } from '@/lib/supabase/server';
import { CategoryCarousel } from '@/components/CategoryCarousel';
import type { Cinema } from '@/lib/types';

async function getCategorias(): Promise<string[]> {
  const { data } = await supabaseServer
    .from('cinema')
    .select('category')
    .eq('type', 'movie')
    .not('category', 'is', null);

  const unique = Array.from(new Set((data || []).map((d) => d.category as string)));
  return unique;
}

async function getByCategoria(categoria: string): Promise<Cinema[]> {
  const { data } = await supabaseServer
    .from('cinema')
    .select('*')
    .eq('type', 'movie')
    .eq('category', categoria)
    .order('created_at', { ascending: false });
  return data || [];
}

export default async function FilmesPage() {
  const categorias = await getCategorias();
  const grupos = await Promise.all(
    categorias.map(async (c) => ({ categoria: c, items: await getByCategoria(c) }))
  );

  return (
    <div className="pt-8">
      <h1 className="px-5 text-xl font-medium mb-2">Filmes</h1>
      {grupos.map(({ categoria, items }) => (
        <CategoryCarousel key={categoria} titulo={categoria} items={items} basePath="filmes" />
      ))}
    </div>
  );
}
