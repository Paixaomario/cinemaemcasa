'use client';

import { useRef } from 'react';
import { TitleCard } from './TitleCard';
import type { Cinema } from '@/lib/types';

interface Props {
  titulo: string;
  items: Cinema[];
  basePath: 'filmes' | 'series';
}

const LARGURA_CARD = 227; // +10% sobre o valor anterior (206px)

// Agente de Filmes/Séries: UMA linha só por categoria, com rolagem
// horizontal (nunca quebra em várias linhas) e loop infinito de
// verdade — a lista é duplicada uma vez; ao chegar perto do fim, o
// scroll salta de volta pro meio de forma imperceptível, então parece
// contínuo em qualquer direção. Os itens duplicados ficam marcados com
// data-nav-ignore para o D-pad/controle remoto não parar neles (a
// navegação por setas usa a lista original, com wrap-around próprio).
export function CategoryCarousel({ titulo, items, basePath }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  const podeLoop = items.length > 3;
  const lista = podeLoop ? [...items, ...items] : items;

  const aoRolar = () => {
    const el = scrollRef.current;
    if (!el || !podeLoop) return;
    const metade = el.scrollWidth / 2;
    if (el.scrollLeft >= metade) {
      el.scrollLeft -= metade;
    } else if (el.scrollLeft <= 0) {
      el.scrollLeft += metade;
    }
  };

  return (
    <section className="py-4">
      <h2 className="text-[20px] md:text-[32px] lg:text-[40px] font-heading font-bold text-white mb-3 px-3">
        {titulo}
      </h2>
      <div
        ref={scrollRef}
        onScroll={aoRolar}
        className="flex gap-1 overflow-x-auto px-3"
        style={{ scrollSnapType: 'x proximity' }}
      >
        {lista.map((item, idx) => {
          const duplicata = idx >= items.length;
          return (
            <div
              key={`${item.id}-${idx}`}
              data-nav-ignore={duplicata ? 'true' : undefined}
              className="shrink-0"
              style={{ width: LARGURA_CARD, scrollSnapAlign: 'start' }}
            >
              <TitleCard
                href={`/${basePath}/${item.id}`}
                poster={item.poster || item.banner}
                titulo={item.titulo}
                ano={item.year}
                rating={item.rating}
                trailer={item.trailer}
                tall
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
