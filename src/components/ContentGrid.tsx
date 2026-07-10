'use client'
 
import { ContentCard } from './ContentCard'
 
interface ContentGridProps {
  items: any[]
  onItemClick?: (item: any) => void
  columns?: number
}
 
export function ContentGrid({ items, onItemClick, columns = 6 }: ContentGridProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fill, minmax(150px, 1fr))`,
      gap: '15px',
      marginBottom: '30px'
    }}>
      {items.map((item) => (
        <ContentCard
          key={item.id || item.id_n}
          id={item.id || item.id_n}
          titulo={item.titulo}
          poster={item.poster || item.capa}
          rating={item.rating}
          year={item.year || item.ano}
          onClick={() => onItemClick?.(item)}
        />
      ))}
    </div>
  )
}