'use client';

import { useRef } from 'react';
import { TitleCard } from './TitleCard';
import type { Cinema } from '@/lib/types';

interface Props {
  titulo: string;
  items: Cinema[];
  basePath: 'filmes' | 'series';
}

// Agente de Filmes/Séries: UMA linha só por categoria, com rolagem
// horizontal (nunca quebra em várias linhas) e loop infinito de
// verdade — a lista é duplicada uma vez; ao chegar perto do fim, o
// scroll salta de volta pro meio de forma imperceptível. Os itens
// duplicados ficam marcados com data-nav-ignore para o D-pad/controle
// remoto não parar neles. O tamanho da capa cresce em telas grandes
// via .poster-card-width (ver app/globals.css) — mesma escala usada na
// grade da Home/Minha Lista.
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

  // Mouse/trackpad: roda do mouse é vertical por padrão do navegador —
  // converte pra rolagem horizontal, senão a rolagem "não funciona"
  // com mouse comum (só funcionava por touch/D-pad antes).
  const aoRodarMouse = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
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
        onWheel={aoRodarMouse}
        className="flex gap-1 overflow-x-auto px-3 py-8 -my-8"
        style={{ scrollSnapType: 'x proximity' }}
      >
        {lista.map((item, idx) => {
          const duplicata = idx >= items.length;
          return (
            <div
              key={`${item.id}-${idx}`}
              data-nav-ignore={duplicata ? 'true' : undefined}
              className="shrink-0 poster-card-width"
              data-carousel-card="true"
              style={{ scrollSnapAlign: 'start' }}
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
