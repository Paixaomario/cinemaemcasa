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
  const card = (
    <div
      className="group relative overflow-hidden rounded-[1rem] bg-slate-950 shadow-[0_20px_60px_rgba(0,0,0,0.45)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl"
      onClick={href ? undefined : onClick}
    >
      {poster ? (
        <img
          src={poster}
          alt={titulo}
          className="h-[260px] w-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-[260px] w-full items-center justify-center bg-slate-900 text-slate-500">
          Sem capa
        </div>
      )}

      <div className="space-y-2 p-3">
        <p className="text-sm font-semibold text-white line-clamp-2">{titulo || 'Sem título'}</p>
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
      <Link href={href} className="block">
        {card}
      </Link>
    )
  }

  return card
}
