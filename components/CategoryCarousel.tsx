'use client';

import { useState } from 'react';
import { TitleCard } from './TitleCard';
import type { Cinema } from '@/lib/types';

interface Props {
  titulo: string;
  items: Cinema[];
  basePath: 'filmes' | 'series';
}

const VISIBLE = 5;

// Agente de Filmes/Séries: rolagem horizontal infinita. Ao avançar a
// partir do último item, o índice volta direto ao primeiro via módulo —
// nunca percorre os itens anteriores de novo.
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
      <h2 className="text-[15px] font-medium text-white mb-2 px-1">{titulo}</h2>
      <div className="flex items-center gap-1">
        {total > VISIBLE && (
          <button
            onClick={prev}
            aria-label="Anterior"
            className="focusable shrink-0 text-textmuted hover:text-white"
          >
            <i className="ti ti-chevron-left text-xl" aria-hidden="true" />
          </button>
        )}

        <div className="grid grid-cols-5 gap-1.5 flex-1">
          {visible.map((item) => (
            <TitleCard
              key={item.id}
              href={`/${basePath}/${item.id}`}
              poster={item.poster || item.banner}
              titulo={item.titulo}
              ano={item.year}
              duracao={item.duration}
              tall
            />
          ))}
        </div>

        {total > VISIBLE && (
          <button
            onClick={next}
            aria-label="Próximo"
            className="focusable shrink-0 text-textmuted hover:text-white"
          >
            <i className="ti ti-chevron-right text-xl" aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}
