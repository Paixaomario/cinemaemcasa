import { supabaseServer } from '@/lib/supabase/server';
import { SearchResultsGrid } from '@/components/SearchResultsGrid';
import type { SearchCatalogItem } from '@/lib/types';

async function search(termo: string): Promise<SearchCatalogItem[]> {
  if (!termo) return [];
  const { data } = await supabaseServer
    .from('search_catalog')
    .select('*')
    .ilike('titulo', `%${termo}%`)
    .limit(30);
  return data || [];
}

export default async function BuscaPage({
  searchParams
}: {
  searchParams: { q?: string };
}) {
  const termo = searchParams.q || '';
  const resultados = termo ? await search(termo) : [];

  return (
    <div className="px-5 pt-10 pb-10">
      <h1 className="text-xl font-medium mb-4">Pesquisar</h1>
      <form className="mb-6 max-w-md" action="/busca">
        <input
          name="q"
          defaultValue={termo}
          placeholder="Buscar filmes, séries..."
          className="w-full bg-card border border-border rounded-card px-4 py-2.5 text-sm text-white placeholder:text-textmuted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        />
      </form>

      {termo && resultados.length === 0 && (
        <p className="text-sm text-textmuted">Nenhum título encontrado para &ldquo;{termo}&rdquo;.</p>
      )}

      <SearchResultsGrid results={resultados} />
    </div>
  );
}
