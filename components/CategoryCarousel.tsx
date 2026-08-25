import { PosterGrid } from './PosterGrid';
import type { Cinema } from '@/lib/types';

interface Props {
  titulo: string;
  items: Cinema[];
  basePath: 'filmes' | 'series';
}

// Agente de Filmes/Séries: usa o MESMO componente de grade (PosterGrid)
// da Home/Minha Lista, para garantir tamanho de capa idêntico em todo
// o sistema — antes esse componente tinha sua própria implementação
// paralela, o que causava capas com tamanhos diferentes entre páginas.
export function CategoryCarousel({ titulo, items, basePath }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="px-3 py-4">
      <h2 className="text-[20px] md:text-[32px] lg:text-[40px] font-heading font-bold text-white mb-3 px-1">
        {titulo}
      </h2>
      <PosterGrid
        items={items.map((item) => ({
          id: item.id,
          href: `/${basePath}/${item.id}`,
          poster: item.poster || item.banner,
          titulo: item.titulo,
          ano: item.year,
          rating: item.rating,
          trailer: item.trailer
        }))}
      />
    </section>
  );
}
