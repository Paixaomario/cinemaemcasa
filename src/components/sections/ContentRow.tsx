'use client'
import { ContentCard } from '@/components/ui/ContentCard'
import { TMDBMovie, TMDBShow } from '@/lib/tmdb'

interface Props {
  title: string
  items: Array<TMDBMovie | TMDBShow>
  variant?: 'poster' | 'wide'
}

export function ContentRow({ title, items, variant = 'poster' }: Props) {
  if (items.length === 0) return null

  return (
    <section className="section-px py-4">
      <h2 className="text-section-title mb-4 text-white">{title}</h2>
      <div className="scroll-row no-scrollbar">
        {items.map(item => ( // Usar item.id para key, pois a exclusividade é por ID local
          <ContentCard key={item.id} item={item} variant={variant} />
        ))}
      </div>
    </section>
  )
}
