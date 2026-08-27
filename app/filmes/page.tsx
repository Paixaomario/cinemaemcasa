import { supabasePublic } from '@/lib/supabase/server';
import { CategoryCarousel } from '@/components/CategoryCarousel';
import { HeroBanner } from '@/components/HeroBanner';
import { enrichHeroes } from '@/lib/heroEnrichment';
import { CATEGORIAS_FILMES } from '@/lib/categorias';
import type { Cinema } from '@/lib/types';

// ISR: a página fica em cache por 5 minutos em vez de bater no banco a
// cada visita — essencial com um catálogo grande. Ajuste esse número
// se quiser refletir novos títulos mais rápido (custa mais consultas).
export const revalidate = 300;

const ITENS_POR_CATEGORIA = 30;

// Agente da página Filmes: cada categoria busca DIRETO no banco (com
// limite e índice), em vez de trazer o catálogo inteiro pra memória e
// filtrar em JavaScript como antes — aquilo não escalava além de
// alguns milhares de títulos. Requer o índice gin_trgm em
// `cinema.category` (ver supabase/indices-performance.sql).
async function getPorCategoria(categoria: string): Promise<Cinema[]> {
  const { data } = await supabasePublic
    .from('cinema')
    .select('*')
    .eq('type', 'movie')
    .ilike('category', `%${categoria}%`)
    .order('rating', { ascending: false })
    .limit(ITENS_POR_CATEGORIA);
  return data || [];
}

async function getHeroesFilme(): Promise<Cinema[]> {
  const { data } = await supabasePublic
    .from('cinema')
    .select('*')
    .eq('type', 'movie')
    .order('rating', { ascending: false })
    .limit(40);
  return data || [];
}

// Agente da página Filmes: sem título de página (removido a pedido) —
// o banner hero já identifica a seção visualmente.
export default async function FilmesPage() {
  const [heroesBase, ...secoes] = await Promise.all([
    getHeroesFilme(),
    ...CATEGORIAS_FILMES.map(async (categoria) => ({
      categoria,
      items: await getPorCategoria(categoria)
    }))
  ] as [Promise<Cinema[]>, ...Promise<{ categoria: string; items: Cinema[] }>[]]);

  const heroes = await enrichHeroes(heroesBase);
  const secoesComItens = secoes.filter((s) => s.items.length > 0);

  return (
    <div>
      {heroes.length > 0 && <HeroBanner heroes={heroes} />}
      {secoesComItens.map(({ categoria, items }) => (
        <CategoryCarousel key={categoria} titulo={categoria} items={items} basePath="filmes" />
      ))}
    </div>
  );
}
