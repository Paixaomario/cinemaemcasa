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
  trailer?: string | null;
  tall?: boolean;
}

// Agente de prévia ao focar: ao parar o foco (mouse ou D-pad) por ~900ms
// numa capa, ela já aumenta de tamanho via CSS (.focusable, ver
// globals.css) e o trailer do título começa a tocar em loop mudo no
// lugar do pôster — efeito padrão HBO Max em toda capa do sistema, não
// só no banner hero. Ano e avaliação (com ícone de estrela) ficam
// sempre visíveis no rodapé da capa.
export function TitleCard({ href, poster, titulo, ano, duracao, rating, trailer, tall }: TitleCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [tocandoTrailer, setTocandoTrailer] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = () => {
    timer.current = setTimeout(() => {
      setShowPreview(true);
      if (trailer) setTocandoTrailer(true);
    }, 900);
  };
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    setShowPreview(false);
    setTocandoTrailer(false);
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
      {tocandoTrailer && trailer ? (
        <video src={trailer} autoPlay muted loop playsInline className="w-full h-full object-cover" />
      ) : poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt={titulo} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-card" />
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-1.5 pt-5 pb-1.5 flex items-center justify-between">
        {ano ? <span className="text-[15px] font-medium text-white/90">{ano}</span> : <span />}
        {rating !== null && rating !== undefined && rating > 0 && (
          <span className="flex items-center gap-1 text-[15px] font-medium text-gold">
            <i className="ti ti-star-filled text-[13px]" aria-hidden="true" />
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
