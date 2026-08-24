'use client';

import { useState } from 'react';
import { PosterGrid } from './PosterGrid';
import { TitleCard } from './TitleCard';
import type { Cinema } from '@/lib/types';

interface Props {
  titulo: string;
  items: Cinema[];
  basePath: 'filmes' | 'series';
}

const VISIBLE = 5;

// Agente de Filmes/Séries.
// Desktop/TV: rolagem horizontal infinita por botões — ao avançar a
// partir do último item, o índice volta direto ao primeiro via módulo
// (nunca percorre os itens anteriores de novo), com tiles em tamanho
// travado (estilo HBO Max, via PosterGrid).
// Mobile: rolagem horizontal simples por toque, 2 capas por linha,
// mostrando TODOS os itens da categoria (sem loop programático — o
// próprio gesto de arrastar já percorre a lista completa).
export function CategoryCarousel({ titulo, items, basePath }: Props) {
  const [start, setStart] = useState(0);
  const total = items.length;

  if (total === 0) return null;

  const visible = Array.from({ length: Math.min(VISIBLE, total) }, (_, i) => {
    const index = (start + i) % total;
    return items[index];
  });

  const next = () => setStart((s) => (s + 1) % total);
  const prev = () => setStart((s) => (s - 1 + total) % total);

  return (
    <section className="px-3 py-4">
      <h2 className="text-[20px] md:text-[32px] lg:text-[40px] font-heading font-bold text-white mb-3 px-1">
        {titulo}
      </h2>

      {/* Desktop / TV */}
      <div className="hidden md:flex items-center gap-1">
        {total > VISIBLE && (
          <button onClick={prev} aria-label="Anterior" className="focusable shrink-0 text-textmuted hover:text-white">
            <i className="ti ti-chevron-left text-xl" aria-hidden="true" />
          </button>
        )}

        <div className="flex-1">
          <PosterGrid
            items={visible.map((item) => ({
              id: item.id,
              href: `/${basePath}/${item.id}`,
              poster: item.poster || item.banner,
              titulo: item.titulo,
              ano: item.year
            }))}
          />
        </div>

        {total > VISIBLE && (
          <button onClick={next} aria-label="Próximo" className="focusable shrink-0 text-textmuted hover:text-white">
            <i className="ti ti-chevron-right text-xl" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Mobile: todos os itens, 2 por linha, rolagem por toque */}
      <div className="flex md:hidden gap-1 overflow-x-auto -mx-3 px-3 snap-x snap-mandatory">
        {items.map((item) => (
          <div key={item.id} className="shrink-0 w-[47%] snap-start">
            <TitleCard
              href={`/${basePath}/${item.id}`}
              poster={item.poster || item.banner}
              titulo={item.titulo}
              ano={item.year}
              tall
            />
          </div>
        ))}
      </div>
    </section>
  );
}
