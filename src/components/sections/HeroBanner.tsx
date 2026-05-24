'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { getMovieDetails, getShowDetails, TMDB_IMG } from '@/lib/tmdb'
import Image from 'next/image'
import Link from 'next/link'

export function HeroBanner({ type }: { type?: 'movie' | 'series' }) {
  const [currentBannerItem, setCurrentBannerItem] = useState<any>(null)
  const [contentPool, setContentPool] = useState<any[]>([])
  const currentIndexRef = useRef(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFeatured() {
      const sb = createClient()
      
      // Busca itens recentes como pool inicial (a aleatoriedade real será feita no embaralhamento abaixo)
      // O uso de RANDOM() no .order() do Supabase JS gera erro 400.
      const { data: movies, error: mError } = await sb.from('cinema').select('id, titulo, poster, backdrop, tmdb_id, category, type').limit(40)
      const { data: series, error: sError } = await sb.from('series').select('id_n, titulo, capa, banner, tmdb_id, genero, type').limit(40)

      if (mError || sError) console.error("Erro ao buscar dados para o banner:", mError || sError)

      let combinedPool = [
        ...(movies || []).map(m => ({ ...m, type: 'movie', poster: m.poster || m.backdrop, backdrop: m.backdrop || m.poster, category: m.category })),
        ...(series || []).map(s => ({ ...s, id: s.id_n, type: 'series', poster: s.capa || s.banner, backdrop: s.banner || s.capa, category: s.genero }))
      ].filter(item => item.tmdb_id && (item.poster || item.backdrop)); // Filtra itens sem imagem

      if (type) {
        combinedPool = combinedPool.filter(item => item.type === type);
      }

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

        const currentCategory = potentialItem.type === 'movie' ? potentialItem.category : potentialItem.genero;
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

    // Configura a rotação a cada 5 segundos
    const interval = setInterval(updateBanner, 5000);

    return () => clearInterval(interval); // Limpa o intervalo ao desmontar
  }, [contentPool]);

  if (loading) {
    return <div className="w-full h-[50vh] md:h-[80vh] bg-neutral-900 animate-pulse" />
  }

  // Se não houver itens no banco, não exibe o banner mas permite que o resto da página carregue
  if (!currentBannerItem) {
    return null;
  }

  const title = currentBannerItem.titulo || currentBannerItem.title || currentBannerItem.name;
  const rawPath = currentBannerItem.backdrop || currentBannerItem.banner || currentBannerItem.backdrop_path;
  const backdropUrl = rawPath ? TMDB_IMG.backdrop(rawPath) : null;
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

  return (
    <section className="relative w-full min-h-[90vh] md:min-h-screen overflow-hidden bg-black">
      {/* Imagem de Fundo em Alta Resolução */}
      {backdropUrl && (
        <div className="absolute inset-0">
          <Image 
            src={backdropUrl}
            alt={title}
            fill
            priority
            className="object-cover object-top opacity-60"
            sizes="100vw"
            unoptimized
          />
          {/* Gradientes Cinematográficos */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
        </div>
      )}

      {/* Conteúdo do Banner */}
      <div className="relative min-h-[90vh] md:min-h-screen flex flex-col justify-end px-6 pb-24 pt-[500px] md:px-12 md:pb-32 md:pt-[650px] max-w-4xl">
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
