'use client'
import Image from 'next/image'
import Link from 'next/link'

export function ContentCard({ item }: { item: any }) {
  // Mapeamento para lidar com as diferentes tabelas (cinema vs series)
  const title = item.titulo || item.title || 'Sem título'
  const poster = item.poster || item.capa || item.poster_path
  const rating = item.rating || item.vote_average
  const year = item.ano || item.year || (item.release_date ? item.release_date.slice(0, 4) : '')

  // Detecta se é uma série (tabela 'series' usa id_n conforme sua migration)
  const isSeries = !!item.id_n
  const id = isSeries ? item.id_n : item.id
  const detailHref = isSeries ? `/series/${id}` : `/detalhes/${id}`

  return (
    <Link 
      href={detailHref}
      className="group relative block aspect-[2/3] w-full transition-all duration-300 hover:scale-110 focus:scale-110 z-0 hover:z-50 focus:z-50 focus:outline-none focus:ring-4 focus:ring-brand-cyan rounded-xl shadow-2xl shadow-black/90"
    >
      <div className="absolute inset-0 overflow-hidden rounded-xl bg-neutral-900">
        {poster ? (
          <Image
            src={poster.startsWith('http') ? poster : `https://image.tmdb.org/t/p/w500${poster}`}
            alt={title}
            fill
            sizes="(max-width: 768px) 50vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl bg-neutral-800">🎬</div>
        )}
      </div>

      {/* Overlay com informações (visível no hover ou foco) */}
      <div className="absolute inset-0 overflow-hidden rounded-xl flex flex-col justify-end bg-gradient-to-t from-black via-black/20 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus:opacity-100">
        <p className="text-sm font-black uppercase leading-tight text-white line-clamp-2">
          {title}
        </p>
        <div className="mt-2 flex items-center gap-2">
          {rating > 0 && <span className="text-[10px] font-bold text-gold-primary">⭐ {Number(rating).toFixed(1)}</span>}
          {year && <span className="text-[10px] font-bold text-neutral-400">{year}</span>}
        </div>
      </div>
    </Link>
  )
}
