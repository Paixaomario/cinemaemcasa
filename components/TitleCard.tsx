'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';

interface TitleCardProps {
  href: string;
  poster: string | null;
  titulo: string;
  ano?: number | null;
  duracao?: string | null;
  tall?: boolean;
}

// Agente de prévia ao focar: mostra sinopse curta/metadados após ~1s
// de foco parado, sem sair da grade — funciona por mouse hover e por
// foco de teclado/D-pad (data-focused via onFocus).
export function TitleCard({ href, poster, titulo, ano, duracao, tall }: TitleCardProps) {
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
      className={`focusable relative block overflow-hidden bg-card rounded-[4px] w-full ${
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

      {showPreview && (
        <div className="absolute inset-x-0 bottom-0 bg-black/80 px-2 py-1.5">
          <p className="text-[11px] font-medium text-white truncate">{titulo}</p>
          <p className="text-[10px] text-textmuted">
            {[ano, duracao].filter(Boolean).join(' · ')}
          </p>
        </div>
      )}
    </Link>
  );
}
