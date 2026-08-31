'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { extrairIdYoutube } from '@/lib/videoHelpers';
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
  const pathname = usePathname();
  const chaveArmazenamento = `hero_passo_${pathname}`;

  // Usa um contador MONOTÔNICO (nunca "empata" com o valor anterior)
  // em vez do índice direto — bug corrigido: com poucos títulos (ou
  // até só 1), setIndice(mesmoValor) não reexecutava o efeito do timer
  // (o React ignora set de estado pro mesmo valor), então a rotação
  // parava de vez depois do 1º ciclo e só "voltava a funcionar" ao
  // recarregar a página (o que sorteava um passo inicial diferente).
  const [passo, setPasso] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const salvo = Number(window.localStorage.getItem(chaveArmazenamento));
    return Number.isFinite(salvo) ? salvo + 1 : 0;
  });
  const [mostrandoTrailer, setMostrandoTrailer] = useState(false);

  const indice = heroes.length > 0 ? passo % heroes.length : 0;
  const hero = heroes[indice];

  // Detecta se `trailer` é um link do YouTube em vez de arquivo de
  // vídeo direto — precisa disso ANTES dos efeitos abaixo pra decidir
  // corretamente o tempo de exibição (iframe não avisa quando "acaba").
  const idYoutubeProprio = extrairIdYoutube(hero?.trailer);
  const idYoutubeParaMostrar = idYoutubeProprio || hero?.trailerYoutube || null;
  const ehVideoDireto = !!hero?.trailer && !idYoutubeProprio;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(chaveArmazenamento, String(passo));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passo]);

  useEffect(() => {
    setMostrandoTrailer(false);
    if (!hero) return;

    if (!ehVideoDireto && !idYoutubeParaMostrar) {
      const t = setTimeout(() => avancar(), TEMPO_SEM_TRAILER_MS);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => setMostrandoTrailer(true), TEMPO_CAPA_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passo]);

  // SEMPRE incrementa (nunca reatribui o mesmo valor) — garante que o
  // efeito acima rode de novo mesmo com 1 único título na lista (nesse
  // caso ele simplesmente repete capa→trailer→capa→trailer...).
  const avancar = () => setPasso((p) => p + 1);

  // Trailer via iframe (YouTube, próprio ou fallback do TMDB) não emite
  // evento "acabou" — avança sozinho depois de um tempo fixo de exibição.
  useEffect(() => {
    if (!mostrandoTrailer || !idYoutubeParaMostrar || ehVideoDireto) return;
    const t = setTimeout(() => avancar(), 30_000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrandoTrailer, passo]);

  if (!hero) return null;
  const imagem = hero.backdrop || hero.banner || hero.poster;

  return (
    <div className="relative w-full aspect-video overflow-hidden bg-accent-soft md:-ml-[92px] md:w-[calc(100%+92px)]">
      {mostrandoTrailer && ehVideoDireto ? (
        <video
          key={`trailer-${hero.id}`}
          src={hero.trailer!}
          autoPlay
          muted
          playsInline
          onEnded={avancar}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : mostrandoTrailer && idYoutubeParaMostrar ? (
        <iframe
          key={`trailer-yt-${hero.id}`}
          src={`https://www.youtube.com/embed/${idYoutubeParaMostrar}?autoplay=1&mute=1&controls=0&loop=1&playlist=${idYoutubeParaMostrar}&modestbranding=1&rel=0`}
          className="absolute inset-0 w-full h-full pointer-events-none scale-[1.5]"
          style={{ border: 0 }}
          allow="autoplay; encrypted-media"
          title={hero.titulo}
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

      <div className="absolute left-6 md:left-[124px] bottom-6 md:bottom-10 right-6 md:right-1/3">
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
    </div>
  );
}
