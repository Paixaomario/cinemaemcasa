import Link from 'next/link';
import type { SearchCatalogItem } from '@/lib/types';

interface Props {
  results: SearchCatalogItem[];
}

// Agente de pesquisa: 6 indicações em grade para telas gigantes (100"+),
// 5 em grade para smart TV/computador, 3 em carrossel para mobile.
export function SearchResultsGrid({ results }: Props) {
  if (results.length === 0) return null;

  return (
    <>
      {/* Mobile: carrossel com 3 visíveis */}
      <div className="flex gap-2.5 overflow-x-auto md:hidden -mx-1 px-1">
        {results.map((r) => (
          <ResultCard key={`${r.source_table}-${r.source_id}`} item={r} className="min-w-[90px] w-[calc(33.333%-8px)]" />
        ))}
      </div>

      {/* Smart TV / computador: grade 5 colunas */}
      <div className="hidden md:grid tv:hidden grid-cols-5 gap-3">
        {results.map((r) => (
          <ResultCard key={`${r.source_table}-${r.source_id}`} item={r} />
        ))}
      </div>

      {/* Telas gigantes 100"+: grade 6 colunas */}
      <div className="hidden tv:grid grid-cols-6 gap-4">
        {results.map((r) => (
          <ResultCard key={`${r.source_table}-${r.source_id}`} item={r} />
        ))}
      </div>
    </>
  );
}

function ResultCard({ item, className }: { item: SearchCatalogItem; className?: string }) {
  const href = item.tipo === 'series' ? `/series/${item.source_id}` : `/filmes/${item.source_id}`;
  return (
    <Link
      href={href}
      className={`focusable block rounded-card overflow-hidden bg-card h-[130px] shrink-0 shadow-card ${className || ''}`}
    >
      {item.poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.poster} alt={item.titulo || ''} className="w-full h-full object-cover" />
      )}
    </Link>
  );
}
