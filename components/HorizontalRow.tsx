'use client';

import { useRef } from 'react';
import { TitleCard } from './TitleCard';

interface Item {
  id: string | number;
  href: string;
  poster: string | null;
  titulo: string;
  ano?: number | null;
  rating?: number | null;
  trailer?: string | null;
  duracao?: string | null;
  descricao?: string | null;
  classificacao?: string | null;
  temporadas?: number | null;
  tmdbId?: number | null;
  tipo?: 'movie' | 'series' | null;
}

interface Props {
  items: Item[];
}

// Linha horizontal de capas SEM quebra de linha — usada em qualquer
// lugar com uma lista já pronta e finita (seções da Home, Minha
// Lista). Diferente do CategoryCarousel (Filmes/Séries), não busca
// mais itens sozinha — só rola o que já recebeu. Mesmo comportamento
// de rolagem por mouse/trackpad das categorias.
export function HorizontalRow({ items }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  const aoRodarMouse = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
  };

  return (
    <div
      ref={scrollRef}
      onWheel={aoRodarMouse}
      className="flex gap-1 overflow-x-auto px-3 py-8 -my-8"
      style={{ scrollSnapType: 'x proximity' }}
    >
      {items.map((item) => (
        <div
          key={item.id}
          data-carousel-card="true"
          className="shrink-0 poster-card-width"
          style={{ scrollSnapAlign: 'start' }}
        >
          <TitleCard
            href={item.href}
            poster={item.poster}
            titulo={item.titulo}
            ano={item.ano}
            rating={item.rating}
            trailer={item.trailer}
            duracao={item.duracao}
            descricao={item.descricao}
            classificacao={item.classificacao}
            temporadas={item.temporadas}
            tmdbId={item.tmdbId}
            tipo={item.tipo}
            tall
          />
        </div>
      ))}
    </div>
  );
}
