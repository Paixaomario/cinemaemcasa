'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Cinema } from '@/lib/types';

interface Props {
  hero: Cinema;
}

const TEMPO_CAPA_MS = 10_000;

// Agente de Home: banner hero mostra a capa e, depois de 10s (mesmo
// tempo de exibição do HBO Max), troca para o trailer do MESMO título
// em loop mudo. Ao terminar o trailer, volta pra capa e reinicia o
// ciclo — nunca mistura capa/trailer de títulos diferentes.
export function HeroBanner({ hero }: Props) {
  const [mostrandoTrailer, setMostrandoTrailer] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMostrandoTrailer(false);
    if (!hero.trailer) return;

    const t = setTimeout(() => setMostrandoTrailer(true), TEMPO_CAPA_MS);
    return () => clearTimeout(t);
  }, [hero.id, hero.trailer]);

  const voltarParaCapa = () => setMostrandoTrailer(false);

  return (
    <div className="relative min-h-[46vh] flex items-end px-6 pb-8 overflow-hidden bg-accent-soft">
      {mostrandoTrailer && hero.trailer ? (
        <video
          ref={videoRef}
          src={hero.trailer}
          autoPlay
          muted
          playsInline
          onEnded={voltarParaCapa}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (hero.backdrop || hero.banner) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={hero.backdrop || hero.banner || undefined}
          alt={hero.titulo}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : null}

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />

      <div className="relative z-10">
        <p className="text-[11px] text-gold tracking-widest mb-2">
          {hero.type === 'series' ? 'SÉRIE EM DESTAQUE' : 'FILME EM DESTAQUE'}
        </p>
        <h1 className="text-2xl font-medium mb-2 max-w-[360px]">{hero.titulo}</h1>
        <p className="text-[13px] text-accent-hover mb-1">
          {[hero.year, hero.genre, hero.duration].filter(Boolean).join(' · ')}
        </p>
        <p className="text-[13px] text-textmuted mb-4 max-w-[420px] line-clamp-3">{hero.description}</p>
        <div className="flex gap-2">
          <Link
            href={hero.type === 'series' ? `/series/${hero.id}` : `/filmes/${hero.id}/assistir`}
            className="focusable bg-accent text-white text-[13px] font-medium rounded-card px-5 py-2.5"
          >
            <i className="ti ti-player-play mr-1.5" aria-hidden="true" />
            Assistir
          </Link>
          <button className="focusable bg-white/10 border border-border text-white text-[13px] font-medium rounded-card px-5 py-2.5">
            <i className="ti ti-plus mr-1.5" aria-hidden="true" />
            Minha lista
          </button>
        </div>
      </div>
    </div>
  );
}
