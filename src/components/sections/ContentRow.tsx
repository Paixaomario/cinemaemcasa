'use client'
import { ContentCard } from '@/components/ui/ContentCard'
import { TMDBMovie, TMDBShow } from '@/lib/tmdb'

interface Props {
  title: string
  items: Array<TMDBMovie | TMDBShow>
  variant?: 'poster' | 'wide'
  showProgress?: boolean
}

export function ContentRow({ title, items, variant = 'poster', showProgress = false }: Props) {
  if (items.length === 0) return null

  return (
    <section className="section-px py-4">
      <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-6 border-l-4 border-brand-cyan pl-4 text-white">
        {title}
      </h2>
      <div className={`scroll-row no-scrollbar ${showProgress ? 'continue-watching' : ''}`}>
        {items.filter(Boolean).map((item, index) => (
          <ContentCard
            key={`${(item as any).id_n || (item as any).id || (item as any).tmdb_id || index}-${index}`}
            item={item}
            showProgress={showProgress}
            progress={showProgress && (item as any).last_position ? {
              lastPosition: (item as any).last_position,
              duration: (item as any).duration
            } : undefined}
          />
        ))}
      </div>
    </section>
  )
}
