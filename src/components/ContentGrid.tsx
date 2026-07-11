'use client'

import { ContentCard } from './ContentCard'

interface ContentGridProps {
  items: any[]
  onItemClick?: (item: any) => void
}

export function ContentGrid({ items, onItemClick }: ContentGridProps) {
  const getItemId = (item: any) => item.id ?? item.id_n

  return (
    <div className="flex w-full gap-4 overflow-x-auto pb-4">
      {items.map((item) => {
        const id = getItemId(item)
        const href = id ? `/detalhes/${id}` : undefined

        return (
          <div key={id ?? Math.random()} className="min-w-[180px] flex-shrink-0">
            <ContentCard
              id={id}
              titulo={item.titulo}
              poster={item.poster || item.capa}
              rating={item.rating}
              year={item.year || item.ano}
              href={href}
              onClick={() => onItemClick?.(item)}
            />
          </div>
        )
      })}
    </div>
  )
}
