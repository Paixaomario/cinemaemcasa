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

const CUSTOM_STYLES = `
  /* =========================================================
     PAIXAOFLIX - PÁGINA DETALHES DE SÉRIES (MODELO 1 - Cinematic Hero)
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
    background: linear-gradient(180deg, #0B0B0E, #000000) !important;
  }

  .series-bg-glow {
    position: fixed;
    inset: 0;
    z-index: -2;
    background:
      radial-gradient(circle at 20% 25%, rgba(255, 42, 42, 0.16), rgba(0,0,0,0) 60%),
      radial-gradient(circle at 80% 65%, rgba(255, 211, 122, 0.12), rgba(0,0,0,0) 65%),
      linear-gradient(180deg, #0B0B0E, #000000);
    filter: blur(20px);
    opacity: 0.95;
    pointer-events: none;
  }

  .hero {
    width: 100%;
    min-height: 520px;
    display: flex;
    background: #000000;
    position: relative;
    overflow: hidden;
    margin-bottom: 22px;
    border-bottom: 1px solid rgba(255, 211, 122, 0.10);
    box-shadow: 0 20px 50px rgba(0,0,0,0.9);
  }

  .hero-bg {
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    filter: brightness(0.55) contrast(1.12);
    transform: scale(1.08);
  }

  .hero-overlay {
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.82) 55%, rgba(0,0,0,0.20) 100%),
      radial-gradient(circle at 75% 40%, rgba(255, 211, 122, 0.14), rgba(0,0,0,0) 65%),
      radial-gradient(circle at 20% 30%, rgba(255, 42, 42, 0.12), rgba(0,0,0,0) 60%);
  }

  .hero-content {
    position: relative;
    z-index: 10;
    width: min(1400px, 95vw);
    margin: 0 auto;
    padding: 60px 0 40px 0;
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 28px;
    align-items: center;
  }

  .series-poster {
    width: 320px;
    height: 460px;
    border-radius: 22px;
    border: 2px solid rgba(255, 42, 42, 0.18);
    background: rgba(0,0,0,0.50);
    box-shadow: 0px 18px 60px rgba(0,0,0,0.85);
    overflow: hidden;
    position: relative;
  }

  .series-poster img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: brightness(0.92) contrast(1.1);
  }

  .series-poster::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.95) 100%);
  }

  .series-info h1 {
    font-family: 'Poppins', sans-serif;
    font-weight: 900;
    font-size: 46px;
    letter-spacing: 1px;
    line-height: 1.05;
    color: #F5F5F5;
    text-shadow: 0px 0px 20px rgba(0,0,0,0.75);
  }

  .series-meta {
    margin-top: 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }

  .series-meta span {
    font-size: 12px;
    font-weight: 800;
    color: rgba(245,245,245,0.70);
  }

  .rating-badge {
    padding: 7px 12px;
    border-radius: 14px;
    font-weight: 900;
    font-size: 12px;
    border: 1px solid rgba(255, 211, 122, 0.22);
    background: rgba(0,0,0,0.45);
    color: rgba(255, 211, 122, 0.88);
  }

  .badges-row {
    margin-top: 14px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .badge {
    padding: 6px 11px;
    border-radius: 14px;
    font-size: 11px;
    font-weight: 900;
    border: 1px solid rgba(255, 211, 122, 0.22);
    background: rgba(0,0,0,0.48);
    color: rgba(255, 211, 122, 0.88);
  }

  .badge.red {
    border-color: rgba(255, 42, 42, 0.28);
    color: rgba(255, 120, 120, 0.92);
  }

  .series-desc {
    margin-top: 16px;
    max-width: 740px;
    font-size: 14px;
    line-height: 1.6;
    color: rgba(245,245,245,0.75);
  }

  .series-actions {
    margin-top: 18px;
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .btn-primary {
    height: 44px;
    padding: 0 16px;
    border-radius: 16px;
    border: 1px solid rgba(255, 42, 42, 0.35);
    background: linear-gradient(180deg, rgba(180,0,0,0.95), rgba(90,0,0,0.95));
    color: #FFD37A;
    font-family: 'Poppins', sans-serif;
    font-weight: 900;
    font-size: 13px;
    cursor: pointer;
    transition: 160ms;
    box-shadow: 0px 0px 18px rgba(255, 42, 42, 0.18);
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0px 0px 22px rgba(255, 42, 42, 0.25);
  }

  .btn-secondary {
    height: 44px;
    padding: 0 16px;
    border-radius: 16px;
    border: 1px solid rgba(255, 211, 122, 0.22);
    background: rgba(0,0,0,0.45);
    color: rgba(255, 211, 122, 0.85);
    font-family: 'Poppins', sans-serif;
    font-weight: 900;
    font-size: 13px;
    cursor: pointer;
    transition: 160ms;
  }

  .btn-secondary:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 211, 122, 0.45);
    color: #FFD37A;
  }

  .btn-icon {
    width: 44px;
    height: 44px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 211, 122, 0.18);
    background: rgba(0,0,0,0.35);
    cursor: pointer;
    transition: 160ms;
    font-size: 16px;
    color: rgba(255, 211, 122, 0.75);
  }

  .btn-icon:hover {
    transform: translateY(-2px);
    color: #FFD37A;
    border-color: rgba(255, 211, 122, 0.40);
  }

  .btn-icon.active {
    border-color: rgba(255, 42, 42, 0.25);
    color: rgba(255, 120, 120, 0.95);
    box-shadow: 0px 0px 16px rgba(255, 42, 42, 0.14);
  }

  .series-page {
    width: min(1400px, 95vw);
    margin: 0 auto;
    padding: 22px 0;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .panel {
    border-radius: 22px;
    border: 1px solid rgba(255, 211, 122, 0.12);
    background: rgba(0,0,0,0.25);
    box-shadow: 0px 14px 40px rgba(0,0,0,0.80);
    padding: 18px;
  }

  .panel-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }

  .panel-title h2 {
    font-family: 'Poppins', sans-serif;
    font-weight: 900;
    font-size: 16px;
    color: rgba(255, 211, 122, 0.90);
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  .season-select {
    height: 44px;
    padding: 0 14px;
    border-radius: 14px;
    border: 1px solid rgba(255, 211, 122, 0.14);
    background: rgba(0,0,0,0.35);
    color: rgba(255, 211, 122, 0.85);
    font-weight: 900;
    outline: none;
    cursor: pointer;
  }

  .episodes-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
  }

  .episode-card {
    border-radius: 20px;
    overflow: hidden;
    border: 1px solid rgba(255, 42, 42, 0.16);
    background: rgba(0,0,0,0.45);
    cursor: pointer;
    transition: 240ms;
    box-shadow: 0px 14px 35px rgba(0,0,0,0.75);
    position: relative;
  }

  .episode-card:hover {
    transform: translateY(-6px) scale(1.02);
    border-color: rgba(255, 211, 122, 0.22);
    box-shadow: 0px 18px 45px rgba(0,0,0,0.88), 0px 0px 18px rgba(255, 42, 42, 0.14);
  }

  .episode-thumb {
    height: 140px;
    background-size: cover;
    background-position: center;
    position: relative;
    filter: brightness(0.92) contrast(1.1);
  }

  .episode-thumb::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0.05) 55%, rgba(0,0,0,0.95) 100%);
  }

  .episode-play {
    position: absolute;
    bottom: 12px;
    right: 12px;
    z-index: 5;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 42, 42, 0.35);
    background: rgba(180,0,0,0.30);
    color: rgba(255, 120, 120, 0.95);
    font-size: 14px;
    box-shadow: 0px 0px 16px rgba(255, 42, 42, 0.14);
  }

  .episode-info {
    padding: 12px;
  }

  .episode-info h3 {
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    font-weight: 900;
    margin-bottom: 4px;
  }

  .episode-info p {
    font-size: 12px;
    font-weight: 700;
    color: rgba(245,245,245,0.65);
  }

  .progress-bar {
    margin-top: 10px;
    height: 6px;
    border-radius: 12px;
    background: rgba(255, 211, 122, 0.10);
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    width: 45%;
    border-radius: 12px;
    background: linear-gradient(90deg, rgba(180,0,0,0.95), rgba(255, 42, 42, 0.75));
    box-shadow: 0px 0px 12px rgba(255, 42, 42, 0.18);
  }

  .cast-row {
    display: flex;
    gap: 14px;
    overflow-x: auto;
    padding-bottom: 6px;
  }

  .cast-row::-webkit-scrollbar {
    height: 6px;
  }

  .cast-row::-webkit-scrollbar-thumb {
    background: rgba(255, 211, 122, 0.22);
    border-radius: 20px;
  }

  .cast-card {
    min-width: 110px;
    text-align: center;
    cursor: pointer;
    transition: 160ms;
  }

  .cast-card:hover {
    transform: translateY(-4px);
  }

  .cast-avatar {
    width: 92px;
    height: 92px;
    border-radius: 50%;
    margin: 0 auto;
    border: 2px solid rgba(255, 211, 122, 0.18);
    background: rgba(0,0,0,0.45);
    box-shadow: 0px 14px 30px rgba(0,0,0,0.70);
    overflow: hidden;
  }

  .cast-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: brightness(0.92);
  }

  .cast-card strong {
    display: block;
    margin-top: 10px;
    font-weight: 900;
    font-size: 12px;
  }

  .cast-card span {
    display: block;
    margin-top: 4px;
    font-size: 11px;
    color: rgba(245,245,245,0.65);
    font-weight: 700;
  }

  .recommend-row {
    display: flex;
    gap: 14px;
    overflow-x: auto;
    padding-bottom: 8px;
  }

  .recommend-row::-webkit-scrollbar {
    height: 6px;
  }

  .recommend-row::-webkit-scrollbar-thumb {
    background: rgba(255, 211, 122, 0.22);
    border-radius: 20px;
  }

  .recommend-card {
    min-width: 160px;
    height: 240px;
    border-radius: 20px;
    overflow: hidden;
    border: 1px solid rgba(255, 42, 42, 0.16);
    background: rgba(0,0,0,0.50);
    cursor: pointer;
    transition: 240ms;
    box-shadow: 0px 14px 35px rgba(0,0,0,0.75);
  }

  .recommend-card:hover {
    transform: translateY(-6px) scale(1.03);
    border-color: rgba(255, 211, 122, 0.22);
    box-shadow: 0px 18px 45px rgba(0,0,0,0.88), 0px 0px 18px rgba(255, 42, 42, 0.14);
  }

  .recommend-poster {
    height: 100%;
    background-size: cover;
    background-position: center;
    filter: brightness(0.9) contrast(1.1);
    position: relative;
  }

  .recommend-poster::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0.05) 60%, rgba(0,0,0,0.95) 100%);
  }

  .toast {
    position: fixed;
    bottom: 120px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    padding: 12px 18px;
    border-radius: 18px;
    border: 1px solid rgba(255, 211, 122, 0.14);
    background: rgba(0,0,0,0.70);
    backdrop-filter: blur(14px);
    font-weight: 900;
    font-size: 13px;
    color: rgba(255, 211, 122, 0.88);
    opacity: 0;
    pointer-events: none;
    transition: 220ms ease;
    box-shadow: 0px 18px 40px rgba(0,0,0,0.85);
    z-index: 9999;
  }

  .toast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0px);
  }

  @media (max-width: 1150px) {
    .hero-content {
      grid-template-columns: 1fr;
      padding: 40px 0 30px 0;
    }
    .series-poster {
      width: 280px;
      height: 400px;
    }
    .series-info h1 {
      font-size: 38px;
    }
    .episodes-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 820px) {
    .episodes-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .series-info h1 {
      font-size: 32px;
    }
    .series-desc {
      font-size: 13px;
    }
  }

  @media (max-width: 520px) {
    .series-poster {
      width: 240px;
      height: 360px;
    }
    .episodes-grid {
      grid-template-columns: 1fr;
    }
    .series-actions {
      flex-direction: column;
      align-items: stretch;
    }
    .btn-primary,
    .btn-secondary {
      width: 100%;
    }
  }
`;

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
          const shuffled = [...localMatches].sort(() => Math.random() - 0.5).slice(0, 8)
          setShuffledRecommendations(shuffled)
        } else {
          const { data: randomFallback } = await sb.from('series').select('id_n, titulo, poster, rating, tmdb_id').limit(8)
          setShuffledRecommendations(randomFallback || [])
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
    <div className="min-h-screen bg-black">
      <Navbar />
      <style dangerouslySetInnerHTML={{ __html: CUSTOM_STYLES }} />

      <div className="page-container">
        <div className="series-bg-glow"></div>

        {/* HERO SECTION */}
        <div className="hero">
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
            <section className="panel">
              <div className="panel-title">
                <h2>Elenco Principal</h2>
              </div>

              <div className="cast-row">
                {castList.length > 0 ? (
                  castList.slice(0, 8).map((actor: ActorData | string, index: number) => {
                    const photoUrl = typeof actor === 'object' && (actor.profile_path || actor.image)
                      ? `https://image.tmdb.org/t/p/w185${actor.profile_path || actor.image}`
                      : 'https://placehold.co/92x92/1a1a1f/F5C76B?text=Ator';
                    return (
                      <div key={index} className="cast-card">
                        <div className="cast-avatar">
                          <Image src={photoUrl} alt={typeof actor === 'string' ? actor : (actor as ActorData).name || 'Ator'} fill unoptimized />
                        </div>
                        <strong>{typeof actor === 'string' ? actor : (actor as ActorData).name || 'Ator'}</strong>
                        <span>{typeof actor === 'object' ? (actor as ActorData).character || 'Personagem' : 'Personagem'}</span>
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
            <section className="panel">
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
                      <div className="recommend-poster" style={{ backgroundImage: 'url(https://via.placeholder.com/160x240)' }}></div>
                    </div>
                    <div className="recommend-card">
                      <div className="recommend-poster" style={{ backgroundImage: 'url(https://via.placeholder.com/160x240)' }}></div>
                    </div>
                    <div className="recommend-card">
                      <div className="recommend-poster" style={{ backgroundImage: 'url(https://via.placeholder.com/160x240)' }}></div>
                    </div>
                    <div className="recommend-card">
                      <div className="recommend-poster" style={{ backgroundImage: 'url(https://via.placeholder.com/160x240)' }}></div>
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
      )}
    </div>
  );
}
