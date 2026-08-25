'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { HeroData } from '@/lib/heroEnrichment';

interface Props {
  hero: HeroData;
}

const TEMPO_CAPA_MS = 10_000;

// Agente de Home (banner hero, usado em Home/Filmes/Séries/Minha Lista/
// Busca): proporção 16:9, mostra a capa e depois de 10s troca para o
// trailer do MESMO título (mudo, loop até acabar, volta pra capa).
// Sem botões de ação — só bandeira do país + classificação + duração e
// até 2 linhas de descrição, no padrão de leitura a distância da TV.
export function HeroBanner({ hero }: Props) {
  const [mostrandoTrailer, setMostrandoTrailer] = useState(false);

  useEffect(() => {
    setMostrandoTrailer(false);
    if (!hero.trailer) return;
    const t = setTimeout(() => setMostrandoTrailer(true), TEMPO_CAPA_MS);
    return () => clearTimeout(t);
  }, [hero.id, hero.trailer]);

  const imagem = hero.backdrop || hero.banner || hero.poster;

  return (
    <Link
      href={hero.type === 'series' ? `/series/${hero.id}` : `/filmes/${hero.id}`}
      className="focusable relative block w-full aspect-video overflow-hidden bg-accent-soft"
      data-hero="true"
    >
      {mostrandoTrailer && hero.trailer ? (
        <video
          src={hero.trailer}
          autoPlay
          muted
          playsInline
          onEnded={() => setMostrandoTrailer(false)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : imagem ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imagem} alt={hero.titulo} className="absolute inset-0 w-full h-full object-cover" />
      ) : null}

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/5" />

      <div className="absolute left-6 md:left-10 bottom-6 md:bottom-10 right-6 md:right-1/3">
        <h1 className="font-heading font-bold text-[26px] md:text-[42px] lg:text-[48px] leading-tight mb-2 drop-shadow-lg">
          {hero.titulo}
        </h1>
        <div className="flex items-center gap-2 text-[14px] md:text-[17px] text-white/90 mb-2">
          {hero.bandeira && <span>{hero.bandeira}</span>}
          {hero.classificacao && (
            <span className="border border-white/40 rounded px-1.5 py-0.5 text-[11px] md:text-[13px]">
              {hero.classificacao}
            </span>
          )}
          {hero.duration && <span>{hero.duration}</span>}
        </div>
        {hero.description && (
          <p className="text-[14px] md:text-[17px] text-white/85 leading-snug line-clamp-2 max-w-xl">
            {hero.description}
          </p>
        )}
      </div>
    </Link>
  );
}
