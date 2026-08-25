'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';

interface TitleCardProps {
  href: string;
  poster: string | null;
  titulo: string;
  ano?: number | null;
  duracao?: string | null;
  rating?: number | null;
  tall?: boolean;
}

// Agente de prévia ao focar: mostra sinopse curta/metadados após ~1s
// de foco parado, sem sair da grade — funciona por mouse hover e por
// foco de teclado/D-pad. Ano e avaliação (com ícone de estrela) ficam
// sempre visíveis no rodapé da capa, não só na prévia.
export function TitleCard({ href, poster, titulo, ano, duracao, rating, tall }: TitleCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = () => {
    timer.current = setTimeout(() => setShowPreview(true), 900);
  };
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    setShowPreview(false);
  };

  return (
    <Link
      href={href}
      className={`focusable relative block overflow-hidden bg-card rounded-[4px] w-full shadow-card ${
        tall ? 'aspect-[2/3]' : 'aspect-video'
      }`}
      onMouseEnter={start}
      onMouseLeave={stop}
      onFocus={start}
      onBlur={stop}
    >
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt={titulo} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-card" />
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-1.5 pt-4 pb-1 flex items-center justify-between">
        {ano ? <span className="text-[10px] text-white/90">{ano}</span> : <span />}
        {rating !== null && rating !== undefined && rating > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] text-gold">
            <i className="ti ti-star-filled text-[10px]" aria-hidden="true" />
            {rating.toFixed(1)}
          </span>
        )}
      </div>

      {showPreview && (
        <div className="absolute inset-x-0 bottom-0 bg-black/85 px-2 py-1.5">
          <p className="text-[11px] font-medium text-white truncate">{titulo}</p>
          <p className="text-[10px] text-textmuted">{[ano, duracao].filter(Boolean).join(' · ')}</p>
        </div>
      )}
    </Link>
  );
}
