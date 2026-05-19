'use client'
export const dynamic = 'force-dynamic'

import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState, Suspense } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { useAuth } from '@/components/layout/SupabaseProvider'
import NextDynamic from 'next/dynamic'
import { getShowDetails, getShowCertification, IMG } from '@/lib/tmdb'

interface EpisodeData { id_n: number; arquivo: string; imagem_342?: string; imagem_185?: string; titulo: string; numero_episodio: number; descricao?: string; duracao?: string; }
interface SeasonData { id_n: number; numero_temporada: number; episodes: EpisodeData[]; }
interface ActorData { name: string; profile_path?: string; image?: string; character?: string; }
interface RecommendationData { id: number | string; poster: string | null; rating: number | null; }

interface SeriesData {
  id?: number | string;
  tmdb_id?: number | null;
  titulo?: string;
  backdrop?: string;
  banner?: string;
  poster_path?: string | null;
  capa?: string;
  poster?: string;
  year?: number;
  ano?: number;
  rating?: string;
  vote_average?: number;
  description?: string;
  descricao?: string;
  overview?: string;
  category?: string;
  genero?: string;
  genres?: { id: number; name: string }[];
  credits?: { cast: ActorData[]; crew: { job: string; name: string }[] };
  cast_names?: string;
  seasons?: SeasonData[];
  trailer?: string;
  videos?: { results: { type: string; key: string }[] };
  type?: string;
}

const VideoPlayer = NextDynamic(() => import('../../detalhes/[id]/VideoPlayer').then(mod => mod.VideoPlayer), {
  ssr: false
})

interface Props { 
  params: Promise<{ id: string }>
}

export default function SeriesDetailPage(props: Props) {
  return (
    <Suspense fallback={null}>
      <SeriesDetailContent {...props} />
    </Suspense>
  )
}

function SeriesDetailContent({ params }: Props) {
  const router = useRouter()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [seriesData, setSeriesData] = useState<SeriesData | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isWatchLater, setIsWatchLater] = useState(false)
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null)
  const [selectedSeason, setSelectedSeason] = useState<SeasonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [shuffledRecommendations, setShuffledRecommendations] = useState<RecommendationData[]>([])
  const [id, setId] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const displayTitle = seriesData?.titulo || 'Nome da Série'
  const displayYear = seriesData?.year || seriesData?.ano || ''
  const displayGenres = seriesData?.genero || (seriesData?.genres?.map(g => g.name).join(', ')) || 'Não informado'
  const displayBackdrop = seriesData?.backdrop || seriesData?.banner || seriesData?.poster_path || seriesData?.poster || seriesData?.capa || 'https://via.placeholder.com/1920x470'
  const displayPoster = seriesData?.poster || seriesData?.capa || seriesData?.poster_path || 'https://via.placeholder.com/320x470'
  const displayDescription = seriesData?.description || seriesData?.descricao || seriesData?.overview || 'Descrição não disponível.'

  const castList = seriesData?.credits?.cast || (typeof seriesData?.cast_names === 'string' ? seriesData.cast_names.split(',').map(n => n.trim()) : seriesData?.cast_names) || []

  useEffect(() => {
    async function loadSeriesData() {
      try {
        const sb = createClient()
        const { id: resolvedId } = await params
        setId(resolvedId)

        const parsedId = resolvedId

        let { data: sData } = await sb
          .from('series')
          .select('*')
          .or(`id_n.eq.${isNaN(Number(parsedId)) ? -1 : parsedId},tmdb_id.eq.${isNaN(Number(parsedId)) ? -1 : parsedId}`)
          .maybeSingle()

        if (!sData) return notFound()

        let seasonsWithEpisodes: SeasonData[] = [];
        const { data: tData } = await sb.from('temporadas').select('*').eq('serie_id', sData.id_n).order('numero_temporada', { ascending: true })
        if (tData) {
          seasonsWithEpisodes = await Promise.all(tData.map(async (season) => {
            const { data: eData } = await sb.from('episodios').select('*').eq('temporada_id', season.id_n).order('numero_episodio', { ascending: true })
            return { ...season, episodes: eData || [] }
          }))
        }

        // Buscar metadados do TMDB para enriquecer com elenco, gêneros, etc.
        let tmdbMetadata: any = null
        if (sData.tmdb_id) {
          try {
            tmdbMetadata = await getShowDetails(Number(sData.tmdb_id))
            const certification = await getShowCertification(Number(sData.tmdb_id))
            if (certification) {
              tmdbMetadata.certification = certification
            }
          } catch (e) {
            console.warn('Falha ao carregar metadados TMDB:', e)
          }
        }

        const foundData: any = {
          ...sData,
          ...tmdbMetadata,
          id: sData.id_n,
          poster: sData.poster || sData.capa,
          backdrop: sData.banner || sData.poster || sData.capa,
          year: sData.ano,
          description: sData.descricao,
          seasons: seasonsWithEpisodes
        }
        if (tmdbMetadata?.poster_path) {
          foundData.poster = IMG.poster(tmdbMetadata.poster_path, 'w500')
        }
        if (tmdbMetadata?.backdrop_path) {
          foundData.backdrop = IMG.original(tmdbMetadata.backdrop_path)
        }
        if (tmdbMetadata?.first_air_date) {
          foundData.year = tmdbMetadata.first_air_date.split('-')[0]
        }
        if (tmdbMetadata?.overview) {
          foundData.description = tmdbMetadata.overview
        }

        if (seasonsWithEpisodes.length > 0) {
          setSelectedSeason(seasonsWithEpisodes[0])
        }

        setSeriesData(foundData)

        if (user && resolvedId) {
          const { data: fav } = await sb.from('favorites').select('id').eq('user_id', user.id).eq('content_id', resolvedId).maybeSingle()
          if (fav) setIsFavorite(true)

          const { data: wl } = await sb.from('watch_later').select('id').eq('user_id', user.id).eq('content_id', resolvedId).maybeSingle()
          if (wl) setIsWatchLater(true)
        }

      } catch (error) {
        console.error('Error loading series data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSeriesData()
  }, [params, user])

  useEffect(() => {
    if (seriesData) {
      async function loadSystemRecs() {
        const sb = createClient()
        const category = seriesData.genero || seriesData.category
        const currentTmdbId = seriesData.tmdb_id || seriesData.id

        let query = sb.from('series').select('id_n, titulo, poster, rating, tmdb_id')

        if (category) {
          query = query.eq('genero', category)
        }

        const { data: localMatches } = await query.neq('tmdb_id', currentTmdbId).limit(8)

        if (localMatches && localMatches.length > 0) {
          const shuffled = localMatches.map(m => ({ ...m, id: m.id_n, poster: m.poster, rating: m.rating })).sort(() => Math.random() - 0.5).slice(0, 8)
          setShuffledRecommendations(shuffled as RecommendationData[])
        } else {
          const { data: randomFallback } = await sb.from('series').select('id_n, titulo, poster, rating, tmdb_id').limit(8)
          const mappedFallback = (randomFallback || []).map(m => ({ ...m, id: m.id_n, poster: m.poster, rating: m.rating }))
          setShuffledRecommendations(mappedFallback as RecommendationData[])
        }
      }
      loadSystemRecs()
    }
  }, [seriesData, id])

  const showToastMsg = (msg: string) => {
    setToastMessage(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2200)
  }

  async function handleToggleFavorite() {
    if (!user) {
      alert('Faça login para adicionar aos favoritos!')
      return
    }
    if (!id) {
      return
    }

    const sb = createClient()
    if (isFavorite) {
      const { error } = await sb.from('favorites').delete().eq('user_id', user.id).eq('content_id', id)
      if (!error) {
        setIsFavorite(false)
        showToastMsg('Removido dos Favoritos!')
      }
    } else {
      const { error } = await sb.from('favorites').insert({ user_id: user.id, content_id: id })
      if (!error) {
        setIsFavorite(true)
        showToastMsg('Adicionado aos Favoritos!')
      }
    }
  }

  async function handleToggleWatchLater() {
    if (!user) {
      alert('Faça login para adicionar à sua lista!')
      return
    }
    if (!id) {
      return
    }

    const sb = createClient()
    if (isWatchLater) {
      const { error } = await sb.from('watch_later').delete().eq('user_id', user.id).eq('content_id', id)
      if (!error) {
        setIsWatchLater(false)
        showToastMsg('Removido de Assistir Depois!')
      }
    } else {
      const { error } = await sb.from('watch_later').insert({ user_id: user.id, content_id: id })
      if (!error) {
        setIsWatchLater(true)
        showToastMsg('Adicionado para Assistir Depois!')
      }
    }
  }

  const handlePlayContent = () => {
    if (seriesData && seriesData.seasons && seriesData.seasons.length > 0) {
      const firstEpisode = seriesData.seasons[0].episodes[0]
      if (firstEpisode && firstEpisode.arquivo) {
        setActiveVideoUrl(firstEpisode.arquivo)
      } else {
        alert('Primeiro episódio não disponível para esta série.')
      }
    }
  }

  const handlePlayEpisode = (episodeUrl: string) => {
    if (episodeUrl) {
      setActiveVideoUrl(episodeUrl)
    } else {
      alert('Este episódio não possui um arquivo de vídeo disponível.')
    }
  }

  const handlePlayTrailer = () => {
    if (!seriesData) {
      return
    }
    const trailer = seriesData.trailer
    if (trailer) {
      setActiveVideoUrl(trailer)
    } else {
      alert('Trailer não disponível para este título.')
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#000' }}>
        <div style={{ color: '#d9a23a', fontSize: '24px' }}>Carregando...</div>
      </div>
    )
  }

  if (!seriesData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#000' }}>
        <div style={{ color: '#d9a23a', fontSize: '24px' }}>Série não encontrada</div>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <link rel="stylesheet" href="/series-mobile.css" />

      {/* FUNDO VIVO MOBILE */}
      <div className="mobile-bg-glow" />

      {/* MOBILE HEADER */}
      <header className="series-mobile-header">
        <div className="brand">
          <h1>PAIXAOFLIX</h1>
          <div className="mini-icons">
            <button className="mini-btn">🔍</button>
            <button className="mini-btn">🎬</button>
            <button className="mini-btn">👤</button>
          </div>
        </div>
      </header>

      {/* MOBILE HERO COMPACTO */}
      <section className="series-hero-mini">
        <div className="series-hero-top">
          <div className="series-mini-poster">
            <Image 
                src={displayPoster} 
                alt={displayTitle} 
                width={92} 
                height={132} 
                unoptimized 
            />
          </div>

          <div className="series-mini-info">
            <h2>{displayTitle}</h2>

            <div className="series-mini-meta">
              <span>{displayYear}</span>
              <span>{seriesData.genero || 'Série'}</span>
              {seriesData.seasons && (
                <span>{seriesData.seasons.length} Temporadas</span>
              )}
              {seriesData.vote_average && (
                <span className="meta-rating">★ {seriesData.vote_average?.toFixed(1)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="series-mini-desc">
          {displayDescription}
        </div>

        <div className="series-actions">
          <button className="btn-primary" onClick={handlePlayContent}>▶ Continuar Assistindo</button>

          <div className="btn-row">
              <button className="btn-secondary" onClick={handlePlayTrailer}>🎞 Trailer</button>
            <button className={`btn-icon ${isFavorite ? 'active' : ''}`} id="btnFavorito" onClick={handleToggleFavorite}>❤</button>
            <button className={`btn-icon ${isWatchLater ? 'active' : ''}`} id="btnAssistirDepois" onClick={handleToggleWatchLater}>🕒</button>
          </div>
        </div>
      </section>

      {/* MOBILE MAIN CONTENT */}
      <main className="series-mobile-page">
        {/* EPISÓDIOS */}
        {seriesData.seasons && seriesData.seasons.length > 0 && (
          <section className="panel">
            <div className="panel-header">
              <h3>Episódios</h3>
              <select
                className="season-select" 
                id="seasonSelect"
                value={selectedSeason?.id_n || ''}
                onChange={(e) => {
                  const season = seriesData.seasons?.find((s: SeasonData) => s.id_n === Number(e.target.value))
                  if (season) setSelectedSeason(season)
                }}
              >
                {seriesData.seasons.map((season: SeasonData) => (
                  <option key={season.id_n} value={season.id_n}>
                    Temporada {season.numero_temporada}
                  </option>
                ))}
              </select>
            </div>

            <div className="episodes-list" id="episodesList">
              {selectedSeason?.episodes.map((episode: EpisodeData, index: number) => (
                <div 
                  key={episode.id_n} 
                  className="episode-item"
                  onClick={() => handlePlayEpisode(episode.arquivo)}
                >
                  <div 
                    className="ep-thumb" 
                    style={{ backgroundImage: `url(${episode.imagem_342 || episode.imagem_185 || 'https://via.placeholder.com/342x185'})` }}
                  >
                    <div className="ep-play">▶</div>
                  </div>

                  <div className="ep-info">
                    <strong>{index + 1}. {episode.titulo}</strong>
                    <span>{episode.duracao || 'Duração não informada'}</span>

                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '0%' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <div className="toast" id="toast"></div>
      <script src="/series-mobile.js" defer />

      <div className="page-container">
        <link rel="stylesheet" href="/series-desktop.css" /> {/* Link para o CSS desktop */}
        <div className="series-bg-glow" />

        {/* HERO SECTION */}
        <div className="hero"> {/* Este div é o hero do desktop */}
          <div className="hero-bg" style={{ backgroundImage: `url(${displayBackdrop})` }}></div>
          <div className="hero-overlay"></div>
          
          <div className="hero-content">
            <div className="series-poster">
              <Image src={displayPoster} alt={displayTitle} fill unoptimized />
            </div>

            <div className="series-info">
              <h1 className="uppercase tracking-wider text-white">
                {displayTitle}
              </h1>

              <div className="series-meta">
                <span>{displayYear}</span>
                <span>{displayGenres}</span>
                {seriesData.seasons && (
                  <span>{seriesData.seasons.length} Temporada{seriesData.seasons.length > 1 ? 's' : ''}</span>
                )}
                {seriesData.vote_average && (
                  <span className="rating-badge">⭐ {seriesData.vote_average?.toFixed(1)}</span>
                )}
              </div>

              <div className="badges-row">
                <span className="badge">4K</span>
                <span className="badge">HDR</span>
                <span className="badge">Dolby Vision</span>
                <span className="badge">Dolby Atmos</span>
              </div>

              <p className="series-desc">
                {displayDescription}
              </p>

              <div className="series-actions">
                <button className="btn-primary" onClick={handlePlayContent}>
                  ▶ Assistir Agora
                </button>
                <button className="btn-secondary" onClick={handlePlayTrailer}>
                  🎞 Trailer
                </button>
                <button className={`btn-icon ${isFavorite ? 'active' : ''}`} onClick={handleToggleFavorite}>
                  {isFavorite ? '❤️' : '🤍'}
                </button>
                <button className={`btn-icon ${isWatchLater ? 'active' : ''}`} onClick={handleToggleWatchLater}>
                  {isWatchLater ? '⏳' : '⏰'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* EPISÓDIOS */}
        {seriesData.seasons && seriesData.seasons.length > 0 ? (
          <div className="series-page">
            <section className="panel">
              <div className="panel-title">
                <h2>Episódios</h2>
                <select 
                  className="season-select" 
                  value={selectedSeason?.id_n || ''}
                  onChange={(e) => {
                    const season = seriesData.seasons?.find((s: SeasonData) => s.id_n === Number(e.target.value))
                    if (season) setSelectedSeason(season)
                  }}
                >
                  {seriesData.seasons.map((season: SeasonData) => (
                    <option key={season.id_n} value={season.id_n}>
                      Temporada {season.numero_temporada}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSeason && selectedSeason.episodes.length > 0 ? (
                <div className="episodes-grid">
                  {selectedSeason.episodes.map((episode: EpisodeData) => (
                    <div 
                      key={episode.id_n} 
                      className="episode-card"
                      onClick={() => handlePlayEpisode(episode.arquivo)}
                    >
                      <div 
                        className="episode-thumb" 
                        style={{ backgroundImage: `url(${episode.imagem_342 || episode.imagem_185 || 'https://via.placeholder.com/342x185'})` }}
                      >
                        <div className="episode-play">▶</div>
                      </div>
                      <div className="episode-info">
                        <h3>{episode.numero_episodio}. {episode.titulo}</h3>
                        <p>{episode.duracao || 'Duração não informada'}</p>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: '0%' }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 italic py-10 text-center w-full">
                  Nenhum episódio disponível para esta temporada.
                </div>
              )}
            </section>

            {/* ELENCO */}
            <section className="panel"> {/* Esta seção é para o elenco do desktop */}
              <div className="panel-title">
                <h2>Elenco Principal</h2>
              </div>

              <div className="cast-row">
                {castList.length > 0 ? (
                  castList.slice(0, 8).map((actor: ActorData | string, index: number) => {
                    const actorName = typeof actor === 'string' ? actor : actor.name;
                    const actorCharacter = typeof actor === 'string' ? 'Personagem' : (actor.character || 'Personagem');
                    const photoUrl = typeof actor === 'object' && (actor.profile_path || actor.image)
                      ? `https://image.tmdb.org/t/p/w185${actor.profile_path || actor.image}`
                      : 'https://placehold.co/92x92/1a1a1f/F5C76B?text=Ator';
                    return (
                      <div key={index} className="cast-card">
                        <div className="cast-avatar">
                          <Image src={photoUrl} alt={actorName} fill unoptimized />
                        </div>
                        <strong>{actorName}</strong>
                        <span>{actorCharacter}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-gray-400 italic py-10 text-center w-full">
                    Informações de elenco não disponíveis para esta série.
                  </div>
                )}
              </div>
            </section>

            {/* RECOMENDAÇÕES */}
            <section className="panel"> {/* Esta seção é para as recomendações do desktop */}
              <div className="panel-title">
                <h2>Recomendações para você</h2>
              </div>

              <div className="recommend-row">
                {shuffledRecommendations.length > 0 ? (
                  shuffledRecommendations.map((rec: RecommendationData) => (
                    <div
                      key={rec.id}
                      className="recommend-card"
                      onClick={() => router.push(`/series/${rec.id}`)}
                    >
                      <div
                        className="recommend-poster" 
                        style={{ 
                          backgroundImage: rec.poster 
                            ? `url(${rec.poster})` 
                            : 'url(https://via.placeholder.com/160x240/1a1a1f/F5C76B?text=Sem+Capa)' 
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <>
                    <div className="recommend-card">
                      <div className="recommend-poster" style={{ backgroundImage: 'url(https://via.placeholder.com/160x240)' }} />
                    </div>
                    <div className="recommend-card">
                      <div className="recommend-poster" style={{ backgroundImage: 'url(https://via.placeholder.com/160x240)' }} />
                    </div>
                    <div className="recommend-card">
                      <div className="recommend-poster" style={{ backgroundImage: 'url(https://via.placeholder.com/160x240)' }} />
                    </div>
                    <div className="recommend-card">
                      <div className="recommend-poster" style={{ backgroundImage: 'url(https://via.placeholder.com/160x240)' }} />
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* TOAST */}
      {showToast && (
        <div className={`toast ${showToast ? 'show' : ''}`}>
          {toastMessage}
        </div>
      )}

      {/* PLAYER INTEGRADO */}
      {activeVideoUrl && (
        <VideoPlayer 
          src={activeVideoUrl} 
          title={displayTitle}
          contentId={id}
          userId={user?.id}
          startOffset={0}
          onClose={() => setActiveVideoUrl(null)} 
          onNext={() => {}}
          partyRoomId={null}
          isGuest={false}
          shouldStartParty={false}
        />
      )} {/* Fim do VideoPlayer */}
    </>
  );
}
