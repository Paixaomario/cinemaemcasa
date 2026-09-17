'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { extrairIdYoutube } from '@/lib/videoHelpers';
import { useHeroPreview } from './HeroPreviewContext';
import type { HeroData } from '@/lib/heroEnrichment';

interface Props {
  heroes: HeroData[];
}

const TEMPO_CAPA_MS = 10_000;
const TEMPO_SEM_TRAILER_MS = 15_000;
const TEMPO_PREVIA_ATE_TRAILER_MS = 400;

// Agente de Home (banner hero — usado em Home/Filmes/Séries/Minha
// Lista/Busca): dois modos.
//
// 1) ROTATIVO (padrão, ninguém focado em nada): passa pelos títulos em
//    sequência — capa 10s, depois trailer, nunca repete antes de
//    percorrer todos.
//
// 2) PRÉVIA (padrão HBO Max, confirmado por pesquisa): assim que uma
//    capa qualquer da página recebe foco, o hero PARA a rotação e
//    mostra a capa/trailer DAQUELE título em vez do próprio — bem mais
//    rápido (frações de segundo, não 10s), porque é reação direta ao
//    que o usuário está olhando. Isso substitui tocar vídeo em cada
//    capa individualmente (que sobrecarregava o sistema com um player
//    a mais por capa focada e multiplicava chamadas ao TMDB) — só o
//    hero toca vídeo, sempre um de cada vez.
export function HeroBanner({ heroes }: Props) {
  const pathname = usePathname();
  const chaveArmazenamento = `hero_passo_${pathname}`;
  const { previa } = useHeroPreview();

  const [passo, setPasso] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const salvo = Number(window.localStorage.getItem(chaveArmazenamento));
    return Number.isFinite(salvo) ? salvo + 1 : 0;
  });
  const [mostrandoTrailer, setMostrandoTrailer] = useState(false);
  const [trailerYoutubePrevia, setTrailerYoutubePrevia] = useState<string | null>(null);
  const [mostrandoTrailerPrevia, setMostrandoTrailerPrevia] = useState(false);

  const indice = heroes.length > 0 ? passo % heroes.length : 0;
  const heroRotativo = heroes[indice];

  const idYoutubeProprio = extrairIdYoutube(heroRotativo?.trailer);
  const idYoutubeParaMostrar = idYoutubeProprio || heroRotativo?.trailerYoutube || null;
  const ehVideoDireto = !!heroRotativo?.trailer && !idYoutubeProprio;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(chaveArmazenamento, String(passo));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passo]);

  // A rotação automática PAUSA por completo enquanto há uma prévia
  // ativa (alguém focado numa capa) — só roda no modo padrão.
  useEffect(() => {
    setMostrandoTrailer(false);
    if (!heroRotativo || previa) return;

    if (!ehVideoDireto && !idYoutubeParaMostrar) {
      const t = setTimeout(() => avancar(), TEMPO_SEM_TRAILER_MS);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => setMostrandoTrailer(true), TEMPO_CAPA_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passo, previa]);

  const avancar = () => setPasso((p) => p + 1);

  useEffect(() => {
    if (!mostrandoTrailer || !idYoutubeParaMostrar || ehVideoDireto || previa) return;
    const t = setTimeout(() => avancar(), 30_000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrandoTrailer, passo, previa]);

  // Modo prévia: assim que uma capa é focada, busca (se precisar) um
  // trailer do YouTube no TMDB e mostra bem mais rápido que o modo
  // rotativo — é reação direta ao foco, não um ciclo automático.
  const idYoutubePrevia = extrairIdYoutube(previa?.trailer);
  const ehVideoDiretoPrevia = !!previa?.trailer && !idYoutubePrevia;

  useEffect(() => {
    setMostrandoTrailerPrevia(false);
    setTrailerYoutubePrevia(null);
    if (!previa) return;

    const t = setTimeout(async () => {
      setMostrandoTrailerPrevia(true);
      if (!ehVideoDiretoPrevia && !idYoutubePrevia && previa.tmdbId && previa.tipo) {
        try {
          const res = await fetch(`/api/trailer?tmdbId=${previa.tmdbId}&tipo=${previa.tipo}`);
          const data = await res.json();
          if (data.key) setTrailerYoutubePrevia(data.key);
        } catch {
          // sem trailer disponível — a prévia continua mostrando a imagem
        }
      }
    }, TEMPO_PREVIA_ATE_TRAILER_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previa?.id]);

  if (previa) {
    const idYoutubeFinal = idYoutubePrevia || trailerYoutubePrevia;
    return (
      <div className="secao-tela-cheia relative w-full aspect-video overflow-hidden bg-accent-soft md:-ml-[92px] md:w-[calc(100%+92px)]">
        {mostrandoTrailerPrevia && ehVideoDiretoPrevia ? (
          <video
            key={`previa-trailer-${previa.id}`}
            src={previa.trailer!}
            autoPlay
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : mostrandoTrailerPrevia && idYoutubeFinal ? (
          <iframe
            key={`previa-trailer-yt-${previa.id}`}
            src={`https://www.youtube.com/embed/${idYoutubeFinal}?autoplay=1&mute=1&controls=0&loop=1&playlist=${idYoutubeFinal}&modestbranding=1&rel=0`}
            className="absolute inset-0 w-full h-full pointer-events-none scale-[1.5]"
            style={{ border: 0 }}
            allow="autoplay; encrypted-media"
            title={previa.titulo}
          />
        ) : previa.imagem ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`previa-capa-${previa.id}`}
            src={previa.imagem}
            alt={previa.titulo}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/5" />

        <div className="absolute left-6 md:left-[124px] bottom-6 md:bottom-10 right-6 md:right-1/3">
          <h1 className="font-heading font-bold text-[26px] md:text-[42px] lg:text-[48px] leading-tight mb-2 drop-shadow-lg">
            {previa.titulo}
          </h1>
          <div className="flex items-center gap-2 text-[14px] md:text-[17px] text-white/90 mb-2">
            {previa.classificacao && (
              <span className="border border-white/40 rounded px-1.5 py-0.5 text-[11px] md:text-[13px]">
                {previa.classificacao}
              </span>
            )}
            {previa.duracao && <span>{previa.duracao}</span>}
          </div>
          {previa.descricao && (
            <p className="text-[14px] md:text-[17px] text-white/85 leading-snug line-clamp-2 max-w-xl">
              {previa.descricao}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!heroRotativo) return null;
  const imagem = heroRotativo.backdrop || heroRotativo.banner || heroRotativo.poster;

  return (
    <div className="secao-tela-cheia relative w-full aspect-video overflow-hidden bg-accent-soft md:-ml-[92px] md:w-[calc(100%+92px)]">
      {mostrandoTrailer && ehVideoDireto ? (
        <video
          key={`trailer-${heroRotativo.id}`}
          src={heroRotativo.trailer!}
          autoPlay
          muted
          playsInline
          onEnded={avancar}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : mostrandoTrailer && idYoutubeParaMostrar ? (
        <iframe
          key={`trailer-yt-${heroRotativo.id}`}
          src={`https://www.youtube.com/embed/${idYoutubeParaMostrar}?autoplay=1&mute=1&controls=0&loop=1&playlist=${idYoutubeParaMostrar}&modestbranding=1&rel=0`}
          className="absolute inset-0 w-full h-full pointer-events-none scale-[1.5]"
          style={{ border: 0 }}
          allow="autoplay; encrypted-media"
          title={heroRotativo.titulo}
        />
      ) : imagem ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`capa-${heroRotativo.id}`}
          src={imagem}
          alt={heroRotativo.titulo}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : null}

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/5" />

      <div className="absolute left-6 md:left-[124px] bottom-6 md:bottom-10 right-6 md:right-1/3">
        <h1 className="font-heading font-bold text-[26px] md:text-[42px] lg:text-[48px] leading-tight mb-2 drop-shadow-lg">
          {heroRotativo.titulo}
        </h1>
        <div className="flex items-center gap-2 text-[14px] md:text-[17px] text-white/90 mb-2">
          {heroRotativo.bandeira && <span>{heroRotativo.bandeira}</span>}
          {heroRotativo.classificacao && (
            <span className="border border-white/40 rounded px-1.5 py-0.5 text-[11px] md:text-[13px]">
              {heroRotativo.classificacao}
            </span>
          )}
          {heroRotativo.duration && <span>{heroRotativo.duration}</span>}
        </div>
        {heroRotativo.description && (
          <p className="text-[14px] md:text-[17px] text-white/85 leading-snug line-clamp-2 max-w-xl">
            {heroRotativo.description}
          </p>
        )}
      </div>
    </div>
  );
}
