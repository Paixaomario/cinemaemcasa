import { supabasePublic } from '@/lib/supabase/server';
import { CategoryCarousel } from '@/components/CategoryCarousel';
import { HeroBanner } from '@/components/HeroBanner';
import { enrichHeroes } from '@/lib/heroEnrichment';
import { buscarFilmesPorCategoria } from '@/lib/catalogoPorCategoria';
import { CATEGORIAS_FILMES } from '@/lib/categorias';
import type { Cinema } from '@/lib/types';

// ISR: a página fica em cache por 5 minutos em vez de bater no banco a
// cada visita — essencial com um catálogo grande.
export const revalidate = 300;

async function getHeroesFilme(): Promise<Cinema[]> {
  const { data } = await supabasePublic
    .from('cinema')
    .select('*')
    .eq('type', 'movie')
    .order('rating', { ascending: false })
    .limit(40);
  return data || [];
}

// Agente da página Filmes: cada categoria mostra o PRIMEIRO lote (mais
// bem avaliados) já vindo do servidor — o resto é carregado sob
// demanda pelo próprio CategoryCarousel conforme o usuário rola (ver
// /api/categoria), sem limite máximo de itens por categoria.
export default async function FilmesPage() {
  const [heroesBase, ...secoes] = await Promise.all([
    getHeroesFilme(),
    ...CATEGORIAS_FILMES.map(async (categoria) => ({
      categoria,
      ...(await buscarFilmesPorCategoria(categoria, 0))
    }))
  ] as [Promise<Cinema[]>, ...Promise<{ categoria: string; items: Cinema[]; fim: boolean }>[]]);

  const heroes = await enrichHeroes(heroesBase);
  const secoesComItens = secoes.filter((s) => s.items.length > 0);

  return (
    <div>
      {heroes.length > 0 && <HeroBanner heroes={heroes} />}
      {secoesComItens.map(({ categoria, items, fim }) => (
        <CategoryCarousel
          key={categoria}
          titulo={categoria}
          itensIniciais={items}
          fimInicial={fim}
          categoria={categoria}
          tipo="filme"
          basePath="filmes"
        />
      ))}
    </div>
  );
}
