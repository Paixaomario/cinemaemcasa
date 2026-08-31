'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';

interface TitleCardProps {
  href: string;
  assistirHref?: string;
  poster: string | null;
  titulo: string;
  ano?: number | null;
  duracao?: string | null;
  rating?: number | null;
  trailer?: string | null;
  descricao?: string | null;
  classificacao?: string | null;
  temporadas?: number | null;
  tmdbId?: number | null;
  tipo?: 'movie' | 'series' | null;
  tall?: boolean;
}

// Agente de prévia ao focar (padrão Prime Video/HBO Max): ao parar o
// foco (mouse ou D-pad) por ~900ms numa capa, ela aumenta de tamanho
// (CSS, ver .focusable em globals.css), o trailer entra no lugar do
// pôster, e um painel expandido aparece com: descrição (2 linhas),
// duração (filme) OU nº de temporadas (série), classificação, e
// atalhos rápidos de Assistir/Minha Lista — sem precisar abrir a
// página de detalhes pra decidir se quer assistir.
//
// Se o título não tem `trailer` próprio no banco, busca um trailer do
// YouTube no TMDB SOB DEMANDA (só quando o usuário realmente para na
// capa, nunca antes) — evita bater na API do TMDB pra toda capa que só
// passa voando pela tela enquanto rola.
export function TitleCard({
  href,
  assistirHref,
  poster,
  titulo,
  ano,
  duracao,
  rating,
  trailer,
  descricao,
  classificacao,
  temporadas,
  tmdbId,
  tipo,
  tall
}: TitleCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [tocandoTrailer, setTocandoTrailer] = useState(false);
  const [trailerYoutube, setTrailerYoutube] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jaBuscouTrailer = useRef(false);

  const start = () => {
    timer.current = setTimeout(async () => {
      setShowPreview(true);
      if (trailer) {
        setTocandoTrailer(true);
        return;
      }
      if (!jaBuscouTrailer.current && tmdbId && tipo) {
        jaBuscouTrailer.current = true;
        try {
          const res = await fetch(`/api/trailer?tmdbId=${tmdbId}&tipo=${tipo}`);
          const data = await res.json();
          if (data.key) setTrailerYoutube(data.key);
        } catch {
          // sem trailer disponível — a capa continua mostrando o pôster
        }
      }
    }, 900);
  };
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    setShowPreview(false);
    setTocandoTrailer(false);
  };

  const metaLinha = temporadas
    ? `${temporadas} temporada${temporadas > 1 ? 's' : ''}`
    : duracao || null;

  return (
    <Link
      href={href}
      data-focused={showPreview ? 'true' : undefined}
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
      ) : showPreview && trailerYoutube ? (
        <iframe
          src={`https://www.youtube.com/embed/${trailerYoutube}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerYoutube}&modestbranding=1&rel=0`}
          className="w-full h-full pointer-events-none scale-150"
          style={{ border: 0 }}
          allow="autoplay; encrypted-media"
          title={titulo}
        />
      ) : poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt={titulo} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-card" />
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 pt-9 pb-2 flex items-center justify-between">
        {ano ? <span className="text-[33px] leading-none font-bold text-white/90">{ano}</span> : <span />}
        {rating !== null && rating !== undefined && rating > 0 && (
          <span className="flex items-center gap-1 text-[33px] leading-none font-bold text-gold">
            <i className="ti ti-star-filled text-[26px]" aria-hidden="true" />
            {rating.toFixed(1)}
          </span>
        )}
      </div>

      {showPreview && (
        <div className="absolute inset-x-0 bottom-0 bg-black/90 px-2.5 py-2 flex flex-col gap-1">
          <p className="text-[12px] font-semibold text-white truncate">{titulo}</p>

          {(classificacao || metaLinha) && (
            <div className="flex items-center gap-1.5">
              {classificacao && (
                <span className="border border-white/40 rounded px-1 text-[9px] text-white/90">
                  {classificacao}
                </span>
              )}
              {metaLinha && <span className="text-[10px] text-textmuted">{metaLinha}</span>}
            </div>
          )}

          {descricao && (
            <p className="text-[10px] text-white/75 leading-snug line-clamp-2">{descricao}</p>
          )}

          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              role="button"
              aria-label="Assistir"
              className="w-6 h-6 rounded-full bg-white flex items-center justify-center"
            >
              <i className="ti ti-player-play-filled text-[11px] text-black" aria-hidden="true" />
            </span>
            <span
              role="button"
              aria-label="Minha lista"
              className="w-6 h-6 rounded-full border border-white/60 flex items-center justify-center"
            >
              <i className="ti ti-plus text-[12px] text-white" aria-hidden="true" />
            </span>
          </div>
        </div>
      )}
    </Link>
  );
}
