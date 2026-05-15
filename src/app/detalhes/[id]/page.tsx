'use client'
export const dynamic = 'force-dynamic'

import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState, Suspense, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { IMG, getMovieDetails, getShowDetails, countryFlag, formatRuntime, getMovieCertification, getShowCertification, getTitle } from '@/lib/tmdb'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { useAuth } from '@/components/layout/SupabaseProvider'
import NextDynamic from 'next/dynamic'

const VideoPlayer = NextDynamic(() => import('./VideoPlayer').then(mod => mod.VideoPlayer), {
  ssr: false
})

interface Props { 
  params: Promise<{ id: string }>
}

export default function DetailPage(props: Props) {
  return (
    <Suspense fallback={null}>
      <DetailContent {...props} />
    </Suspense>
  )
}

const CUSTOM_STYLES = `
  /* =========================================================
     PAIXAOFLIX - PÁGINA DETALHES (MODELO 4)
     CSS COMPLETO PARA WINDSURF / HTML PURO
     Paleta: Preto + Vermelho + Dourado
     ========================================================= */

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .page-container {
    width: 100%;
    max-width: 100vw !important;
    min-height: calc(100vh - 120px);
    margin-top: clamp(60px, 8vh, 120px);
    border-radius: 0;
    overflow-x: hidden !important;
    background: var(--bg-absolute) !important;
  }

  .hero {
    width: 100%;
    height: 470px;
    display: flex;
    background: var(--bg-absolute);
    position: relative;
    overflow: hidden;
    margin-bottom: 40px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.9);
  }

  .hero-bg {
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    filter: brightness(0.6) contrast(1.1);
  }

  .hero-overlay {
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to right,
      rgba(0, 0, 0, 0.95) 0%,
      rgba(0, 0, 0, 0.7) 35%,
      rgba(0, 0, 0, 0.2) 100%
    );
  }

  .hero-content {
    position: relative;
    z-index: 10;
    width: 100%;
    padding: 40px var(--container-px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 14px;
  }

  .text-hero-title { font-size: clamp(32px, 5vw, 64px) !important; font-weight: 800; color: #fff; text-shadow: 0 10px 20px rgba(0,0,0,0.8); }
  
  .text-hero-desc, .movie-description {
    font-family: 'Inter', sans-serif !important;
    font-size: clamp(15px, 1.3vw, 19px) !important;
    display: -webkit-box !important;
    -webkit-line-clamp: 2 !important;
    -webkit-box-orient: vertical !important;
    overflow: hidden !important;
    max-width: 700px !important;
    line-height: 1.6 !important;
    color: var(--text-gray) !important;
  }

  .movie-meta {
    display: flex;
    gap: 22px;
    color: rgba(255, 255, 255, 0.75);
    align-items: center;
  }

  .meta-age {
    padding: 3px 10px;
    border-radius: 6px;
    font-weight: 900;
    background: rgba(255, 180, 40, 0.15);
    border: 2px solid rgba(255, 180, 40, 0.55);
    color: #ffd36b;
  }

  .movie-description {
    width: 100%;
    max-width: 650px;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.82);
  }

  .hero-buttons {
    display: flex;
    gap: 18px;
    margin-top: 12px;
  }

  .btn-primary {
    height: 62px;
    padding: 0 28px;
    border-radius: 10px;
    border: 2px solid rgba(255, 0, 0, 0.6);
    background: linear-gradient(180deg, #c20000 0%, #6a0000 100%);
    color: #ffcc55;
    font-size: 18px;
    font-weight: 900;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: 0.2s ease;
  }

  .btn-primary:hover { transform: scale(1.04); }

  .btn-secondary {
    height: 62px;
    padding: 0 28px;
    border-radius: 10px;
    border: 2px solid rgba(255, 180, 40, 0.55);
    background: rgba(0, 0, 0, 0.55);
    color: #ffd36b;
    font-size: 18px;
    font-weight: 900;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: 0.2s ease;
  }

  .btn-secondary:hover { transform: scale(1.04); border-color: rgba(255, 220, 120, 0.85); }

  .btn-tertiary {
    height: 62px;
    padding: 0 28px;
    border-radius: 10px;
    border: 2px solid rgba(255, 180, 40, 0.4);
    background: rgba(0, 0, 0, 0.35);
    color: rgba(255, 255, 255, 0.85);
    font-size: 18px;
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: 0.2s ease;
  }

  .btn-tertiary:hover { transform: scale(1.04); border-color: rgba(255, 220, 120, 0.75); color: #ffd36b; }

  .action-icons { display: flex; gap: 34px; margin-top: 18px; }

  .action-item {
    display: flex;
    align-items: center;
    gap: 10px;
    color: rgba(255, 255, 255, 0.85);
    font-size: 16px;
    cursor: pointer;
    transition: 0.2s ease;
  }

  .action-item:hover { color: #ffd36b; transform: scale(1.05); }

  .action-item .icon {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: 2px solid rgba(255, 180, 40, 0.5);
    background: rgba(255, 180, 40, 0.06);
    display: flex;
    justify-content: center;
    align-items: center;
    color: #d9a23a;
    font-size: 18px;
  }

  .middle-sections {
    display: grid;
    grid-template-columns: 1fr 1.3fr;
    gap: 18px;
    padding: 20px var(--container-px);
    margin-top: 60px;
    min-width: 0;
  }

  .box {
    background: rgba(35, 35, 35, 0.7);
    border-radius: 18px;
    border: 2px solid rgba(255, 180, 40, 0.25);
    padding: 18px;
    min-width: 0;
    overflow: hidden;
  }

  .box-title {
    text-transform: uppercase;
    color: #d9a23a;
    margin-bottom: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .box-title span { color: rgba(255, 255, 255, 0.65); cursor: pointer; }
  .box-title span:hover { color: #ffd36b; }

  .cast-grid { 
    display: flex; 
    gap: 18px; 
    justify-content: flex-start; 
    overflow-x: auto; 
    padding-bottom: 15px;
    -webkit-overflow-scrolling: touch;
  }
  .cast-member { width: 140px; text-align: center; }
  .cast-photo {
    width: 95px;
    height: 95px;
    border-radius: 50%;
    margin: 0 auto 10px auto;
    border: 3px solid rgba(255, 180, 40, 0.55);
    background-size: cover;
    background-position: center;
  }
  .cast-name { font-weight: 900; color: #ffd36b; }
  .cast-role { margin-top: 4px; color: rgba(255, 255, 255, 0.65); }

  .recommend-grid { 
    display: flex; 
    gap: 14px; 
    overflow-x: auto; 
    padding-bottom: 15px;
    -webkit-overflow-scrolling: touch;
  }
  .recommend-grid::-webkit-scrollbar { height: 6px; }
  .recommend-grid::-webkit-scrollbar-thumb { background: rgba(255, 180, 40, 0.35); border-radius: 10px; }

  .recommend-card {
    min-width: 140px;
    height: 210px;
    border-radius: 14px;
    border: 2px solid rgba(255, 0, 0, 0.4);
    overflow: hidden;
    cursor: pointer;
    position: relative;
    background: #111;
    transition: 0.2s ease;
  }

  .recommend-card:hover { transform: scale(1.04); border-color: rgba(255, 180, 40, 0.7); }
  .recommend-poster { width: 100%; height: 100%; background-size: cover; background-position: center; filter: brightness(0.9); }
  .recommend-rating {
    position: absolute;
    bottom: 10px;
    left: 10px;
    padding: 6px 10px;
    border-radius: 10px;
    font-weight: 900;
    background: rgba(0, 0, 0, 0.65);
    border: 1px solid rgba(255, 180, 40, 0.45);
    color: #ffd36b;
  }

  .details-footer { width: 100%; padding: 18px var(--container-px) 28px var(--container-px); position: relative; z-index: 15; }
  .details-box {
    width: 100%;
    border-radius: 18px;
    border: 2px solid rgba(255, 180, 40, 0.25);
    background: rgba(0, 0, 0, 0.55);
    padding: 18px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 18px;
  }
  .details-item { line-height: 1.6; color: rgba(255, 255, 255, 0.8); }
  .details-item b { color: #d9a23a; font-weight: 900; }

  /* Responsividade Global */
  @media (max-width: 1024px) {
    .middle-sections { grid-template-columns: 1fr; gap: 20px; }
    .details-box { grid-template-columns: 1fr 1fr; }
  }

  @media (max-width: 768px) {
    .hero { height: auto; min-height: 60vh; padding-top: 40px; }
    .hero-bg { filter: brightness(1.1) contrast(1.05) !important; }
    .hero-content { padding: 20px 15px; width: 100%; }
    .text-hero-title { font-size: clamp(24px, 8vw, 36px) !important; white-space: normal; }
    .hero-buttons { flex-direction: column; width: 100%; gap: 10px; }
    .btn-primary, .btn-secondary { width: 100%; justify-content: center; height: 55px; font-size: 14px; }
    .action-icons { overflow-x: auto; padding-bottom: 10px; width: 100%; justify-content: flex-start; }
    .details-box { grid-template-columns: 1fr; }
    .movie-description { 
      display: -webkit-box; 
      -webkit-line-clamp: 2; 
      -webkit-box-orient: vertical; 
      overflow: hidden; 
    }
    .cast-grid, .recommend-grid { gap: 12px; }
  }

  @media (max-width: 980px) {
    .cast-grid { flex-wrap: wrap; justify-content: center; gap: 15px; }
    .hero-buttons { flex-direction: column; gap: 12px; }
  }

  ::-webkit-scrollbar-thumb:hover { background: var(--px-red); }
`;

function DetailContent({ params }: Props) {
  const router = useRouter()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const roomFromUrl = searchParams.get('room')
  const [movieData, setMovieData] = useState<any>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isWatchLater, setIsWatchLater] = useState(false)
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null)
  const [isPartyMode, setIsPartyMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [shouldStartParty, setShouldStartParty] = useState(false) // New state for party initiation
  const [shuffledRecommendations, setShuffledRecommendations] = useState<any[]>([])
  const [lastPosition, setLastPosition] = useState(0) // For resume playback
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)

  useEffect(() => {
    async function resolveParams() {
      const resolved = await params
      setResolvedParams(resolved)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (!resolvedParams) return

    async function loadMovieData() {
      try {
        const sb = createClient()
        const id = resolvedParams.id
        let foundData = null
        let localItem = null
        
        // 1. Identificar se o ID é formatado (filme-123) ou ID local (123)
        const [type, rawId] = id.split('-')
        const parsedId = rawId || id

        // 2. BUSCA OBRIGATÓRIA NO BANCO LOCAL (Fonte única de verdade para URL)
        const { data: dbData } = await sb
          .from('cinema')
          .select('*')
          .or(`id.eq.${isNaN(Number(parsedId)) ? -1 : parsedId},tmdb_id.eq.${isNaN(Number(parsedId)) ? -1 : parsedId}`)
          .maybeSingle()

        if (dbData) {
          localItem = dbData
          const tmdbId = dbData.tmdb_id ? Number(dbData.tmdb_id) : null
          const isMovie = dbData.type === 'movie' || dbData.type === 'filme' || type === 'filme'

          // 3. ENRIQUECIMENTO VIA TMDB
          if (tmdbId && !isNaN(tmdbId)) {
          try {
              const metadata = isMovie ? await getMovieDetails(tmdbId) : await getShowDetails(tmdbId)
              const cert = isMovie ? await getMovieCertification(tmdbId) : await getShowCertification(tmdbId)
              foundData = { ...metadata, ...localItem, certification: cert }
          } catch (e) {
              foundData = localItem
          }
          } else {
            foundData = localItem
          }
        }

        if (!foundData) return notFound()

        // Se houver um roomId na URL, ativa o player automaticamente
        if (roomFromUrl && foundData) {
          const url = foundData.url || foundData.video_url
          if (url) {
            setActiveVideoUrl(url)
            setIsPartyMode(true)
          }
        }

        setMovieData(foundData)

        // Verifica se o item já está nos favoritos do usuário
        if (user && id) {
          const { data: fav } = await sb
            .from('favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('content_id', id)
            .maybeSingle()
          
          if (fav) setIsFavorite(true)
        }

        // Verifica se está na lista de Assistir Depois
        if (user && id) {
          const { data: wl } = await sb
            .from('watch_later')
            .select('id')
            .eq('user_id', user.id)
            .eq('content_id', id)
            .maybeSingle()
          if (wl) setIsWatchLater(true)
        }

        // Carrega o último progresso de visualização
        if (user && id) {
          const { data: progress } = await sb
            .from('view_progress')
            .select('last_position')
            .eq('user_id', user.id)
            .eq('content_id', id)
            .maybeSingle()
          if (progress) setLastPosition(progress.last_position)
        }

      } catch (error) {
        console.error('Error loading movie data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMovieData()
  }, [resolvedParams, user])

  // Efeito para buscar recomendações DIRETAMENTE no sistema (Banco Local)
  useEffect(() => {
    if (movieData) {
      async function loadSystemRecs() {
        const sb = createClient()

        // Identifica a categoria ou gênero predominante para a recomendação
        const category = movieData.category || (movieData.genres && movieData.genres[0]?.name)
        const currentTmdbId = movieData.tmdb_id || movieData.id
        const currentLocalId = movieData.id

        // Busca itens do mesmo tipo ou categoria no banco local
        let query = sb
          .from('cinema')
          .select('id, titulo, poster, rating, tmdb_id')

        if (category) {
          query = query.eq('category', category)
        }

        const { data: localMatches } = await query
          .neq('tmdb_id', currentTmdbId)
          .limit(15)

        if (localMatches && localMatches.length > 0) {
          // Embaralha para dar dinamismo à interface
          const shuffled = [...localMatches].sort(() => Math.random() - 0.5).slice(0, 8)
          setShuffledRecommendations(shuffled)
        } else {
          // Fallback: se não houver da mesma categoria, pega itens aleatórios do acervo
          const { data: randomFallback } = await sb
            .from('cinema')
            .select('id, titulo, poster, rating, tmdb_id')
            .limit(8)
          setShuffledRecommendations(randomFallback || [])
        }
      }
      loadSystemRecs()
    }
  }, [movieData, resolvedParams])

  const handleStartParty = () => {
    if (!user) return alert('Faça login para criar uma sala de Assistir Juntos!')
    const url = movieData?.url || movieData?.video_url
    if (url) {
      setActiveVideoUrl(url)
      setIsPartyMode(true)
      setShouldStartParty(true)
    } else {
      alert('O conteúdo não está disponível para iniciar uma sala.')
    }
  }

  async function handleToggleFavorite() {
    if (!user) {
      alert('Faça login para adicionar aos favoritos!')
      return
    }
    if (!resolvedParams?.id) return

    const sb = createClient()
    if (isFavorite) {
      const { error } = await sb.from('favorites').delete().eq('user_id', user.id).eq('content_id', resolvedParams.id)
      if (!error) setIsFavorite(false)
    } else {
      const { error } = await sb.from('favorites').insert({ user_id: user.id, content_id: resolvedParams.id })
      if (!error) setIsFavorite(true)
      else console.error('Erro ao favoritar:', error.message)
    }
  }

  async function handleToggleWatchLater() {
    if (!user) {
      alert('Faça login para adicionar à sua lista!')
      return
    }
    if (!resolvedParams?.id) return

    const sb = createClient()
    if (isWatchLater) {
      const { error } = await sb.from('watch_later').delete().eq('user_id', user.id).eq('content_id', resolvedParams.id)
      if (!error) setIsWatchLater(false)
    } else {
      const { error } = await sb.from('watch_later').insert({ user_id: user.id, content_id: resolvedParams.id })
      if (!error) setIsWatchLater(true)
    }
  }

  const handlePlayContent = () => {
    const url = movieData?.url || movieData?.video_url
    setIsPartyMode(false)
    if (url) setActiveVideoUrl(url)
    else alert('O conteúdo principal não está disponível no momento.')
  }

  const handlePlayTrailer = () => {
    // Prioriza o trailer da tabela 'cinema', senão busca no retorno da TMDB
    const trailer = movieData?.trailer || 
                   movieData?.videos?.results?.find((v: any) => v.type === 'Trailer' || v.type === 'Teaser')?.key
    setIsPartyMode(false)
    
    if (trailer) setActiveVideoUrl(trailer.includes('http') ? trailer : `https://www.youtube.com/watch?v=${trailer}`)
    else alert('Trailer não disponível para este título.')
  }

  const handleNextEpisode = useCallback(() => {
    // Lógica para ir para o próximo episódio (se for série)
    console.log('Próximo episódio!')
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#000' }}>
        <div style={{ color: '#d9a23a', fontSize: '24px' }}>Carregando...</div>
      </div>
    )
  }

  if (!movieData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#000' }}>
        <div style={{ color: '#d9a23a', fontSize: '24px' }}>Filme não encontrado</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <style dangerouslySetInnerHTML={{ __html: CUSTOM_STYLES }} />

      <div className="page-container">

        {/* HERO SECTION */}
        <div className="hero">
          <div className="hero-bg" style={{ 
            backgroundImage: movieData?.backdrop || movieData?.banner || movieData?.backdrop_url
              ? `url(${movieData.backdrop || movieData.banner || movieData.backdrop_url})` 
              : movieData?.backdrop_path 
                ? `url(${IMG.original(movieData.backdrop_path)})`
                : 'url(https://via.placeholder.com/1920x470)' 
          }}></div>
          <div className="hero-overlay"></div>
          
          <div className="hero-content">
            <h1 className="text-hero-title uppercase tracking-wider text-white">
              {movieData?.titulo || movieData?.title || getTitle?.(movieData) || 'NOME DO FILME'}
            </h1>
            
            <div className="movie-meta text-metadata">
              <span>{movieData?.year || new Date(movieData?.release_date || movieData?.first_air_date).getFullYear()}</span>
              {movieData?.duration && (
                <span>{movieData.duration}</span>
              )}
              {movieData?.duration_seconds && (
                <span>{formatRuntime(movieData.duration_seconds / 60)}</span>
              )}
              {movieData?.runtime && (
                <span>{formatRuntime(movieData.runtime)}</span>
              )}
              {movieData?.rating && (
                <span className="meta-age">{movieData.rating}</span>
              )}
              {movieData?.certification && (
                <span className="meta-age">{movieData.certification}</span>
              )}
              {movieData?.vote_average && (
                <span>⭐ {movieData.vote_average?.toFixed(1)}</span>
              )}
            </div>

            <p className="text-hero-desc max-w-[650px] leading-relaxed text-gray-200">
              {movieData?.description || movieData?.overview || 'Descrição não disponível.'}
            </p>

            <div className="hero-buttons">
              <button className="btn-secondary text-button" onClick={() => router.push('/filmes')} style={{ width: 'auto', padding: '0 20px' }}>
                ← VOLTAR
              </button>
              <button className="btn-primary text-button" onClick={handlePlayContent} tabIndex={0}>
                ▶️ ASSISTIR AGORA
              </button>
              <button className="btn-secondary text-button" onClick={handlePlayTrailer} tabIndex={0}>
                ▶️ TRAILER
              </button>
            </div>

            <div className="action-icons">
              <div className="action-item" onClick={handleStartParty} tabIndex={0}>
                <div className="icon">👥</div>
                <span>Assistir Juntos</span>
              </div>
              <div className="action-item" onClick={handlePlayTrailer}>
                <div className="icon">🎬</div>
                <span>Trailer</span>
              </div>
              <div className="action-item" onClick={handleToggleFavorite}>
                <div className="icon" style={{ color: isFavorite ? 'var(--red-primary)' : 'inherit' }}>
                  {isFavorite ? '❤️' : '🤍'}
                </div>
                <span>{isFavorite ? 'Remover' : 'Favorito'}</span>
              </div>
              <div className="action-item" onClick={handleToggleWatchLater} tabIndex={0}>
                <div className="icon" style={{ color: isWatchLater ? 'var(--gold-primary)' : 'inherit' }}>
                  {isWatchLater ? '⏳' : '⏰'}
                </div>
                <span>Assistir Depois</span>
              </div>
              <div className="action-item">
                <div className="icon">🎭</div>
                <span>Cinema</span>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE SECTIONS */}
        <div className="middle-sections">
          {/* ELENCO */}
          <div className="box">
            <div className="box-title text-section-title">
              Elenco
              <span className="text-metadata">Ver todos</span>
            </div>
            <div className="cast-grid">
              {(() => {
                const castArray = movieData?.credits?.cast || 
                  (typeof movieData?.cast_names === 'string' 
                    ? movieData.cast_names.split(',').map((n: string) => n.trim()) 
                    : movieData?.cast_names) || [];
                
                return castArray.length > 0 ? (
                  castArray.slice(0, 8).map((actor: any, index: number) => (
                    <div key={index} className="cast-member">
                      <div 
                        className="cast-photo" 
                        style={{ 
                          backgroundImage: (actor.profile_path || actor.image)
                            ? `url(${IMG.poster(actor.profile_path || actor.image, 'w185')})` 
                            : 'url(https://placehold.co/95x95/1a1a1f/F5C76B?text=Ator)'
                        }}
                      ></div>
                      <div className="cast-name text-card-title">
                        {typeof actor === 'string' ? actor : actor?.name || 'Ator'}
                      </div>
                      <div className="cast-role text-metadata">
                        {typeof actor === 'object' ? actor?.character || 'Personagem' : 'Personagem'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 italic py-10 text-center w-full">
                    Informações de elenco não disponíveis para este título.
                  </div>
                )
              })()}
            </div>
          </div>

          {/* RECOMENDAÇÕES */}
          <div className="box">
            <div className="box-title text-section-title">
              Recomendações
              <span className="text-metadata">Ver todos</span>
            </div>
            <div className="recommend-grid">
              {shuffledRecommendations.length > 0 ? (
                shuffledRecommendations.map((rec: any) => (
                  <div 
                    key={rec.id} 
                    className="recommend-card card-poster tv-focus" 
                    tabIndex={0}
                    onFocus={(e) => e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })}
                    onClick={() => router.push(`/detalhes/${rec.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        router.push(`/detalhes/${rec.id}`)
                      }
                    }}
                  >
                    <div 
                      className="recommend-poster" 
                      style={{ 
                        backgroundImage: rec.poster 
                          ? `url(${rec.poster})` 
                          : 'url(https://via.placeholder.com/140x210/1a1a1f/F5C76B?text=Sem+Capa)' 
                      }}
                    />
                    <div className="recommend-rating text-metadata">⭐ {rec.rating || 'N/A'}</div>
                  </div>
                ))
              ) : (
                <>
                  <div className="recommend-card">
                    <div className="recommend-poster" style={{ backgroundImage: 'url(https://via.placeholder.com/140x210)' }}></div>
                    <div className="recommend-rating">⭐ N/A</div>
                  </div>
                  <div className="recommend-card">
                    <div className="recommend-poster" style={{ backgroundImage: 'url(https://via.placeholder.com/140x210)' }}></div>
                    <div className="recommend-rating">⭐ N/A</div>
                  </div>
                  <div className="recommend-card">
                    <div className="recommend-poster" style={{ backgroundImage: 'url(https://via.placeholder.com/140x210)' }}></div>
                    <div className="recommend-rating">⭐ N/A</div>
                  </div>
                  <div className="recommend-card">
                    <div className="recommend-poster" style={{ backgroundImage: 'url(https://via.placeholder.com/140x210)' }}></div>
                    <div className="recommend-rating">⭐ N/A</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER DETALHES */}
        <div className="details-footer">
          <div className="details-box">
            <div className="details-item">
              <b>Direção:</b> {movieData?.director || (movieData?.credits?.crew?.find((c: any) => c.job === 'Director')?.name) || 'Não informado'}
            </div>
            <div className="details-item">
              <b>Gênero:</b> {
                Array.isArray(movieData?.genre) 
                  ? (typeof movieData.genre === 'string' ? JSON.parse(movieData.genre) : movieData.genre).join(', ') 
                  : Array.isArray(movieData?.genres) 
                    ? movieData.genres.map((g: any) => g.name).join(', ') 
                    : movieData?.category || 'Não informado'
              }
            </div>
            <div className="details-item">
              <b>Lançamento:</b> {movieData?.release_date ? new Date(movieData.release_date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) : movieData?.first_air_date ? new Date(movieData.first_air_date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) : movieData?.year || 'Não informado'}
            </div>
            <div className="details-item">
              <b>Duração:</b> {movieData?.duration || movieData?.duration_seconds ? formatRuntime(movieData.duration_seconds / 60) : movieData?.runtime ? formatRuntime(movieData.runtime) : 'Não informado'}
            </div>
            <div className="details-item">
              <b>Classificação:</b> {movieData?.rating || movieData?.certification || 'Não informado'}
            </div>
            <div className="details-item">
              <b>Produção:</b> {movieData?.production_companies?.map((c: any) => c.name).join(', ') || movieData?.category || (movieData?.production_countries?.map((c: any) => c.name).join(', ')) || 'Não informado'}
            </div>
          </div>
        </div>
      </div>

      {/* PLAYER INTEGRADO (MODAL FULLSCREEN) */}
      {activeVideoUrl && (
        <VideoPlayer 
          src={activeVideoUrl} 
          title={(activeVideoUrl === movieData?.trailer ? "Trailer: " : "") + (movieData?.titulo || movieData?.title || "")}
          contentId={resolvedParams?.id}
          userId={user?.id}
          startOffset={roomFromUrl ? 0 : lastPosition} // Convidados começam do início ou tempo do host
          onClose={() => setActiveVideoUrl(null)} 
          onNext={handleNextEpisode}
          partyRoomId={roomFromUrl || (activeVideoUrl && activeVideoUrl !== movieData?.trailer ? user?.id : null)}
          isGuest={!!roomFromUrl}
        />
      )}
    </div>
  )
}
