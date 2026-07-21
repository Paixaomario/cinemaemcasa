'use client'

import Link from 'next/link'

interface ContentCardProps {
  id?: string | number
  titulo?: string
  poster?: string
  rating?: number
  year?: number
  href?: string
  lastPosition?: number
  duration?: number
  onClick?: () => void
}

export function ContentCard({ id, titulo, poster, rating, year, href, lastPosition, duration, onClick }: ContentCardProps) {
  const handleKey = (e: React.KeyboardEvent) => {
    if (!href && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick?.()
    }
  }

  const card = (
    <div
      data-spatial-nav="true"
      data-spatial-group="content"
      className="group relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-zinc-900 shadow-lg transition-transform duration-300 focus:outline-none"
      onClick={onClick}
      tabIndex={0}
      role="button"
      onKeyDown={handleKey}
    >
      {poster ? (
        <img
          src={poster}
          alt={titulo}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-zinc-500">
          Sem capa
        </div>
      )}

      {/* Gradiente e informações sobrepostos */}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
        <div className="mt-1 flex items-center justify-between text-xs text-zinc-300">
          <span>{year ?? 'N/A'}</span>
          {rating && <span className="font-medium text-yellow-400">⭐ {rating.toFixed(1)}</span>}
        </div>
        {lastPosition && duration && duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-700/50">
            <div
              className="h-full bg-red-600"
              style={{
                width: `${(lastPosition / duration) * 100}%`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link 
        href={href} 
        className="block h-full w-full focus:outline-none" 
        tabIndex={0} 
        data-spatial-nav="true" 
        data-spatial-group="content"
      >
        {card}
      </Link>
    )
  }

  return card
}
