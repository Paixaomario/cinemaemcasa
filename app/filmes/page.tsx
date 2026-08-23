import { supabaseServer } from '@/lib/supabase/server';
import { CategoryCarousel } from '@/components/CategoryCarousel';
import { CATEGORIAS_FILMES, categoriasDoTitulo } from '@/lib/categorias';
import type { Cinema } from '@/lib/types';

async function getTodosFilmes(): Promise<Cinema[]> {
  const { data } = await supabaseServer
    .from('cinema')
    .select('*')
    .eq('type', 'movie')
    .order('created_at', { ascending: false });
  return data || [];
}

export default async function FilmesPage() {
  const filmes = await getTodosFilmes();

  // Agente da página Filmes: cada título pode aparecer em mais de uma
  // categoria (conforme o campo `category` no banco), respeitando
  // sempre a ordem e a lista fixa definida em lib/categorias.ts — sem
  // criar categorias novas e sem repetir a mesma categoria duas vezes.
  const porCategoria = new Map<string, Cinema[]>();
  for (const filme of filmes) {
    for (const categoria of categoriasDoTitulo(filme.category)) {
      if (!porCategoria.has(categoria)) porCategoria.set(categoria, []);
      porCategoria.get(categoria)!.push(filme);
    }
  }

  const secoes = CATEGORIAS_FILMES.map((categoria) => ({
    categoria,
    items: porCategoria.get(categoria) || []
  })).filter((s) => s.items.length > 0);

  return (
    <div className="pt-8">
      <h1 className="px-3 text-xl font-medium mb-2">Filmes</h1>
      {secoes.map(({ categoria, items }) => (
        <CategoryCarousel key={categoria} titulo={categoria} items={items} basePath="filmes" />
      ))}
    </div>
  );
}
