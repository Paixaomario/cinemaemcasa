'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { getMovieDetails, getShowDetails, TMDB_IMG } from '@/lib/tmdb'
import Image from 'next/image'
import Link from 'next/link'

interface HeroBannerProps {
  type?: 'movie' | 'series'
}

export function HeroBanner({ type }: HeroBannerProps = {}) {
  const [currentBannerItem, setCurrentBannerItem] = useState<any>(null)
  const [contentPool, setContentPool] = useState<any[]>([])
  const [showTrailer, setShowTrailer] = useState(false)
  const currentIndexRef = useRef(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFeatured() {
      const sb = createClient()

      let moviesData: any[] = [];
      let seriesData: any[] = [];

      // Busca condicional baseada na prop 'type'
      if (!type || type === 'movie') {
        const { data: movies, error: mError } = await sb.from('cinema').select('id, titulo, poster, backdrop, tmdb_id, category, trailer').limit(40)
        if (mError) console.error("Erro ao buscar filmes para o banner:", mError)
        moviesData = movies || [];
      }

      if (!type || type === 'series') {
        const { data: series, error: sError } = await sb.from('series').select('id_n, titulo, poster, banner, tmdb_id, genero, trailer').limit(40)
        if (sError) console.error("Erro ao buscar séries para o banner:", sError)
        seriesData = series || [];
      }

      const combinedPool = [
        ...moviesData.map(m => ({ ...m, type: 'movie', poster: m.poster || m.backdrop, backdrop: m.backdrop || m.poster, category: m.category, trailer: m.trailer })),
        ...seriesData.map(s => ({ ...s, id: s.id_n, type: 'series', poster: s.poster || s.banner, backdrop: s.banner || s.poster, category: s.genero, trailer: s.trailer }))
      ].filter(item => item.tmdb_id && (item.poster || item.backdrop)); // Filtra itens sem imagem

      // Embaralha o pool combinado
      for (let i = combinedPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [combinedPool[i], combinedPool[j]] = [combinedPool[j], combinedPool[i]];
      }

      setContentPool(combinedPool);
      setLoading(false);
    }
    fetchFeatured();
  }, [type]);

  useEffect(() => {
    if (contentPool.length === 0) return;

    let lastCategory: string | null = null;
    let lastSeriesId: string | null = null;

    const getNextItem = () => {
      let nextItem = null;
      let attempts = 0;
      const maxAttempts = contentPool.length * 2; // Evita loop infinito em pools pequenos

      while (attempts < maxAttempts && !nextItem) {
        const potentialItem = contentPool[currentIndexRef.current];
        
        if (!potentialItem) break;

        const currentCategory = potentialItem.category; // Unificado no mapeamento acima
        const currentSeriesId = potentialItem.type === 'series' ? String(potentialItem.id) : null;

        // Regras de filtragem
        const isSameCategory = currentCategory && lastCategory && currentCategory === lastCategory;
        const isSameSeries = currentSeriesId && lastSeriesId && currentSeriesId === lastSeriesId;

        if (!isSameCategory && !isSameSeries) {
          nextItem = potentialItem;
          lastCategory = currentCategory;
          lastSeriesId = currentSeriesId;
        } else {
          // Tenta o próximo item no pool
          currentIndexRef.current = (currentIndexRef.current + 1) % contentPool.length;
        }
        attempts++;
      }

      // Se não encontrou um item que satisfaça as regras, pega o próximo disponível
      if (!nextItem) {
        nextItem = contentPool[currentIndexRef.current];
      }

      currentIndexRef.current = (currentIndexRef.current + 1) % contentPool.length;
      return nextItem;
    };

    const updateBanner = async () => {
      const itemToDisplay = getNextItem();
      if (!itemToDisplay) return;

      // Busca metadados ricos do TMDB se houver um ID
      let finalData = itemToDisplay;
      if (itemToDisplay.tmdb_id) {
        try {
          const tmdbData = itemToDisplay.type === 'series'
            ? await getShowDetails(itemToDisplay.tmdb_id)
            : await getMovieDetails(itemToDisplay.tmdb_id);
          
          if (tmdbData) {
            finalData = { ...tmdbData, ...itemToDisplay };
          }
        } catch (e) {
          console.warn("TMDB metadata not found for banner item, using local only", itemToDisplay.tmdb_id);
        }
      }
      setCurrentBannerItem(finalData);
    };

    // Inicia o banner imediatamente
    updateBanner();

    // Configura a rotação a cada 30 segundos (Padrão Profissional Streaming)
    const interval = setInterval(updateBanner, 30000);

    return () => clearInterval(interval); // Limpa o intervalo ao desmontar
  }, [contentPool]);

  // Muta o trailer ao rolar a página para não atrapalhar a experiência
  const [isMutedByScroll, setIsMutedByScroll] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      // Se rolar mais de 100px para baixo, muta o vídeo
      setIsMutedByScroll(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lógica para ativar o trailer após 2 segundos de visualização (Padrão Disney+/HBO Max)
  useEffect(() => {
    setShowTrailer(false);
    if (!currentBannerItem?.trailer) return;

    const timer = setTimeout(() => {
      setShowTrailer(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentBannerItem]);

  if (loading || !currentBannerItem) {
    return <div className="w-full h-[50vh] md:h-[80vh] bg-neutral-900 animate-pulse" />
  }

  const title = currentBannerItem.titulo || currentBannerItem.title || currentBannerItem.name;
  const backdropUrl = TMDB_IMG.backdrop(currentBannerItem.backdrop || currentBannerItem.banner || currentBannerItem.backdrop_path);
  const description = currentBannerItem.descricao || currentBannerItem.description || currentBannerItem.overview;
  const id = currentBannerItem.id_n || currentBannerItem.id;
  const detailHref = currentBannerItem.type === 'series' ? `/series/${id}` : `/detalhes/${id}`;

  const year = currentBannerItem.release_date?.slice(0, 4) || 
               currentBannerItem.first_air_date?.slice(0, 4) || 
               currentBannerItem.year || 
               currentBannerItem.ano;
  const rating = currentBannerItem.vote_average || currentBannerItem.rating;
  const countryCode = currentBannerItem.production_countries?.[0]?.iso_3166_1 || 
                     (Array.isArray(currentBannerItem.origin_country) ? currentBannerItem.origin_country[0] : currentBannerItem.origin_country) || '';

  // Extrair ID do YouTube
  const getYouTubeId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const youtubeId = currentBannerItem.trailer ? getYouTubeId(currentBannerItem.trailer) : null;

  return (
    <section className="relative w-full lg:w-[calc(100%+80px)] lg:-ml-[80px] h-[65vh] sm:h-[85vh] md:h-screen overflow-hidden bg-black z-0 border-none">
      {/* Trailer em Segundo Plano */}
      {showTrailer && youtubeId && (
        <div className="absolute inset-0 z-0 scale-[1.15] animate-in fade-in duration-1000">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=${isMutedByScroll ? 1 : 0}&controls=0&loop=1&playlist=${youtubeId}&rel=0&modestbranding=1&enablejsapi=1&iv_load_policy=3&disablekb=1&fs=0&autohide=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
            className="w-full h-full pointer-events-none"
            allow="autoplay; encrypted-media"
            style={{ border: 'none' }}
          />
          {/* Overlay para suavizar a transição do vídeo para o conteúdo */}
          <div className="absolute inset-0 bg-black/10" />
        </div>
      )}

      {/* Imagem de Fundo em Alta Resolução */}
      {backdropUrl && !showTrailer && (
        <div className="absolute inset-0 animate-in fade-in duration-1000">
          <Image 
            src={backdropUrl}
            alt={title}
            fill
            priority
            className="object-cover object-top opacity-100"
            sizes="100vw"
          />
        </div>
      )}

      {/* Conteúdo do Banner - 100px da borda (75px sidebar + 25px gap) */}
      <div className="relative h-full flex flex-col justify-end px-6 lg:pl-[100px] pb-24 md:pb-32 max-w-7xl z-10">
        <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-white mb-4 drop-shadow-2xl">
          {title}
        </h1>
        
        <div className="flex items-center gap-4 mb-4 text-sm md:text-base font-bold text-white drop-shadow-md">
          {countryCode && (
            <img 
              src={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`} 
              alt={countryCode}
              className="h-5 w-auto object-contain rounded-sm shadow-sm"
              title={countryCode}
            />
          )}
          {rating > 0 && <span className="bg-[#00ADEF] text-black px-2 py-0.5 rounded text-xs">TMDB {Number(rating).toFixed(1)}</span>}
          {year && <span className="text-neutral-300">{year}</span>}
        </div>

        {description && (
          <p className="text-sm md:text-lg text-neutral-300 line-clamp-2 mb-8 max-w-xl font-medium drop-shadow">
            {description}
          </p>
        )}
      </div>
    </section>
  )
}
