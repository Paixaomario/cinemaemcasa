'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { extrairIdYoutube } from '@/lib/videoHelpers';
import { useHeroPreview } from './HeroPreviewContext';

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

// Agente de prévia ao focar — PADRÃO HBO MAX (confirmado por pesquisa):
// a capa em si NÃO toca mais vídeo nenhum — quem tocava vídeo/iframe
// por capa focada sobrecarregava o sistema (um player a mais rodando
// por capa, multiplicando chamadas ao TMDB/Supabase, competindo por
// CPU na TV). Agora, ao focar uma capa, ela só avisa o banner HERO no
// topo da página (via HeroPreviewContext) pra ele mostrar a capa e
// tocar o trailer — sempre um vídeo por vez, rodando só ali.
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
  const [posterReforcado, setPosterReforcado] = useState<string | null>(null);
  const [posterOriginalQuebrado, setPosterOriginalQuebrado] = useState(false);
  const [posterReforcadoTambemQuebrado, setPosterReforcadoTambemQuebrado] = useState(false);
  const { definirPrevia } = useHeroPreview();

  const posterFinal = posterReforcadoTambemQuebrado
    ? null
    : (!posterOriginalQuebrado && poster) || posterReforcado;

  // Busca no TMDB sob demanda, direto no navegador, em DOIS casos: (1)
  // a capa está vazia no banco, OU (2) a capa TEM uma URL, mas ela
  // está quebrada de verdade (link morto) — evita o ícone de imagem
  // quebrada do navegador ficar pra sempre. Roda sem travar a página.
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

  const idYoutubeProprio = extrairIdYoutube(trailer);
  const ehVideoDireto = !!trailer && !idYoutubeProprio;

  const aoFocar = () => {
    definirPrevia({
      id: href,
      titulo,
      imagem: posterFinal,
      trailer: ehVideoDireto ? trailer! : idYoutubeProprio ? trailer! : null,
      tmdbId: tmdbId ?? null,
      tipo: tipo ?? null,
      descricao,
      ano,
      duracao: temporadas ? `${temporadas} temporada${temporadas > 1 ? 's' : ''}` : duracao,
      classificacao
    });
  };
  const aoSair = () => definirPrevia(null);

  return (
    <Link
      href={href}
      className={`focusable relative block overflow-hidden bg-card rounded-[4px] w-full shadow-card ${
        tall ? 'aspect-[2/3]' : 'aspect-video'
      }`}
      onMouseEnter={aoFocar}
      onMouseLeave={aoSair}
      onFocus={aoFocar}
      onBlur={aoSair}
    >
      {posterFinal ? (
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
    </Link>
  );
}
