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
  return item?.poster || item?.capa || item?.banner || item?.backdrop
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
    <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      {poster ? (
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${poster})` }}
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/25" />
      <div className="relative flex min-h-[320px] flex-col justify-end gap-4 p-6 sm:p-8 lg:min-h-[380px] lg:p-10">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-300">Em destaque</p>
          <h2 className="max-w-2xl text-3xl font-semibold leading-tight text-white sm:text-4xl">
            {title || getTitle(currentItem || {})}
          </h2>
          <p className="max-w-xl text-sm text-slate-200 sm:text-base">
            {subtitle || getDescription(currentItem || {})}
          </p>
        </div>

        {currentItem ? (
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={href}
              className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Ver detalhes
            </Link>
            <span className="text-sm text-slate-300">Atualiza a cada 7 segundos</span>
          </div>
        ) : (
          <p className="text-sm text-slate-300">Nenhuma imagem disponível para o banner no momento.</p>
        )}
      </div>
    </section>
  )
}
