import { CategoryCarousel } from '@/components/CategoryCarousel';
import { buscarFilmesPorCategoria, buscarSeriesPorGenero } from '@/lib/catalogoPorCategoria';

export const revalidate = 300;

// Agente de Menu Infantil: atalho de acesso rápido — mostra só o que
// já está classificado como "Infantil" no banco, SEM remover essa
// categoria de nenhum outro lugar do sistema (Filmes, Séries, Home
// continuam mostrando normalmente). É só um caminho mais rápido pras
// crianças chegarem direto no que é pra elas.
export default async function InfantilPage() {
  const [filmes, series] = await Promise.all([
    buscarFilmesPorCategoria('Infantil', 0, 30),
    buscarSeriesPorGenero('Infantil', 0, 30)
  ]);

  return (
    <div className="pt-8">
      <h1 className="px-3 text-xl font-medium mb-2 flex items-center gap-2">
        <i className="ti ti-mood-kid text-gold" aria-hidden="true" />
        Infantil
      </h1>
      {filmes.items.length > 0 && (
        <CategoryCarousel
          titulo="Filmes"
          itensIniciais={filmes.items}
          fimInicial={filmes.fim}
          categoria="Infantil"
          tipo="filme"
          basePath="filmes"
        />
      )}
      {series.items.length > 0 && (
        <CategoryCarousel
          titulo="Séries"
          itensIniciais={series.items}
          fimInicial={series.fim}
          categoria="Infantil"
          tipo="serie"
          basePath="series"
        />
      )}
      {filmes.items.length === 0 && series.items.length === 0 && (
        <p className="px-3 text-sm text-textmuted">Nenhum conteúdo infantil cadastrado ainda.</p>
      )}
    </div>
  );
}
