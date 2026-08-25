import { supabaseServer } from '@/lib/supabase/server';
import { CategoryCarousel } from '@/components/CategoryCarousel';
import { HeroBanner } from '@/components/HeroBanner';
import { enrichHeroes } from '@/lib/heroEnrichment';
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

async function getHeroesFilme(filmes: Cinema[]): Promise<Cinema[]> {
  if (filmes.length === 0) return [];
  return [...filmes].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);
}

// Agente da página Filmes: sem título de página (removido a pedido) —
// o banner hero já identifica a seção visualmente.
export default async function FilmesPage() {
  const filmes = await getTodosFilmes();
  const heroesBase = await getHeroesFilme(filmes);
  const heroes = await enrichHeroes(heroesBase);

  // Cada título pode aparecer em mais de uma categoria (conforme o
  // campo `category` no banco), respeitando sempre a ordem e a lista
  // fixa definida em lib/categorias.ts — sem criar categorias novas e
  // sem repetir a mesma categoria duas vezes.
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
    <div>
      {heroes.length > 0 && <HeroBanner heroes={heroes} />}
      <div className="pt-4">
        {secoes.map(({ categoria, items }) => (
          <CategoryCarousel key={categoria} titulo={categoria} items={items} basePath="filmes" />
        ))}
      </div>
    </div>
  );
}
