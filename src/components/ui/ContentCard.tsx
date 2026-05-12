'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { TMDBMovie, TMDBShow, IMG, getTitle } from '@/lib/tmdb'

interface Props {
  item: TMDBMovie | TMDBShow
  variant?: 'poster' | 'wide'
}

export function ContentCard({ item, variant = 'poster' }: Props) {
  const [hovered, setHovered] = useState(false)
  const title    = getTitle(item)
  const isMovie  = (item as any).media_type === 'movie' || (item as TMDBMovie).title !== undefined
  const imgUrl   = variant === 'poster'
    ? IMG.poster(item.poster_path, 'w500')
    : IMG.backdrop(item.backdrop_path, 'w780')
  const detailUrl = `/detalhes/${isMovie ? 'filme' : 'serie'}-${item.id}`

  return (
    <Link href={detailUrl} className={variant === 'poster' ? 'card-poster' : 'card-wide'} title={title}>
      <div 
        className="relative h-full w-full bg-gray-900"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onTouchStart={() => setHovered(true)}
        onTouchEnd={() => setHovered(false)}
        style={{
          transform: hovered ? 'scale(1.08)' : 'scale(1)',
          transition: 'transform 0.2s ease-out',
        }}
      >
        {imgUrl ? (
          <Image
            src={imgUrl}
            alt={title}
            fill
            sizes={variant === 'poster' ? '(max-width:640px) 60vw, (max-width:1024px) 300px, (max-width:1536px) 240px, 220px' : '(max-width:640px) 70vw, 320px'}
            className="object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2"
            style={{ background: '#1a1a1a' }}>
            <span style={{ fontSize: '32px' }}>{isMovie ? '🎬' : '📺'}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
