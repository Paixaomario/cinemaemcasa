import { PosterGrid } from './PosterGrid';
import type { Cinema } from '@/lib/types';

interface Props {
  titulo: string;
  items: Cinema[];
}

// Regra fixa do Agente Home: sempre 5 capas por seção no desktop/TV
// (tamanho travado, estilo HBO Max — ver PosterGrid). No mobile, a
// mesma seção vira uma linha com rolagem horizontal, 2 capas por vez.
// Se o Supabase retornar menos de 5 itens para a categoria, a grade
// simplesmente mostra os que existem — nunca inventa itens.
export function HomeSectionRow({ titulo, items }: Props) {
  if (items.length === 0) return null;
  const shown = items.slice(0, 5);

  return (
    <section className="px-3 py-3">
      <h2 className="text-[20px] md:text-[32px] lg:text-[40px] font-heading font-bold text-white mb-3 px-1">
        {titulo}
      </h2>
      <PosterGrid
        items={shown.map((item) => ({
          id: item.id,
          href: `/filmes/${item.id}`,
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
