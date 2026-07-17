'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface RotatingBannerProps {
  items: any[]
  title?: string
  subtitle?: string
  hrefPrefix?: string
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

export function RotatingBanner({ items, title, subtitle, hrefPrefix = '/detalhes' }: RotatingBannerProps) {
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
  const href = currentItem ? `${hrefPrefix}/${getItemId(currentItem)}` : '#'

  return (
    <section className="w-full relative overflow-hidden bg-transparent ml-0 mr-0 pl-0 pr-0" style={{ aspectRatio: '8/3' }}>
      {poster ? (
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${poster})`, backgroundSize: 'cover', backgroundPosition: 'center top' }}
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      <div className="relative flex w-full h-full flex-col justify-end gap-4 p-6 sm:p-8 lg:p-12">
        <div className="space-y-3 max-w-2xl">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-300">Em destaque</p>
          <h2 className="text-5xl font-bold leading-tight text-white drop-shadow-lg sm:text-6xl lg:text-7xl">
            {getTitle(currentItem || {})}
          </h2>
        </div>

        {/* No navigation buttons - title rotates every 7s */}
      </div>
    </section>
  )
}
