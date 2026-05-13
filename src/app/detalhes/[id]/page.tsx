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
    min-height: calc(100vh - 120px);
    margin-top: 120px;
    border-radius: 0;
    border: none;
    overflow: visible;
    background: linear-gradient(180deg, #1f1a1a 0%, #121212 100%);
    box-shadow: none;
  }

  .hero {
    width: 100%;
    height: 470px;
    display: flex;
    background: #000;
    position: relative;
    overflow: hidden;
    margin-bottom: 50px;
  }

  .hero-bg {
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    filter: brightness(0.9) contrast(1.05);
  }

  .hero-overlay {
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.4) 0%,
      rgba(0, 0, 0, 0.3) 35%,
      rgba(0, 0, 0, 0.1) 70%,
      rgba(0, 0, 0, 0.05) 100%
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

  .text-hero-title { font-size: 38px !important; }
  .text-hero-desc { font-size: 18px !important; }

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
  }

  .box {
    background: rgba(35, 35, 35, 0.7);
    border-radius: 18px;
    border: 2px solid rgba(255, 180, 40, 0.25);
    padding: 18px;
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

  .cast-grid { display: flex; gap: 18px; justify-content: space-between; }
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

  .recommend-grid { display: flex; gap: 14px; overflow-x: auto; padding-bottom: 6px; }
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

  @media (max-width: 980px) {
    .middle-sections { grid-template-columns: 1fr; padding: 20px 15px; }
    .hero { height: auto; min-height: 60vh; }
    .hero-content { padding: 20px 15px; }
    .details-box { grid-template-columns: 1fr; }
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
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null)
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
        
        console.log('Loading movie data for ID:', id)
        
        // Tentar parse TMDB ID primeiro (formato filme-id ou serie-id)
        const [type, rawId] = id.split('-')
        const tmdbId = parseInt(rawId, 10)
        
        if (!isNaN(tmdbId)) {
          console.log('TMDB ID detected:', tmdbId, 'type:', type)
          const isMovie = type === 'filme'
          try {
            if (isMovie) {
              const movie = await getMovieDetails(tmdbId)
              const cert = await getMovieCertification(tmdbId)
              movie.certification = cert
              movie.media_type = 'movie'
              foundData = movie
              console.log('TMDB movie loaded:', movie.title)
            } else {
              const show = await getShowDetails(tmdbId)
              const cert = await getShowCertification(tmdbId)
              show.certification = cert
              show.media_type = 'tv'
              foundData = show
              console.log('TMDB show loaded:', show.name)
            }
          } catch (tmdbError) {
            console.error('TMDB error:', tmdbError)
            // Se TMDB falhar, tentar Supabase
          }
        }
        
        // Se não encontrou na TMDB ou não é formato TMDB, buscar no Supabase
        if (!foundData) {
          // Verifica se é um UUID para evitar erro 400 no console
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
          
          if (isUUID) {
            console.log('Trying Supabase for ID:', id)
          const { data: content, error } = await sb
            .from('content')
            .select('*')
            .eq('id', id)
            .single()

          if (content) {
            console.log('Supabase content found:', content.title)
            foundData = content
          }
          }

          if (!foundData) {
            // Tentar tabela 'cinema' também
            console.log('Trying cinema table for ID:', id)
            const { data: cinemaData, error: cinemaError } = await sb
              .from('cinema')
              .select('*')
              .eq('id', parseInt(id))
              .single()

            if (cinemaData) {
              console.log('Cinema data found:', cinemaData.titulo)
              foundData = cinemaData
            } else {
              console.log('No content found anywhere for ID:', id)
            }
          }
        }

        // Se houver um roomId na URL, ativa o player automaticamente
        if (roomFromUrl && foundData) {
          const url = foundData.url || foundData.video_url
          if (url) setActiveVideoUrl(url)
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

  // Efeito para embaralhar recomendações a cada carregamento
  useEffect(() => {
    if (movieData) {
      const rawRecs = movieData.similar?.results || movieData.recommendations?.results || []
      if (rawRecs.length > 0) {
        const shuffled = [...rawRecs]
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
        setShuffledRecommendations(shuffled)
      }
    }
  }, [movieData, resolvedParams])

  const handleStartParty = () => {
    if (!user) return alert('Faça login para criar uma sala de Assistir Juntos!')
    const url = movieData?.url || movieData?.video_url
    if (url) {
      setActiveVideoUrl(url)
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

  const handlePlayContent = () => {
    const url = movieData?.url || movieData?.video_url
    if (url) setActiveVideoUrl(url)
    else alert('O conteúdo principal não está disponível no momento.')
  }

  const handlePlayTrailer = () => {
    // Prioriza o trailer da tabela 'cinema', senão busca no retorno da TMDB
    const trailer = movieData?.trailer || 
                   movieData?.videos?.results?.find((v: any) => v.type === 'Trailer' || v.type === 'Teaser')?.key
    
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
    <>
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
              <div className="action-item">
                <div className="icon">⏰</div>
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
                shuffledRecommendations.map((movie: any) => (
                  <div 
                    key={movie.id} 
                    className="recommend-card card-poster tv-focus" 
                    tabIndex={0}
                    onFocus={(e) => e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })}
                    onClick={() => router.push(`/detalhes/${movie.media_type === 'tv' ? 'serie' : 'filme'}-${movie.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        router.push(`/detalhes/${movie.media_type === 'tv' ? 'serie' : 'filme'}-${movie.id}`)
                      }
                    }}
                  >
                    <div 
                      className="recommend-poster" 
                      style={{ 
                        backgroundImage: movie?.poster_path 
                          ? `url(${IMG.poster(movie.poster_path, 'w500')})` 
                          : 'url(https://via.placeholder.com/140x210)' 
                      }}
                    ></div>
                    <div className="recommend-rating text-metadata">⭐ {movie?.vote_average?.toFixed(1) || 'N/A'}</div>
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
    </>
  )
}
