'use client'
export const dynamic = 'force-dynamic'

import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState, Suspense, useCallback } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { IMG, getMovieDetails, getShowDetails, formatRuntime, getMovieCertification, getShowCertification, getTitle, TMDBMovie, TMDBShow } from '@/lib/tmdb'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { useAuth } from '@/components/layout/SupabaseProvider'
import NextDynamic from 'next/dynamic'

interface TMDBGenre { id: number; name: string; }
interface VideoResult { type: string; key: string; }
interface ActorData { name: string; profile_path?: string; image?: string; character?: string; }
interface CrewMemberData { job: string; name: string; }
export interface EpisodeData { id_n: number; arquivo: string; imagem_342?: string; imagem_185?: string; titulo: string; numero_episodio: number; descricao?: string; duracao?: string; }
interface SeasonData { id_n: number; numero_temporada: number; episodes: EpisodeData[]; }
interface RecommendationData { id: number | string; poster: string | null; rating: number | null; }

interface MovieData {
  id?: number | string;
  tmdb_id?: number | null;
  type?: string;
  titulo?: string;
  title?: string; // Para compatibilidade TMDBMovie
  name?: string;  // Para compatibilidade TMDBShow
  original_title?: string;
  original_name?: string;
  backdrop?: string;
  banner?: string;
  adult?: boolean;
  original_language?: string;
  backdrop_url?: string;
  backdrop_path?: string;
  poster_path?: string | null;
  year?: number;
  release_date?: string;
  first_air_date?: string;
  duration?: string;
  duration_seconds?: number;
  runtime?: number;
  rating?: string;
  certification?: string;
  vote_average?: number;
  vote_count?: number;
  description?: string;
  overview?: string;
  url?: string;
  video_url?: string;
  trailer?: string;
  category?: string;
  genres?: TMDBGenre[];
  genre_ids?: number[];
  genre?: string | string[];
  director?: string;
  credits?: { cast: ActorData[]; crew: CrewMemberData[] };
  cast_names?: string;
  seasons?: SeasonData[];
  production_companies?: { name: string }[];
  production_countries?: { name: string }[];
  videos?: { results: VideoResult[] };
}

const VideoPlayer = NextDynamic(() => import('../../VideoPlayer').then(mod => mod.VideoPlayer), {
  ssr: false,
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

function DetailContent({ params }: Props) {
  const router = useRouter()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const roomFromUrl = searchParams.get('room')
  const [movieData, setMovieData] = useState<MovieData | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isWatchLater, setIsWatchLater] = useState(false)
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null)
  const [selectedSeason, setSelectedSeason] = useState<SeasonData | null>(null);
  const [loading, setLoading] = useState(true)
  const [shouldStartParty, setShouldStartParty] = useState(false)
  const [shuffledRecommendations, setShuffledRecommendations] = useState<RecommendationData[]>([])
  const [lastPosition, setLastPosition] = useState(0) // For resume playback
  const [id, setId] = useState<string | null>(null)

  // Título e Metadados centralizados para evitar complexidade no parsing do JSX
  const displayTitle = movieData?.titulo || movieData?.title || movieData?.name || (movieData ? getTitle(movieData as TMDBMovie | TMDBShow) : '') || 'NOME DO FILME';

  // Pre-calcula metadados para simplificar o JSX e evitar erros de parsing
  const displayYear = movieData?.year || movieData?.release_date?.split('-')[0] || movieData?.first_air_date?.split('-')[0] || '';
  
  const displayDuration = movieData?.duration || 
    (movieData?.duration_seconds ? formatRuntime(Math.floor(movieData.duration_seconds / 60)) : 
    (movieData?.runtime ? formatRuntime(movieData.runtime) : '')) || 'Não informado';
    
  const displayRating = movieData?.rating || movieData?.certification;
  
  const displayGenres = Array.isArray(movieData?.genre) ? movieData.genre.join(', ') : 
    (Array.isArray(movieData?.genres) ? movieData.genres.map(g => g.name).join(', ') : 
    (movieData?.category || 'Não informado'));

  const displayDirector = movieData?.director || movieData?.credits?.crew?.find((c: CrewMemberData) => c.job === 'Director')?.name || 'Não informado';
  
  const dateOpts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  const displayReleaseDate = movieData?.release_date 
    ? new Date(movieData.release_date).toLocaleDateString('pt-BR', dateOpts) 
    : (movieData?.first_air_date ? new Date(movieData.first_air_date).toLocaleDateString('pt-BR', dateOpts) : (movieData?.year?.toString() || 'Não informado'));

  const displayProduction = movieData?.production_companies?.map((c: { name: string }) => c.name)?.join(', ') 
    || movieData?.category 
    || movieData?.production_countries?.map((c: { name: string }) => c.name)?.join(', ') 
    || 'Não informado';

  const displayBackdrop = movieData?.backdrop || movieData?.banner || movieData?.backdrop_url || (movieData?.backdrop_path ? IMG.original(movieData.backdrop_path) : 'https://via.placeholder.com/1920x470');

  const castList = movieData?.credits?.cast || 
    (typeof movieData?.cast_names === 'string' ? movieData.cast_names.split(',').map(n => n.trim()) : movieData?.cast_names) || [];

  useEffect(() => {
    async function loadMovieData() {
      try {
        const sb = createClient()
        const { id: resolvedId } = await params
        setId(resolvedId)
        
        const id = resolvedId
        let foundData: MovieData | null = null
        let localItem: MovieData | null = null
        
        // 1. Identificar se o ID é formatado (filme-123) ou ID local (123)
        const [type, rawId] = id.split('-')
        const parsedId = rawId || id

        // 2. BUSCA OBRIGATÓRIA NO BANCO LOCAL (Fonte de verdade para URL e tipo)
        let { data: dbData } = await sb
          .from('cinema')
          .select('*')
          .or(`id.eq.${isNaN(Number(parsedId)) ? -1 : parsedId},tmdb_id.eq.${isNaN(Number(parsedId)) ? -1 : parsedId}`)
          .maybeSingle()

        // Se não encontrar na tabela cinema, tenta na tabela series (migração 007)
        if (!dbData) {
          const { data: sData } = await sb
            .from('series')
            .select('id_n,titulo,tmdb_id,ano,rating,descricao,capa,poster,banner,trailer,genero,created_at')
            .or(`id_n.eq.${isNaN(Number(parsedId)) ? -1 : parsedId},tmdb_id.eq.${isNaN(Number(parsedId)) ? -1 : parsedId}`)
            .maybeSingle()
          
          if (sData) {
            dbData = { 
              ...sData, 
              id: sData.id_n, 
              type: 'series',
              poster: sData.poster || sData.capa,
              year: sData.ano,
              description: sData.descricao
            }
          }
        }

        if (dbData) {
          const isMovie = dbData.type === 'movie' || dbData.type === 'filme' || type === 'filme'
          const tmdbId = dbData.tmdb_id ? Number(dbData.tmdb_id) : null

          if (isMovie) {
            // Lógica para Filmes
            localItem = dbData
            if (tmdbId) {
              try {
                const metadata = await getMovieDetails(tmdbId)
                const cert = await getMovieCertification(tmdbId)
                foundData = { ...metadata, ...localItem, certification: cert }
              } catch {
                foundData = localItem
              }
            } else {
              foundData = localItem
            }
          } else { // É uma Série
            localItem = dbData
            let tmdbSeriesMetadata: MovieData | null = null;
            let seasonsWithEpisodes: SeasonData[] = [];

            // Tenta garantir que temos os dados da tabela series
            let seriesLocalData = dbData.type === 'series' ? dbData : null
            if (!seriesLocalData) {
               const { data: sData } = await sb
                .from('series')
                .select('id_n,titulo,tmdb_id,ano,rating,descricao,capa,poster,banner,trailer,genero')
                .or(`tmdb_id.eq.${tmdbId || -1},id_n.eq.${dbData.id || parsedId}`)
                .maybeSingle()
               seriesLocalData = sData
            }

            if (seriesLocalData) {
              const { data: tData } = await sb.from('temporadas').select('*').eq('serie_id', seriesLocalData.id_n || seriesLocalData.id).order('numero_temporada', { ascending: true })
              if (tData) {
                seasonsWithEpisodes = await Promise.all(tData.map(async (season) => {
                  const { data: eData } = await sb.from('episodios').select('*').eq('temporada_id', season.id_n).order('numero_episodio', { ascending: true })
                  return { ...season, episodes: eData || [] }
                }))
              }
            }

            // 4. Buscar metadados da série no TMDB
            if (tmdbId) {
              try {
                tmdbSeriesMetadata = await getShowDetails(tmdbId)
                tmdbSeriesMetadata.certification = await getShowCertification(tmdbId)
              } catch (e) {
                console.warn('Falha ao carregar metadados TMDB para série.', e)
              }
            }

            foundData = {
              ...tmdbSeriesMetadata, // Metadados TMDB (overview, cast, etc.)
              ...dbData,             // Dados do banco local
              ...seriesLocalData,    // Dados da nova tabela series (capa, banner, etc.)
              seasons: seasonsWithEpisodes,
              type: 'series' as const
            }
            if (seasonsWithEpisodes.length > 0) {
              setSelectedSeason(seasonsWithEpisodes[0])
            }
          }
        }

        if (!foundData) return notFound()

        // Se houver um roomId na URL, ativa o player automaticamente
        if (roomFromUrl && foundData && foundData.url) { // Apenas se houver URL para o conteúdo principal
          const url = foundData.url || foundData.video_url
          if (url) {
            setActiveVideoUrl(url)
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
  }, [params, user, roomFromUrl])

  // Efeito para buscar recomendações DIRETAMENTE no sistema (Banco Local)
  useEffect(() => {
    if (movieData) {
      async function loadSystemRecs() {
        const sb = createClient()

        // Identifica a categoria ou gênero predominante para a recomendação
        const category = movieData.category || (movieData.genres && movieData.genres[0]?.name)
        const currentTmdbId = movieData.tmdb_id || movieData.id

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
  }, [movieData, id])

  const handleStartParty = () => {
    if (!user) return alert('Faça login para criar uma sala de Assistir Juntos!')
    const url = movieData?.url || movieData?.video_url
    if (url) {
      setActiveVideoUrl(url)
      setShouldStartParty(true)
    }
  }

  async function handleToggleFavorite() {
    if (!user) {
      alert('Faça login para adicionar aos favoritos!')
      return
    }
    if (!id) return

    const sb = createClient()
    if (isFavorite) {
      const { error } = await sb.from('favorites').delete().eq('user_id', user.id).eq('content_id', id)
      if (!error) setIsFavorite(false)
    } else {
      const { error } = await sb.from('favorites').insert({ user_id: user.id, content_id: id })
      if (!error) setIsFavorite(true)
      else console.error('Erro ao favoritar:', error.message)
    }
  }

  async function handleToggleWatchLater() {
    if (!user) {
      alert('Faça login para adicionar à sua lista!')
      return
    }
    if (!id) return

    const sb = createClient()
    if (isWatchLater) {
      const { error } = await sb.from('watch_later').delete().eq('user_id', user.id).eq('content_id', id)
      if (!error) setIsWatchLater(false)
    } else {
      const { error } = await sb.from('watch_later').insert({ user_id: user.id, content_id: id })
      if (!error) setIsWatchLater(true)
    }
  }

  const handlePlayContent = () => {
    if (movieData.type === 'series' && movieData.seasons && movieData.seasons.length > 0) {
      const firstEpisode = movieData.seasons[0].episodes[0]
      if (firstEpisode && firstEpisode.arquivo) {
        setActiveVideoUrl(firstEpisode.arquivo)
      } else {
        alert('Primeiro episódio não disponível para esta série.')
      }
    } else {
      const url = movieData?.url || movieData?.video_url
      if (url) setActiveVideoUrl(url)
      else alert('O conteúdo principal não está disponível no momento.')
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
    // Prioriza o trailer da tabela 'cinema', senão busca no retorno da TMDB
    const trailer = movieData?.trailer || 
                   movieData?.videos?.results?.find((v: VideoResult) => v.type === 'Trailer' || v.type === 'Teaser')?.key
    
    if (trailer) setActiveVideoUrl(trailer.includes('http') ? trailer : `https://www.youtube.com/watch?v=${trailer}`)
    else alert('Trailer não disponível para este título.')
  }

  const handleNextEpisode = useCallback(() => {
    if (movieData?.type === 'series' && selectedSeason && movieData.seasons) {
      const currentSeasonIndex = movieData.seasons.findIndex((s: SeasonData) => s.id_n === selectedSeason.id_n)
      if (currentSeasonIndex !== -1) {
        const currentEpisodeIndex = selectedSeason.episodes.findIndex((e: EpisodeData) => e.arquivo === activeVideoUrl)
        if (currentEpisodeIndex !== -1) {
          // Tenta o próximo episódio na temporada atual
          if (currentEpisodeIndex < selectedSeason.episodes.length - 1) {
            const nextEpisode = selectedSeason.episodes[currentEpisodeIndex + 1]
            setActiveVideoUrl(nextEpisode.arquivo)
            return
          }
          // Tenta a próxima temporada
          if (currentSeasonIndex < (movieData.seasons.length - 1)) {
            const nextSeason = movieData.seasons[currentSeasonIndex + 1]
            if (nextSeason.episodes.length > 0) {
              const firstEpisodeOfNextSeason = nextSeason.episodes[0]
              setSelectedSeason(nextSeason)
              setActiveVideoUrl(firstEpisodeOfNextSeason.arquivo)
              return
            }
          }
        }
      }
    }
    alert('Fim da série ou próximo episódio não disponível.')
    setActiveVideoUrl(null) // Fecha o player se não houver próximo episódio
  }, [movieData, selectedSeason, activeVideoUrl]);

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
      <link rel="stylesheet" href="/detalhes-desktop.css" />

      {/* FUNDO VIVO MOBILE */}
      <div className="mobile-bg-glow"></div>

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
              src={movieData?.poster_path ? IMG.poster(movieData.poster_path, 'w342') : 'https://via.placeholder.com/92x132'}
              alt={displayTitle}
              width={92}
              height={132}
              priority
            />
          </div>

          <div className="series-mini-info">
            <h2>{displayTitle}</h2>

            <div className="series-mini-meta">
              <span>{displayYear}</span>
              <span>{displayGenres}</span>
              {movieData?.type === 'series' && movieData.seasons && (
                <span>{movieData.seasons.length} Temporadas</span>
              )}
              <span className="meta-rating">★ {movieData?.vote_average?.toFixed(1)}</span>
            </div>
          </div>
        </div>

        <div className="series-mini-desc">
          {movieData?.description || movieData?.overview || 'Descrição não disponível.'}
        </div>

        <div className="series-actions">
          <button className="btn-primary" onClick={handlePlayContent}>▶ Continuar Assistindo</button>

          <div className="btn-row">
            <button className="btn-secondary" onClick={handlePlayTrailer}>🎞 Trailer</button>
            <button className="btn-icon" id="btnFavorito" onClick={handleToggleFavorite} style={{ color: isFavorite ? 'rgba(255, 120, 120, 0.95)' : 'inherit' }}>❤</button>
            <button className="btn-icon" id="btnAssistirDepois" onClick={handleToggleWatchLater} style={{ color: isWatchLater ? 'rgba(255, 211, 122, 0.88)' : 'inherit' }}>🕒</button>
          </div>
        </div>
      </section>

      {/* MOBILE MAIN CONTENT */}
      <main className="series-mobile-page">
        {/* EPISÓDIOS - APENAS PARA SÉRIES */}
        {movieData?.type === 'series' && movieData.seasons && movieData.seasons.length > 0 && (
          <section className="panel">
            <div className="panel-header">
              <h3>Episódios</h3>
              <select className="season-select" id="seasonSelect">
                {movieData.seasons.map((season: SeasonData) => (
                  <option key={season.id_n} value={season.numero_temporada}>
                    Temporada {season.numero_temporada}
                  </option>
                ))}
              </select>
            </div>
            <div className="episodes-list" id="episodesList"></div>
          </section>
        )}

        {/* ELENCO */}
        <section className="panel">
          <div className="panel-header">
            <h3>Elenco Principal</h3>
          </div>
          <div className="cast-row">
            {castList.length > 0 ? (
              castList.slice(0, 5).map((actor: ActorData | string, index: number) => {
                const photoUrl = (typeof actor === 'object' && (actor.profile_path || actor.image))
                  ? IMG.poster(actor.profile_path || actor.image, 'w185')
                  : 'https://placehold.co/86x86/1a1a1f/F5C76B?text=Ator';
                return (
                  <div key={index} className="cast-card">
                    <div 
                      className="cast-avatar" 
                      style={{ backgroundImage: `url(${photoUrl})` }}
                    ></div>
                    <strong>{typeof actor === 'string' ? actor : (actor as ActorData).name || 'Ator'}</strong>
                    <span>{typeof actor === 'object' ? (actor as ActorData).character || 'Personagem' : 'Personagem'}</span>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', width: '100%', color: 'rgba(245,245,245,0.65)' }}>
                Elenco não disponível
              </div>
            )}
          </div>
        </section>

        {/* RECOMENDAÇÕES */}
        <section className="panel">
          <div className="panel-header">
            <h3>Recomendações</h3>
          </div>
          <div className="recommend-row">
            {shuffledRecommendations.length > 0 ? (
              shuffledRecommendations.slice(0, 6).map((rec: RecommendationData) => (
                <div 
                  key={rec.id} 
                  className="recommend-card" 
                  onClick={() => router.push(`/detalhes/${rec.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div 
                    className="recommend-poster" 
                    style={{ 
                      backgroundImage: rec.poster 
                        ? `url(${rec.poster})` 
                        : 'url(https://via.placeholder.com/150x220/1a1a1f/F5C76B?text=Sem+Capa)' 
                    }}
                  />
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', width: '100%', color: 'rgba(245,245,245,0.65)' }}>
                Recomendações não disponíveis
              </div>
            )}
          </div>
        </section>
      </main>

      {/* TOAST NOTIFICAÇÃO */}
      <div className="toast" id="toast"></div>

      {/* DESKTOP PAGE CONTAINER - NÃO ALTERAR */}
      <div className="page-container">

        {/* HERO SECTION */}
        <div className="hero">
          <div className="hero-bg" style={{ backgroundImage: `url(${displayBackdrop})` }}></div>
          <div className="hero-overlay"></div>
          
          <div className="hero-content">
            <h1 className="text-hero-title uppercase tracking-wider text-white">
              {displayTitle}
            </h1>

            <div className="movie-meta text-metadata">
              <span>{displayYear}</span>
              {displayDuration !== 'Não informado' && (
                <span>{displayDuration}</span>
              )}
              {displayRating !== 'Não informado' && (
                <span className="meta-age">{displayRating}</span>
              )}
              {movieData?.vote_average && (
                <span>⭐ {movieData.vote_average?.toFixed(1)}</span>
              )}
            </div>

            <p className="text-hero-desc movie-description max-w-[700px] leading-relaxed text-gray-200">
              {movieData?.description || movieData?.overview || 'Descrição não disponível.'}
            </p>

            <div className="hero-buttons">
              <button className="btn-secondary text-button" onClick={() => router.back()} style={{ width: 'auto', padding: '0 25px' }}>
                ← VOLTAR
              </button>
              <button className="btn-primary text-button" onClick={handlePlayContent} tabIndex={0}>
                ▶️ ASSISTIR AGORA
              </button>
              <button className="btn-secondary text-button" onClick={handlePlayTrailer} tabIndex={0}>
                ▶️ TRAILER
              </button>
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
              <div className="action-item" onClick={handleStartParty} tabIndex={0}>
                <div className="icon">👥</div>
                <span>Assistir Juntos</span>
              </div>
            </div>
          </div>
        </div>

        {/* SEÇÃO DE TEMPORADAS E EPISÓDIOS (APENAS PARA SÉRIES) */}
        {movieData?.type === 'series' && movieData.seasons && movieData.seasons.length > 0 && (
          <div className="middle-sections" style={{ marginTop: '40px' }}>
            <div className="box" style={{ gridColumn: '1 / -1' }}> {/* Ocupa a largura total */}
              <div className="box-title text-section-title">
                Temporadas
              </div>
              <div className="season-selector">
                {movieData.seasons.map((season: SeasonData) => (
                  <button
                    key={season.id_n}
                    onClick={() => setSelectedSeason(season)}
                    className={`btn ${selectedSeason?.id_n === season.id_n ? 'btn-red' : 'btn-ghost'}`}
                    tabIndex={0}
                  >
                    Temporada {season.numero_temporada}
                  </button>
                ))}
              </div>

              {selectedSeason && selectedSeason.episodes.length > 0 ? (
                <div className="episode-list">
                  {selectedSeason.episodes.map((episode: EpisodeData) => (
                    <div 
                      key={episode.id_n} 
                      className="episode-item tv-focus"
                      onClick={() => handlePlayEpisode(episode.arquivo)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handlePlayEpisode(episode.arquivo); }}
                      tabIndex={0}
                    >
                      <div className="episode-thumbnail">
                        <Image
                          src={episode.imagem_342 || episode.imagem_185 || 'https://via.placeholder.com/342x185'}
                          alt={episode.titulo || 'Episódio'}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-white text-3xl">▶</span>
                        </div>
                      </div>
                      <div className="episode-info">
                        <h3>{episode.numero_episodio}. {episode.titulo}</h3>
                        <p className="line-clamp-2">{episode.descricao}</p>
                        {episode.duracao && (
                          <p className="duration">Duração: {episode.duracao}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 italic py-10 text-center w-full">
                  Nenhum episódio disponível para esta temporada.
                </div>
              )}
            </div>
          </div>
        )}

        {/* MIDDLE SECTIONS (APENAS PARA FILMES OU SEÇÕES DE SÉRIES QUE NÃO SÃO DE TEMPORADAS) */}
          <div className="middle-sections">
          {/* ELENCO */}
          <div className="box">
            <div className="box-title text-section-title">
              Elenco
              <span className="text-metadata">Ver todos</span>
            </div>
            <div className="cast-grid">
              {castList.length > 0 ? (
                  castList.slice(0, 8).map((actor: ActorData | string, index: number) => {
                    const photoUrl = (typeof actor === 'object' && (actor.profile_path || actor.image))
                      ? IMG.poster(actor.profile_path || actor.image, 'w185')
                      : 'https://placehold.co/95x95/1a1a1f/F5C76B?text=Ator';
                    return (
                    <div key={index} className="cast-member">
                      <div 
                        className="cast-photo" 
                        style={{ backgroundImage: `url(${photoUrl})` }}
                      ></div>
                      <div className="cast-name text-card-title">
                        {typeof actor === 'string' ? actor : (actor as ActorData).name || 'Ator'}
                      </div>
                      <div className="cast-role text-metadata">
                        {typeof actor === 'object' ? (actor as ActorData).character || 'Personagem' : 'Personagem'}
                      </div>
                    </div>
                    );
                  })
              ) : (
                  <div className="text-gray-400 italic py-10 text-center w-full">
                    Informações de elenco não disponíveis para este título.
                  </div>
              )}
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
                shuffledRecommendations.map((rec: RecommendationData) => (
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
            <b>Direção:</b> {displayDirector}
            </div>
            <div className="details-item">
              <b>Gênero:</b> {displayGenres}
            </div>
            <div className="details-item">
            <b>Lançamento:</b> {displayReleaseDate}
            </div>
            <div className="details-item">
              <b>Duração:</b> {displayDuration}
            </div>
            <div className="details-item">
              <b>Classificação:</b> {displayRating}
            </div>
            <div className="details-item">
            <b>Produção:</b> {displayProduction}
            </div>
          </div>
        </div>
      </div>

      {/* PLAYER INTEGRADO (MODAL FULLSCREEN) */}
      {activeVideoUrl && (
        <VideoPlayer 
          src={activeVideoUrl} 
          title={(activeVideoUrl === movieData?.trailer ? "Trailer: " : "") + displayTitle}
          contentId={id}
          userId={user?.id}
          startOffset={roomFromUrl ? 0 : lastPosition} // Convidados começam do início ou tempo do host
          onClose={() => setActiveVideoUrl(null)} 
          onNext={handleNextEpisode}
          partyRoomId={roomFromUrl || (activeVideoUrl && activeVideoUrl !== movieData?.trailer ? user?.id : null)}
          isGuest={!!roomFromUrl}
          shouldStartParty={shouldStartParty}
        />
      )}

      {/* SCRIPT MOBILE */}
      <script src="/series-mobile.js" defer></script>
    </div>
  );
}
