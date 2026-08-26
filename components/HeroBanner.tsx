'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { HeroData } from '@/lib/heroEnrichment';

interface Props {
  heroes: HeroData[];
}

const TEMPO_CAPA_MS = 10_000;
const TEMPO_SEM_TRAILER_MS = 15_000;

// Agente de Home (banner hero — usado em Home/Filmes/Séries/Minha
// Lista/Busca): ROTATIVO entre vários títulos (igual Netflix/YouTube),
// não fica travado sempre no mesmo. Para cada título do ciclo: mostra a
// capa por 10s, depois o trailer do MESMO título em loop mudo; ao
// terminar o trailer (ou depois de ~15s se não houver trailer), passa
// pro próximo título da lista, voltando ao primeiro no fim.
// Proporção 16:9, ocupa 100% da largura, sem espaçamento lateral.
export function HeroBanner({ heroes }: Props) {
  const [indice, setIndice] = useState(0);
  const [mostrandoTrailer, setMostrandoTrailer] = useState(false);

  const hero = heroes[indice];

  useEffect(() => {
    setMostrandoTrailer(false);
    if (!hero) return;

    if (!hero.trailer) {
      const t = setTimeout(() => avancar(), TEMPO_SEM_TRAILER_MS);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => setMostrandoTrailer(true), TEMPO_CAPA_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, hero?.id]);

  const avancar = () => setIndice((i) => (i + 1) % heroes.length);

  if (!hero) return null;
  const imagem = hero.backdrop || hero.banner || hero.poster;

  return (
    <Link
      href={hero.type === 'series' ? `/series/${hero.id}` : `/filmes/${hero.id}`}
      className="focusable relative block w-full aspect-video overflow-hidden bg-accent-soft md:-ml-[92px] md:w-[calc(100%+92px)]"
      data-hero="true"
    >
      {mostrandoTrailer && hero.trailer ? (
        <video
          key={`trailer-${hero.id}`}
          src={hero.trailer}
          autoPlay
          muted
          playsInline
          onEnded={avancar}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : imagem ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`capa-${hero.id}`}
          src={imagem}
          alt={hero.titulo}
          className="absolute inset-0 w-full h-full object-cover"
        />
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
