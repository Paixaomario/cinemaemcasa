'use client'

import Link from 'next/link'

interface ContentCardProps {
  id?: string | number
  titulo?: string
  poster?: string
  rating?: number
  year?: number
  href?: string
  onClick?: () => void
}

export function ContentCard({ id, titulo, poster, rating, year, href, onClick }: ContentCardProps) {
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
      className="group relative overflow-hidden rounded-[1rem] bg-slate-950 shadow-[0_20px_60px_rgba(0,0,0,0.45)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus-visible:ring-4"
      onClick={href ? undefined : onClick}
      tabIndex={href ? undefined : 0}
      role={href ? undefined : 'button'}
      onKeyDown={handleKey}
    >
      {poster ? (
        <img
          src={poster}
          alt={titulo}
          className="h-[160px] sm:h-[200px] md:h-[240px] lg:h-[260px] w-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-[160px] sm:h-[200px] md:h-[240px] lg:h-[260px] w-full items-center justify-center bg-slate-900 text-slate-500">
          Sem capa
        </div>
      )}

      <div className="space-y-2 p-3">
        <p className="text-sm font-semibold text-white line-clamp-2 break-words whitespace-normal">{titulo || 'Sem título'}</p>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>⭐ {rating ?? 'N/A'}</span>
          <span>{year ?? 'N/A'}</span>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block" tabIndex={0} data-spatial-nav="true" data-spatial-group="content">
        {card}
      </Link>
    )
  }

  return card
}
