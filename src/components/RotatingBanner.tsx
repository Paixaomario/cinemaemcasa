'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface RotatingBannerProps {
  items: any[]
  title?: string
  subtitle?: string
}

function getPoster(item: any) {
  return item?.banner || item?.backdrop || item?.poster || item?.capa
}

function getTitle(item: any) {
  return item?.titulo || item?.title || item?.name || 'Sem título'
}

function getDescription(item: any) {
  return item?.description || item?.descricao || item?.overview || 'Conteúdo em destaque no catálogo.'
}

function getItemId(item: any) {
  return item?.id ?? item?.id_n ?? item?.slug
}

function shuffle(items: number[]) {
  const clone = [...items]
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[clone[index], clone[randomIndex]] = [clone[randomIndex], clone[index]]
  }
  return clone
}

export function RotatingBanner({ items }: RotatingBannerProps) {
  const [order, setOrder] = useState<number[]>([])
  const [ready, setReady] = useState(false)

  const safeItems = (items || []).filter((item) => Boolean(getPoster(item)))

  useEffect(() => {
    if (!safeItems.length) {
      setOrder([])
      setReady(false)
      return
    }

    const initialOrder = shuffle(safeItems.map((_, index) => index))
    setOrder(initialOrder)
    setReady(true)
  }, [safeItems.length])

  useEffect(() => {
    if (!ready || !order.length) {
      return
    }

    const timer = window.setInterval(() => {
      setOrder((current) => current.slice(1))
    }, 7000)

    return () => window.clearInterval(timer)
  }, [ready, order.length])

  const currentItem = order.length > 0 ? safeItems[order[0]] : null
  const poster = currentItem ? getPoster(currentItem) : null
  const href = currentItem ? `/detalhes/${getItemId(currentItem)}` : '#'

  return (
    <section className="w-full relative overflow-hidden bg-transparent ml-0 mr-0 pl-0 pr-0" style={{ aspectRatio: '16/9', minHeight: '200px' }}>
      {poster ? (
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${poster})`, backgroundSize: 'cover', backgroundPosition: 'center top' }}
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      <div className="banner-content-wrapper">
        <div className="space-y-1 sm:space-y-2 md:space-y-3 max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
          <p className="text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.2em] sm:tracking-[0.35em] text-slate-300">Em destaque</p>
          <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold leading-tight text-white drop-shadow-lg line-clamp-2 sm:line-clamp-3">
            {getTitle(currentItem || {})}
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-slate-300 line-clamp-2 sm:line-clamp-3">{getDescription(currentItem || {})}</p>
        </div>

        {/* No navigation buttons - title rotates every 7s */}
      </div>
    </section>
  )
}
