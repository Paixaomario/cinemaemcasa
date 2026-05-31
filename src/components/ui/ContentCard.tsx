'use client'
import Image from 'next/image'
import Link from 'next/link'

interface Props {
  item: any
  progress?: {
    lastPosition: number
    duration?: number
  }
  showProgress?: boolean
}

export function ContentCard({ item, progress, showProgress = false }: Props) {
  // Mapeamento para lidar com as diferentes tabelas (cinema vs series)
  const title = item.titulo || item.title || 'Sem título'
  const poster = item.poster || item.capa || item.backdrop
  const rating = item.rating || item.vote_average
  const year = item.ano || item.year || (item.release_date ? item.release_date.slice(0, 4) : '')

  // Detecta se é uma série (tabela 'series' usa id_n conforme sua migration)
  const isSeries = !!item.id_n
  const id = isSeries ? item.id_n : item.id
  const detailHref = isSeries ? `/series/${id}` : `/detalhes/${id}`

  // Cálculo de progresso - corrigido para não exceder 100%
  const progressPercent = showProgress && progress && progress.duration && progress.duration > 0
    ? Math.min(100, Math.round((progress.lastPosition / progress.duration) * 100))
    : 0

  const remainingTime = showProgress && progress && progress.duration && progress.duration > 0
    ? Math.max(0, progress.duration - progress.lastPosition)
    : 0

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="group relative">
      <Link
        href={detailHref}
        tabIndex={0}
        className={`block w-full z-0 focus:z-50 focus:outline-none focus:ring-4 focus:ring-brand-cyan rounded-xl shadow-2xl shadow-black/90 ${showProgress ? 'aspect-video' : 'aspect-[2/3]'} ${showProgress ? '' : 'transition-all duration-300 hover:scale-110 focus:scale-110'}`}
      >
        <div className="absolute inset-0 overflow-hidden rounded-xl bg-neutral-900">
          {poster ? (
            <Image
              src={poster.startsWith('http') ? poster : `https://image.tmdb.org/t/p/w500${poster}`}
              alt={title}
              fill
              sizes="(max-width: 320px) 100vw, (max-width: 480px) 45vw, (max-width: 768px) 30vw, (max-width: 1024px) 25vw, (max-width: 1440px) 20vw, (max-width: 1920px) 18vw, 16vw"
              className={`object-cover ${showProgress ? 'object-center' : 'transition-transform duration-500 group-hover:scale-110'}`}
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-responsive-lg bg-neutral-800">🎬</div>
          )}
        </div>

        {/* Overlay com informações (visível no hover ou foco, ou sempre se showProgress) */}
        <div className={`absolute inset-0 overflow-hidden rounded-xl flex flex-col justify-end bg-gradient-to-t from-black via-black/20 to-transparent p-responsive-sm ${showProgress ? 'opacity-100' : 'opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus:opacity-100'}`}>
          <p className="text-responsive-sm font-black uppercase leading-tight text-white line-clamp-2">
            {title}
          </p>
          <div className="mt-responsive-xs flex items-center gap-responsive-sm">
            {rating > 0 && <span className="text-responsive-xs font-bold text-gold-primary">⭐ {Number(rating).toFixed(1)}</span>}
            {year && <span className="text-responsive-xs font-bold text-neutral-400">{year}</span>}
          </div>
        </div>
      </Link>

      {/* Informações de progresso abaixo da capa - sempre visíveis quando showProgress */}
      {showProgress && progress && (
        <div className="mt-responsive-sm px-responsive-xs">
          <div className="h-responsive-xs bg-white/20 rounded-responsive overflow-hidden">
            <div
              className="h-full bg-[#00ADEF] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-responsive-xs">
            <span className="text-responsive-xs font-bold text-neutral-300">{formatTime(remainingTime)} restantes</span>
          </div>
        </div>
      )}
    </div>
  )
}
