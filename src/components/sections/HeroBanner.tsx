'use client'
import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { TMDBMovie, TMDBShow, IMG, countryFlag, getTitle, getYear, getOriginCountry, getGenreNames, buildBannerPool } from '@/lib/tmdb'

interface Props {
  type?: 'all' | 'movie' | 'tv'
  initialPool?: Array<TMDBMovie | TMDBShow>
}

export function HeroBanner({ type = 'all', initialPool }: Props) {
  const router = useRouter()
  const [pool, setPool]       = useState<Array<TMDBMovie | TMDBShow>>(initialPool ?? [])
  const [index, setIndex]     = useState(0)
  const [visible, setVisible] = useState(true)
  const [loaded, setLoaded]   = useState(false)

  // Fetch pool client-side if not provided
  useEffect(() => {
    if (initialPool && initialPool.length > 0) { setPool(initialPool); return }
    buildBannerPool(type, 20).then(p => setPool(p))
  }, [type, initialPool])

  // Auto-rotate every 7s with fade transition
  const advance = useCallback(() => {
    setVisible(false)
    setTimeout(() => {
      setIndex(prev => (prev + 1) % (pool.length || 1))
      setLoaded(false)
      setVisible(true)
    }, 500)
  }, [pool.length])

  useEffect(() => {
    if (pool.length === 0) return
    const timer = setInterval(advance, 7000)
    return () => clearInterval(timer)
  }, [pool.length, advance])

  const item = pool[index]
  if (!item) {
    return (
      <div className="skeleton w-full" style={{ height: 'clamp(260px, 55vw, 680px)' }} />
    )
  }

  const title   = getTitle(item)
  const year    = getYear(item)
  const country = getOriginCountry(item)
  const genres  = getGenreNames(item)
  const flag    = countryFlag(country)
  const cert    = (item as any).certification || ''
  const desc    = item.overview || ''
  const backdropUrl = IMG.original(item.backdrop_path) // 4K/original quality

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: 'clamp(260px, 55vw, 680px)', background: '#000' }}
    >
      {/* Backdrop image — 4K/original */}
      {backdropUrl && (
        <div
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: visible && loaded ? 1 : 0 }}
        >
          <Image
            src={backdropUrl}
            alt={title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
            onLoad={() => setLoaded(true)}
            unoptimized={false}
          />
        </div>
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 overlay-left" />
      <div className="absolute inset-0 overlay-bottom" />

      {/* Content — metadata only, NO buttons */}
      <div
        className="absolute inset-0 flex flex-col justify-end section-px cursor-pointer tv-focus"
        style={{ paddingBottom: 'clamp(20px, 4vw, 60px)', opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease' }}
        onClick={() => {
          const isMovie = (item as any).media_type === 'movie' || (item as TMDBMovie).title !== undefined
          const detailUrl = `/detalhes/${isMovie ? 'filme' : 'serie'}-${item.id}`
          router.push(detailUrl)
        }}
        onFocus={(e) => e.currentTarget.scrollIntoView({ behavior: 'smooth' })}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            const isMovie = (item as any).media_type === 'movie' || (item as TMDBMovie).title !== undefined
            const detailUrl = `/detalhes/${isMovie ? 'filme' : 'serie'}-${item.id}`
            router.push(detailUrl)
          }
        }}
        tabIndex={0}
        role="link"
      >
        <div style={{ maxWidth: 'clamp(280px, 55%, 700px)' }}>
          {/* Country flag + genre tags */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="country-flag">{flag}</span>
            {genres.map(g => (
              <span key={g} className="text-metadata rounded-full px-2.5 py-0.5 font-bold"
                style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>
                {g}
              </span>
            ))}
            {cert && (
              <span className="rating-badge" style={{ color: '#ddd' }}>{cert}</span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-hero-title mb-2 text-white drop-shadow-lg">{title}</h1>

          {/* Year */}
          <p className="text-metadata mb-2" style={{ fontSize: '20px' }}>{year}</p>

          {/* Description — exactly 2 lines */}
          <p
            className="text-hero-desc"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              maxWidth: '520px',
            }}
          >{desc}</p>
        </div>

        {/* Progress dots — no arrows, no icons */}
        {pool.length > 1 && (
          <div className="mt-4 flex gap-1.5">
            {pool.slice(0, Math.min(pool.length, 12)).map((_, i) => (
              <div
                key={i}
                className="h-0.5 rounded-full transition-all duration-700"
                style={{
                  width: i === index ? '24px' : '6px',
                  background: i === index ? '#fff' : 'rgba(255,255,255,0.3)',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
