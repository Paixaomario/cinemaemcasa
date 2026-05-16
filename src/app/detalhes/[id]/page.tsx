'use client'
export const dynamic = 'force-dynamic'

import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState, Suspense, useCallback } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { IMG, getMovieDetails, getShowDetails, formatRuntime, getMovieCertification, getShowCertification, getTitle } from '@/lib/tmdb'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { useAuth } from '@/components/layout/SupabaseProvider'
import NextDynamic from 'next/dynamic'
import { TMDBMovie, TMDBShow } from '@/lib/tmdb'

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
    margin-top: clamp(60px, 8vh, 120px); /* Ajuste para não colidir com a Navbar */
    border-radius: 0;
    overflow-x: hidden !important;
    background: var(--bg-absolute) !important;
  }

  .hero {
    width: 100%;
    min-height: 550px;
    display: flex;
    background: var(--bg-absolute);
    position: relative;
    overflow: hidden;
    margin-bottom: 60px; /* Mais espaço abaixo do hero */
    box-shadow: 0 20px 50px rgba(0,0,0,0.9);
  }

  .hero-bg {
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    filter: brightness(0.6) contrast(1.1); /* Escurece o fundo para o texto se destacar */
  }

  .hero-overlay {
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to right,
      rgba(0, 0, 0, 0.95) 0%, /* Mais escuro à esquerda */
      rgba(0, 0, 0, 0.7) 35%, /* Transição suave */
      rgba(0, 0, 0, 0.2) 100% /* Mais claro à direita */
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

  .text-hero-title { font-family: 'Poppins', sans-serif; font-size: clamp(36px, 7vw, 92px) !important; font-weight: 800; color: #fff; text-shadow: 0 0 40px rgba(0,0,0,1); }
  
  .text-hero-desc, .movie-description {
    font-family: 'Inter', sans-serif !important;
    font-size: clamp(15px, 1.3vw, 19px) !important;
    display: -webkit-box !important;
    -webkit-line-clamp: 4 !important; /* Aumentado para 4 linhas para evitar corte excessivo */
    -webkit-box-orient: vertical !important;
    overflow: hidden !important;
    max-width: 700px !important;
    line-height: 1.6 !important;
    color: var(--text-gray) !important;
  }

  .movie-meta {
    display: flex;
    gap: 22px;
    color: var(--text-gray);
    align-items: center;
    font-weight: 600;
  }

  .meta-age {
    padding: 3px 10px;
    border-radius: 6px;
    font-weight: 900;
    background: var(--red-dark);
    border: 1.5px solid var(--red-main);
    color: #fff;
    box-shadow: var(--shadow-glow-red);
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
    font-family: 'Poppins', sans-serif;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    background: linear-gradient(180deg, var(--red-main) 0%, var(--red-dark) 100%);
    color: var(--gold-premium);
    border-top: 1.5px solid rgba(255,255,255,0.3);
    box-shadow: 0 15px 30px rgba(180, 0, 0, 0.4);
    display: inline-flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .btn-primary:hover { 
    transform: scale(1.04); 
    background: linear-gradient(180deg, var(--red-glow) 0%, var(--red-main) 100%);
    box-shadow: 0 18px 35px rgba(180, 0, 0, 0.6);
  }
  .btn-primary:active { transform: scale(0.98); }

  .btn-secondary {
    height: 62px;
    padding: 0 28px;
    border-radius: 10px;
    font-family: 'Poppins', sans-serif;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    background: var(--bg-absolute);
    color: var(--gold-premium);
    border: 2px solid var(--gold-premium);
    box-shadow: inset 0 0 10px rgba(215, 168, 75, 0.1);
    display: inline-flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .btn-secondary:hover { 
    transform: scale(1.04); 
    background: var(--bg-charcoal);
    border-color: var(--gold-light);
    color: var(--gold-light);
  }
  .btn-secondary:active { transform: scale(0.98); }

  .btn-tertiary {
    height: 62px;
    padding: 0 28px;
    border-radius: 10px;
    font-family: 'Poppins', sans-serif;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    background: var(--bg-reddish);
    color: var(--text-premium);
    border: 1.5px solid var(--border-subtle);
    box-shadow: inset 0 0 8px rgba(0,0,0,0.3);
    display: inline-flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .btn-tertiary:hover { 
    transform: scale(1.04); 
    border-color: var(--gold-premium);
    color: var(--gold-premium);
    box-shadow: inset 0 0 15px rgba(215, 168, 75, 0.2);
  }
  .btn-tertiary:active { transform: scale(0.98); }

  .action-icons { display: flex; gap: 34px; margin-top: 18px; }

  .action-item {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text-gray);
    font-size: 16px;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .action-item:hover { 
    color: var(--gold-light); 
    transform: scale(1.05); 
    text-shadow: 0 0 8px rgba(255, 211, 122, 0.4);
  }

  .action-item .icon {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: 1.5px solid var(--border-gold);
    background: var(--bg-charcoal);
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--gold-premium);
    font-size: 18px;
    box-shadow: inset 0 0 10px rgba(215, 168, 75, 0.1);
  }

  .action-item:hover .icon {
    border-color: var(--gold-light);
    box-shadow: inset 0 0 15px rgba(255, 211, 122, 0.2), 0 0 15px rgba(255, 211, 122, 0.2);
  }

  .middle-sections {
    display: grid;
    grid-template-columns: 1fr 1.3fr;
    gap: 18px;
    padding: 20px var(--container-px);
    margin-top: 40px;
    min-width: 0;
  }

  .box {
    background: var(--bg-reddish);
    border-radius: 24px;
    border: 1.5px solid var(--border-subtle);
    padding: 24px;
    min-width: 0;
    overflow: hidden;
    box-shadow: var(--shadow-premium);
  }

  .box-title {
    font-family: 'Poppins', sans-serif;
    font-weight: 800;
    letter-spacing: 1px;
    color: var(--gold-premium);
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-shadow: 0 0 8px rgba(215, 168, 75, 0.2);
  }

  .box-title span { color: var(--text-gray); cursor: pointer; transition: color 0.2s ease; }
  .box-title span:hover { color: var(--gold-light); }

  .cast-grid { 
    display: flex; 
    gap: 18px; 
    justify-content: flex-start; 
    overflow-x: auto; 
    padding-bottom: 15px;
    -webkit-overflow-scrolling: touch; /* Melhorar scroll em iOS */
  }
  .cast-member { width: 140px; text-align: center; }
  .cast-photo {
    width: 95px;
    height: 95px;
    border-radius: 50%;
    margin: 0 auto 10px auto;
    border: 2px solid var(--gold-premium);
    background-size: cover;
    background-position: center;
    box-shadow: 0 0 15px rgba(215, 168, 75, 0.2);
  }
  .cast-name { font-weight: 700; color: var(--text-premium); font-family: 'Poppins', sans-serif; }
  .cast-role { margin-top: 4px; color: var(--text-gray); font-size: 0.85em; }

  .recommend-grid { 
    display: flex; 
    gap: 14px; 
    overflow-x: auto; 
    padding-bottom: 15px;
    -webkit-overflow-scrolling: touch; /* Melhorar scroll em iOS */
  }
  .recommend-grid::-webkit-scrollbar { height: 6px; }
  .recommend-grid::-webkit-scrollbar-thumb { background: rgba(255, 180, 40, 0.35); border-radius: 10px; }

  .recommend-card {
    min-width: 180px; /* Aumentado para não cortar a imagem */
    aspect-ratio: 2 / 3; /* Proporção correta de poster */
    border-radius: 14px;
    border: 1.5px solid var(--border-subtle);
    overflow: hidden;
    cursor: pointer;
    position: relative;
    background: var(--bg-charcoal);
    box-shadow: 0 8px 20px rgba(0,0,0,0.6);
    transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  }

  .recommend-card:hover { 
    transform: scale(1.05) translateY(-3px); 
    border-color: var(--gold-premium);
    box-shadow: 0 12px 25px rgba(0,0,0,0.8), 0 0 10px rgba(215, 168, 75, 0.3);
  }
  .recommend-poster { width: 100%; height: 100%; background-size: cover; background-position: center top; filter: brightness(0.9); }
  .recommend-rating {
    position: absolute;
    bottom: 10px;
    left: 10px;
    padding: 6px 10px;
    border-radius: 10px;
    font-weight: 900;
    background: var(--bg-absolute);
    border: 1px solid var(--border-gold);
    color: var(--gold-light);
    box-shadow: 0 0 8px rgba(215, 168, 75, 0.2);
  }

  .details-footer { width: 100%; padding: 18px var(--container-px) 28px var(--container-px); position: relative; z-index: 15; }
  .details-box {
    width: 100%;
    border-radius: 24px;
    border: 1.5px solid var(--border-subtle);
    background: var(--bg-reddish);
    padding: 24px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 18px;
    box-shadow: var(--shadow-premium);
  }
  .details-item { line-height: 1.6; color: var(--text-gray); font-family: 'Inter', sans-serif; font-size: 0.95em; }
  .details-item b { color: var(--gold-premium); font-weight: 700; font-family: 'Poppins', sans-serif; }

  /* Responsividade Global */
  @media (max-width: 1024px) {
    .middle-sections { grid-template-columns: 1fr; gap: 20px; }
    .details-box { grid-template-columns: 1fr 1fr; }
  }

  @media (max-width: 768px) {
    .hero { height: auto; min-height: 66vh; padding-top: 40px; }
    .hero-bg { filter: brightness(1.2) contrast(1.05) !important; }
    .hero-content { padding: 20px 15px; width: 100%; }
    .text-hero-title { font-size: clamp(28px, 8vw, 42px) !important; white-space: normal; }
    .hero-buttons { flex-direction: column; width: 100%; gap: 10px; }
    .btn-primary, .btn-secondary { width: 100%; justify-content: center; height: 55px; font-size: 14px; }
    .action-icons { overflow-x: auto; padding-bottom: 10px; width: 100%; justify-content: flex-start; }
    .details-box { grid-template-columns: 1fr; }
    .text-hero-desc, .movie-description {
      font-size: clamp(14px, 1.5vw, 18px) !important;
      -webkit-line-clamp: 3 !important; /* 3 linhas no mobile para melhor leitura */
    }
    .cast-grid, .recommend-grid { gap: 12px; }
  }

  @media (max-width: 980px) {
    .cast-grid { flex-wrap: wrap; justify-content: center; gap: 15px; }
    .hero-buttons { flex-direction: column; gap: 12px; }
  }

  /* Estilos para a seção de Temporadas e Episódios */
  .season-selector {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 20px;
  }

  .episode-list {
    display: grid;
    gap: 15px;
  }

  .episode-item {
    display: flex;
    gap: 15px;
    padding: 12px;
    border-radius: 12px;
    background: var(--bg-charcoal);
    border: 1px solid var(--border-subtle);
    transition: all 0.2s ease;
    cursor: pointer;
  }

  .episode-item:hover {
    background: var(--bg-reddish);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.4);
  }

  .episode-item:focus-visible {
    outline: none;
    border-color: var(--gold-premium);
    box-shadow: 0 0 15px rgba(215, 168, 75, 0.3);
  }

  .episode-thumbnail {
    position: relative;
    width: 120px;
    height: 70px;
    flex-shrink: 0;
    border-radius: 8px;
    overflow: hidden;
  }

  .episode-info h3 {
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
    color: var(--text-premium);
    font-size: 1.1em;
    margin-bottom: 4px;
  }

  .episode-info p {
    font-family: 'Inter', sans-serif;
    color: var(--text-gray);
    font-size: 0.9em;
    line-height: 1.4;
  }

  .episode-info .duration {
    color: var(--text-gray-secondary);
    font-size: 0.8em;
    margin-top: 5px;
  }

  /* Responsividade para Episódios */
  @media (max-width: 768px) {
    .episode-item {
      flex-direction: column;
      align-items: flex-start;
    }
    .episode-thumbnail {
      width: 100%;
      height: 180px; /* Maior no mobile */
    }
  }
`;

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
        let foundData: MovieData | null = null
        let localItem: MovieData | null = null
        
        // 1. Identificar se o ID é formatado (filme-123) ou ID local (123)
        const [type, rawId] = id.split('-')
        const parsedId = rawId || id

        // 2. BUSCA OBRIGATÓRIA NO BANCO LOCAL (Fonte de verdade para URL e tipo)
        const { data: dbData } = await sb
          .from('cinema')
          .select('*')
          .or(`id.eq.${isNaN(Number(parsedId)) ? -1 : parsedId},tmdb_id.eq.${isNaN(Number(parsedId)) ? -1 : parsedId}`)
          .maybeSingle()

        if (dbData) {
          localItem = dbData
          const tmdbId = dbData.tmdb_id ? Number(dbData.tmdb_id) : null
          const isMovie = dbData.type === 'movie' || dbData.type === 'filme' || type === 'filme'

          if (isMovie) {
            // Lógica para Filmes
            if (tmdbId && !isNaN(tmdbId)) {
              try {
                const metadata = await getMovieDetails(tmdbId)
                const cert = await getMovieCertification(tmdbId)
                foundData = { ...metadata, ...localItem, certification: cert }
              } catch (e) {
                foundData = localItem
              }
            } else {
              foundData = localItem
            }
          } else { // É uma Série
            let seriesLocalData: any = null;
            let tmdbSeriesMetadata: any = null;
            let seasonsWithEpisodes: SeasonData[] = [];

            // 1. Buscar detalhes da série na nova tabela 'series'
            // Tenta localizar por TMDB ID ou pelo ID local (id_n) que vincula com a tabela cinema
            const { data: sData } = await sb
              .from('series')
              .select('*')
              .or(`tmdb_id.eq.${tmdbId && !isNaN(tmdbId) ? tmdbId : -1},id_n.eq.${dbData.id}`)
              .maybeSingle()

            if (sData) {
              seriesLocalData = sData
              const { data: tData } = await sb.from('temporadas').select('*').eq('serie_id', sData.id_n).order('numero_temporada', { ascending: true })
              if (tData) {
                seasonsWithEpisodes = await Promise.all(tData.map(async (season) => {
                  const { data: eData } = await sb.from('episodios').select('*').eq('temporada_id', season.id_n).order('numero_episodio', { ascending: true })
                  return { ...season, episodes: eData || [] }
                }))
              }
            }

            // 4. Buscar metadados da série no TMDB
            if (tmdbId && !isNaN(tmdbId)) {
              try {
                tmdbSeriesMetadata = await getShowDetails(tmdbId)
                tmdbSeriesMetadata.certification = await getShowCertification(tmdbId)
              } catch (e) {
                console.warn('Falha ao carregar metadados TMDB para série.', e)
              }
            }

            foundData = {
              ...tmdbSeriesMetadata, // Metadados TMDB (overview, cast, etc.)
              ...localItem,          // Dados da tabela cinema (url, type, etc.)
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
  }, [resolvedParams, user])

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
  }, [movieData, resolvedParams])

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
    );
  }

  if (!movieData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#000' }}>
        <div style={{ color: '#d9a23a', fontSize: '24px' }}>Filme não encontrado</div>
      </div>
    );
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
              {movieData?.titulo || movieData?.title || (movieData ? getTitle(movieData as unknown as (TMDBMovie | TMDBShow)) : '') || 'NOME DO FILME'}
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
        {movieData?.type !== 'series' && (
          <div className="middle-sections">
          {/* ELENCO */}
          <div className="box">
            <div className="box-title text-section-title">
              Elenco
              <span className="text-metadata">Ver todos</span>
            </div>
            <div className="cast-grid">
              {(() => {
                const castArray: ActorData[] | string[] = movieData?.credits?.cast || 
                  (typeof movieData?.cast_names === 'string' 
                    ? movieData.cast_names.split(',').map((n: string) => n.trim()) 
                    : movieData?.cast_names) || [];
                
                return castArray.length > 0 ? (
                  castArray.slice(0, 8).map((actor: string | ActorData, index: number) => (
                    <div key={index} className="cast-member">
                      <div 
                        className="cast-photo" 
                        style={{ 
                          backgroundImage: (typeof actor === 'object' && (actor.profile_path || actor.image))
                            ? `url(${IMG.poster(actor.profile_path || actor.image, 'w185')})` 
                            : 'url(https://placehold.co/95x95/1a1a1f/F5C76B?text=Ator)'
                        }}
                      ></div>
                      <div className="cast-name text-card-title">
                        {typeof actor === 'string' ? actor : (actor as ActorData).name || 'Ator'}
                      </div>
                      <div className="cast-role text-metadata">
                        {typeof actor === 'object' ? (actor as ActorData).character || 'Personagem' : 'Personagem'}
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
              <b>Direção:</b> {movieData?.director || (movieData?.credits?.crew?.find((c: CrewMemberData) => c.job === 'Director')?.name) || 'Não informado'}
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
              <b>Produção:</b> {movieData?.production_companies?.map((c: { name: string }) => c.name).join(', ') || movieData?.category || (movieData?.production_countries?.map((c: { name: string }) => c.name).join(', ')) || 'Não informado'}
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
  );
}
