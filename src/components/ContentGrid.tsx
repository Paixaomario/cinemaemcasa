'use client'

import { ContentCard } from './ContentCard'

interface ContentGridProps {
  items: any[]
  onItemClick?: (item: any) => void
}

export function ContentGrid({ items, onItemClick }: ContentGridProps) {
  const getItemId = (item: any) => item.id ?? item.id_n
  
  // Exibe a lista de itens real, sem duplicação artificial.
  const displayItems = items;

  return (
    <div className="scroll-row" data-spatial-group="content">
      {displayItems.map((item, index) => {
        const id = getItemId(item)
        const href = id ? `/detalhes/${id}` : undefined

        return (
          <div key={`${id}-${index}`} className="content-card-wrapper">
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
