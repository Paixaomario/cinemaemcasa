'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { extrairIdYoutube } from '@/lib/videoHelpers';
import { detectarPlataforma, ehSmartTV } from '@/lib/platform/platformDetect';

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

// Ícones em SVG embutido (não dependem de nenhuma fonte de ícones
// carregar) — antes usava a fonte Tabler via classe `ti`, que em
// alguns navegadores/redes aparecia como quadrado em vez do ícone real.
function IconeEstrela({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.2 21 12 17.56 5.8 21 7 14.14l-5-4.87 7.1-1.01L12 2z" />
    </svg>
  );
}
function IconePlay({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function IconeMais({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} fill="none" className={className} aria-hidden="true">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

// Agente de prévia ao focar (padrão Prime Video/HBO Max): ao parar o
// foco (mouse ou D-pad) por ~900ms numa capa, ela aumenta de tamanho e
// mostra um painel com descrição, duração/temporadas, classificação e
// atalhos de Assistir/Minha Lista.
//
// PERFORMANCE EM SMART TV: tocar um trailer (vídeo ou, pior, um iframe
// inteiro do YouTube) consome bastante processamento — numa TV mais
// fraca isso competia por CPU com a própria navegação por D-pad,
// contribuindo pro delay entre trocar de capa. Por isso, o trailer
// (vídeo OU iframe) só toca fora de smart TVs; na TV, a capa ainda
// aumenta e mostra as informações, só sem o vídeo em si.
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
  const [trailerYoutubeFallback, setTrailerYoutubeFallback] = useState<string | null>(null);
  const [posterReforcado, setPosterReforcado] = useState<string | null>(null);
  const [posterOriginalQuebrado, setPosterOriginalQuebrado] = useState(false);
  const [posterReforcadoTambemQuebrado, setPosterReforcadoTambemQuebrado] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jaBuscouTrailer = useRef(false);

  const posterFinal = posterReforcadoTambemQuebrado
    ? null
    : (!posterOriginalQuebrado && poster) || posterReforcado;

  // Busca no TMDB sob demanda, direto no navegador, em DOIS casos: (1)
  // a capa está vazia no banco, OU (2) a capa TEM uma URL, mas ela
  // está quebrada de verdade (link morto) — antes só o caso (1) era
  // tratado, então um link quebrado (em vez de vazio) ficava mostrando
  // o ícone de imagem quebrada do navegador pra sempre, sem nunca
  // acionar o reforço. Roda sem travar o carregamento da página.
  useEffect(() => {
    const precisaDeReforco = (!poster || posterOriginalQuebrado) && !posterReforcado;
    if (!precisaDeReforco || !tmdbId || !tipo) return;
    let ativo = true;
    fetch(`/api/poster?tmdbId=${tmdbId}&tipo=${tipo}`)
      .then((res) => res.json())
      .then((data) => {
        if (ativo && data.poster) setPosterReforcado(data.poster);
      })
      .catch(() => {
        // sem pôster disponível nem no TMDB — mantém o quadro vazio
      });
    return () => {
      ativo = false;
    };
  }, [poster, posterOriginalQuebrado, posterReforcado, tmdbId, tipo]);

  // Se `trailer` for um link do YouTube (não um arquivo de vídeo
  // direto), a tag <video> nunca conseguiria tocar — usa embed certo.
  const idYoutubeProprio = extrairIdYoutube(trailer);
  const ehVideoDireto = !!trailer && !idYoutubeProprio;
  const idYoutubeParaMostrar = idYoutubeProprio || trailerYoutubeFallback;

  const start = () => {
    if (ehSmartTV(detectarPlataforma())) {
      setShowPreview(true);
      return;
    }
    timer.current = setTimeout(async () => {
      setShowPreview(true);
      if (ehVideoDireto || idYoutubeProprio) {
        setTocandoTrailer(true);
        return;
      }
      if (!jaBuscouTrailer.current && tmdbId && tipo) {
        jaBuscouTrailer.current = true;
        try {
          const res = await fetch(`/api/trailer?tmdbId=${tmdbId}&tipo=${tipo}`);
          const data = await res.json();
          if (data.key) setTrailerYoutubeFallback(data.key);
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
      {tocandoTrailer && ehVideoDireto ? (
        <video src={trailer!} autoPlay muted loop playsInline className="w-full h-full object-cover" />
      ) : tocandoTrailer && idYoutubeParaMostrar ? (
        <iframe
          src={`https://www.youtube.com/embed/${idYoutubeParaMostrar}?autoplay=1&mute=1&controls=0&loop=1&playlist=${idYoutubeParaMostrar}&modestbranding=1&rel=0`}
          className="w-full h-full pointer-events-none scale-150"
          style={{ border: 0 }}
          allow="autoplay; encrypted-media"
          title={titulo}
        />
      ) : posterFinal ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={posterFinal}
          alt={titulo}
          className="w-full h-full object-cover"
          onError={() => {
            if (posterFinal === poster) setPosterOriginalQuebrado(true);
            else setPosterReforcadoTambemQuebrado(true);
          }}
        />
      ) : (
        <div className="w-full h-full bg-card" />
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 pt-9 pb-2 flex items-center justify-between">
        {ano ? <span className="text-[13px] leading-none font-bold text-white/90">{ano}</span> : <span />}
        {rating !== null && rating !== undefined && rating > 0 && (
          <span className="flex items-center gap-1 text-[13px] leading-none font-bold text-gold">
            <IconeEstrela className="w-[11px] h-[11px]" />
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
              <IconePlay className="w-[11px] h-[11px] text-black" />
            </span>
            <span
              role="button"
              aria-label="Minha lista"
              className="w-6 h-6 rounded-full border border-white/60 flex items-center justify-center"
            >
              <IconeMais className="w-[12px] h-[12px] text-white" />
            </span>
          </div>
        </div>
      )}
    </Link>
  );
}
