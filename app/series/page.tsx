import { supabasePublic } from '@/lib/supabase/server';
import { CategoryCarousel } from '@/components/CategoryCarousel';
import { HeroBanner } from '@/components/HeroBanner';
import { enrichHeroes } from '@/lib/heroEnrichment';
import { buscarSeriesPorGenero } from '@/lib/catalogoPorCategoria';
import type { Cinema } from '@/lib/types';

async function getGeneros(): Promise<string[]> {
  const { data } = await supabasePublic.from('series').select('genero').not('genero', 'is', null);
  const unicos = Array.from(new Set((data || []).map((d) => d.genero as string)));
  // Agente de Séries: categorias em ordem alfabética (pt-BR).
  return unicos.sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

// ISR: cache de 5 minutos — evita bater no banco a cada visita.
export const revalidate = 300;

// Agente da página Séries: cada gênero mostra o PRIMEIRO lote (mais
// bem avaliados) já vindo do servidor — o resto é carregado sob
// demanda pelo próprio CategoryCarousel conforme o usuário rola (ver
// /api/categoria), sem limite máximo de itens por categoria.
export default async function SeriesPage() {
  const generos = await getGeneros();
  const grupos = await Promise.all(
    generos.map(async (genero) => ({ genero, ...(await buscarSeriesPorGenero(genero, 0)) }))
  );
  const gruposComItens = grupos.filter((g) => g.items.length > 0);

  const todasSeries = gruposComItens.flatMap((g) => g.items);
  const heroesBase = [...todasSeries].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 40);

  const idsHero = heroesBase.map((h) => h.id);
  const { data: classificacoes } = idsHero.length
    ? await supabasePublic.from('series').select('id_n, classificacao').in('id_n', idsHero)
    : { data: [] as { id_n: number; classificacao: string | null }[] };

  const mapaClassificacao = new Map(
    (classificacoes || []).map((c) => [c.id_n, c.classificacao] as const)
  );
  const heroes = await enrichHeroes(heroesBase, mapaClassificacao);

  return (
    <div>
      {heroes.length > 0 && <HeroBanner heroes={heroes} />}
      <div className="pt-4">
        {gruposComItens.map(({ genero, items, fim }) => (
          <CategoryCarousel
            key={genero}
            titulo={genero}
            itensIniciais={items}
            fimInicial={fim}
            categoria={genero}
            tipo="serie"
            basePath="series"
          />
        ))}
      </div>
    </div>
  );
}
