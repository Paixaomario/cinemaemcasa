import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  getMovieById,
  getSeriesById,
  getSeriesSeasons,
  getSeriesEpisodes,
} from '@/lib/queries'
import { SeasonSelector } from '@/components/SeasonSelector'
import {
  getMovieDetails,
  getShowDetails,
  tmdbImageUrl,
  extractTmdbTrailer,
} from '@/lib/tmdb'

type DetailModel = {
  id: string
  title: string
  overview: string
  posterUrl?: string | null
  backdropUrl?: string | null
  tagline?: string
  year?: string
  duration?: string
  rating?: number
  genres: string[]
  status?: string
  director?: string
  cast: string[]
  trailerUrl?: string | null
  isSeries: boolean
  watchPath: string
  seasons?: any[]
  episodesBySeason?: Record<string, any[]>
}

function parseLegacyId(rawId: string) {
  const match = rawId.match(/^(serie|movie)-(\d+)$/i)
  if (!match) return null
  return {
    type: match[1].toLowerCase() === 'serie' ? 'serie' : 'movie',
    tmdbId: match[2],
  } as const
}

async function loadDetail(id: string): Promise<DetailModel | null> {
  const parsedNumber = Number(id)
  const isNumeric = !Number.isNaN(parsedNumber)
  const movie = isNumeric ? await getMovieById(parsedNumber) : null
  const series = isNumeric ? await getSeriesById(parsedNumber) : null

  const isSeries = Boolean(series)
  const content = series || movie

  if (!content) {
    const legacy = parseLegacyId(id)
    if (!legacy) return null

    const tmdbData = legacy.type === 'serie'
      ? await getShowDetails(legacy.tmdbId)
      : await getMovieDetails(legacy.tmdbId)

    const posterUrl = tmdbImageUrl(tmdbData.poster_path, 'w500')
    const backdropUrl = tmdbImageUrl(tmdbData.backdrop_path, 'original')
    const genres = Array.from(new Set((tmdbData.genres || []).map((genre: any) => String(genre.name)))) as string[]
    const trailerUrl = extractTmdbTrailer(tmdbData.videos?.results)

    return {
      id,
      title: tmdbData.title || tmdbData.name || 'Sem título',
      overview: tmdbData.overview || 'Descrição indisponível.',
      posterUrl,
      backdropUrl,
      tagline: tmdbData.tagline || undefined,
      year: tmdbData.release_date?.slice(0, 4) || tmdbData.first_air_date?.slice(0, 4),
      duration: legacy.type === 'serie'
        ? tmdbData.episode_run_time?.[0] ? `${tmdbData.episode_run_time[0]} min` : undefined
        : tmdbData.runtime ? `${tmdbData.runtime} min` : undefined,
      rating: tmdbData.vote_average,
      genres,
      status: tmdbData.status,
      director: tmdbData.credits?.crew?.find((member: any) => member.job === 'Director')?.name,
      cast: (tmdbData.credits?.cast || []).slice(0, 8).map((member: any) => member.name),
      trailerUrl,
      isSeries: legacy.type === 'serie',
      watchPath: '/',
      seasons: [],
      episodesBySeason: {},
    }
  }

  const localGenres = [
    content.genero,
    content.category,
    content.genre,
    content.tmdb_genres?.join(', '),
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(',').map((item) => item.trim()))
    .filter(Boolean)

  const tmdbId = content.tmdb_id ? String(content.tmdb_id) : null
  let tmdbData: any = null

  if (tmdbId) {
    try {
      tmdbData = isSeries
        ? await getShowDetails(tmdbId)
        : await getMovieDetails(tmdbId)
    } catch (error) {
      console.warn('Falha ao carregar dados TMDB:', error)
    }
  }

  const posterUrl =
    content.poster || content.capa || tmdbImageUrl(tmdbData?.poster_path, 'w500') || null
  const backdropUrl =
    content.banner || content.backdrop || tmdbImageUrl(tmdbData?.backdrop_path, 'original') || null
  const title = content.titulo || tmdbData?.title || tmdbData?.name || 'Sem título'
  const overview =
    content.description || content.descricao || tmdbData?.overview || 'Descrição indisponível.'
  const tagline = tmdbData?.tagline || undefined
  const year =
    String(content.ano || content.year || tmdbData?.first_air_date?.slice(0, 4) || tmdbData?.release_date?.slice(0, 4) || '')
      .replace(/^undefined$/, '') || undefined
  const duration =
    content.duration || content.tmdb_runtime || (content.duration_seconds ? `${content.duration_seconds} min` : undefined) ||
    (isSeries ? tmdbData?.episode_run_time?.[0] ? `${tmdbData.episode_run_time[0]} min` : undefined : tmdbData?.runtime ? `${tmdbData.runtime} min` : undefined)
  const rating = content.rating ?? tmdbData?.vote_average
  const genres = Array.from(new Set([...localGenres, ...(tmdbData?.genres || []).map((genre: any) => String(genre.name))])) as string[]
  const status = content.classificacao || tmdbData?.status || undefined
  const director =
    tmdbData?.credits?.crew?.find((member: any) => member.job === 'Director')?.name ||
    (tmdbData?.created_by?.map((creator: any) => creator.name).join(', ') || undefined)
  const cast = (tmdbData?.credits?.cast || []).slice(0, 8).map((member: any) => member.name)
  const trailerUrl =
    content.trailer || extractTmdbTrailer(tmdbData?.videos?.results || []) || null
  const seasons = isSeries ? await getSeriesSeasons(parsedNumber) : []
  const episodesBySeason: Record<string, any[]> = {}

  if (isSeries && seasons.length > 0) {
    await Promise.all(
      seasons.map(async (season: any) => {
        episodesBySeason[String(season.id_n)] = await getSeriesEpisodes(season.id_n)
      })
    )
  }

  return {
    id,
    title,
    overview,
    posterUrl,
    backdropUrl,
    tagline,
    year,
    duration,
    rating,
    genres,
    status,
    director,
    cast,
    trailerUrl,
    isSeries,
    // Use a unified assistir path to avoid 404s for series
    watchPath: `/assistir/${id}`,
    seasons,
    episodesBySeason,
  }
}

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const detail = await loadDetail(params.id)

  if (!detail) {
    return {
      title: 'Conteúdo não encontrado | PaixãoFlix',
      description: 'Detalhes do título não puderam ser carregados.',
    }
  }

  return {
    title: `${detail.title} | PaixãoFlix`,
    description: detail.overview,
    openGraph: {
      title: detail.title,
      description: detail.overview,
      type: 'video.other',
      images: detail.backdropUrl ? [detail.backdropUrl] : detail.posterUrl ? [detail.posterUrl] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: detail.title,
      description: detail.overview,
      images: detail.backdropUrl ? [detail.backdropUrl] : detail.posterUrl ? [detail.posterUrl] : [],
    },
  }
}

export default async function DetalhesPage({ params }: any) {
  const detail = await loadDetail(params.id)

  if (!detail) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="relative overflow-hidden">
        {detail.backdropUrl ? (
          <div className="absolute inset-0">
            <Image
              src={detail.backdropUrl}
              alt={detail.title}
              fill
              className="object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-black/70" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-black" />
        )}

        <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-24">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            ← Voltar ao catálogo
          </Link>

          <div className="grid gap-10 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-12 lg:items-start">
            <div className="relative mx-auto w-full max-w-[360px] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/60 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
              {detail.posterUrl ? (
                <Image
                  src={detail.posterUrl}
                  alt={detail.title}
                  width={320}
                  height={480}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex min-h-[540px] items-center justify-center bg-slate-900 text-slate-300">
                  Sem imagem disponível
                </div>
              )}
            </div>

            <section className="space-y-8 lg:pr-4">
              <div className="space-y-5">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-300/90">
                  {detail.isSeries ? 'Série' : 'Filme'} • {detail.status || 'Disponível'}
                </p>
                <h1 className="text-6xl font-bold tracking-tight text-white drop-shadow-lg sm:text-7xl lg:text-8xl lg:leading-[0.9]">
                  {detail.title}
                </h1>
                {detail.tagline ? (
                  <p className="max-w-3xl text-2xl italic text-slate-300">{detail.tagline}</p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-slate-300/80 sm:text-base">
                {detail.year ? <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">{detail.year}</span> : null}
                {detail.duration ? <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">{detail.duration}</span> : null}
                {detail.rating ? <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">★ {detail.rating.toFixed(1)}</span> : null}
                {detail.status ? <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">{detail.status}</span> : null}
                {detail.genres.length > 0 ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                    {detail.genres.join(' • ')}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-4">
                <Link
                  href={detail.watchPath}
                  className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-base font-semibold text-slate-950 transition hover:bg-slate-200"
                >
                  Assistir Agora
                </Link>
                {detail.trailerUrl ? (
                  <Link
                    href={`/assistir/${detail.id}?trailer=${encodeURIComponent(detail.trailerUrl)}`}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white transition hover:bg-white/10"
                  >
                    Ver Trailer
                  </Link>
                ) : null}
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl">
                <h2 className="mb-4 text-2xl font-semibold text-white">Sinopse</h2>
                <p className="text-lg leading-8 text-slate-300">{detail.overview}</p>
              </div>

              {detail.director || detail.cast.length > 0 || detail.tagline ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  {detail.tagline ? (
                    <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-7 sm:col-span-2">
                      <h3 className="mb-2 text-sm uppercase tracking-[0.3em] text-slate-400">Tagline</h3>
                      <p className="text-lg italic text-slate-200">{detail.tagline}</p>
                    </div>
                  ) : null}
                  {detail.director ? (
                    <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-7">
                      <h3 className="mb-2 text-sm uppercase tracking-[0.3em] text-slate-400">Direção</h3>
                      <p className="text-lg text-slate-200">{detail.director}</p>
                    </div>
                  ) : null}

                  {detail.cast.length > 0 ? (
                    <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-7">
                      <h3 className="mb-2 text-sm uppercase tracking-[0.3em] text-slate-400">Elenco Principal</h3>
                      <p className="text-lg text-slate-200">{detail.cast.join(', ')}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {detail.isSeries && detail.seasons && detail.seasons.length > 0 ? (
                <SeasonSelector
                  seasons={detail.seasons}
                  episodesBySeason={detail.episodesBySeason || {}}
                />
              ) : null}
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
