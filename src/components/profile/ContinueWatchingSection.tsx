'use client'
import Image from 'next/image'
import Link from 'next/link'
import { CinemaItem } from '@/app/HomeClient'

interface ContinueWatchingItem extends CinemaItem {
  progress?: number
  duration?: number
  episode?: number
  season?: number
}

interface ContinueWatchingSectionProps {
  items: ContinueWatchingItem[]
}

export function ContinueWatchingSection({ items }: ContinueWatchingSectionProps) {
  if (items.length === 0) {
    return (
      <section className="animate-in fade-in slide-in-from-left-4 duration-1000">
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 flex items-center gap-4 text-[var(--gold-primary)]">
          <span className="w-2 h-10 rounded-full bg-[var(--gold-primary)]"></span>
          Continuar Assistindo
        </h2>
        <div className="p-10 rounded-3xl bg-white/5 border border-white/5 text-gray-500 font-medium italic">
          Nenhum conteúdo em andamento.
        </div>
      </section>
    )
  }

  return (
    <section className="animate-in fade-in slide-in-from-left-4 duration-1000">
      <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 flex items-center gap-4 text-[var(--gold-primary)]">
        <span className="w-2 h-10 rounded-full bg-[var(--gold-primary)]"></span>
        Continuar Assistindo
      </h2>
      
      <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {items.map((item) => {
          const isSeries = (item.type === 'serie' || item.type === 'series')
          const posterPath = item.poster || item.backdrop
          if (!posterPath && !item.titulo) return null
          const imageUrl = posterPath
          const progress = item.progress || 0
          const progressPercent = progress > 0 ? Math.min((progress / (item.duration || 6000)) * 100, 100) : 0

          return (
            <Link
              key={item.id}
              href={isSeries ? `/series/${item.id}` : `/detalhes/${item.id}`}
              className="relative group rounded-2xl overflow-hidden bg-neutral-900 border border-white/5 hover:border-brand-cyan transition-all shadow-xl"
            >
              {/* Thumbnail 16:9 */}
              <div className="relative aspect-video w-full overflow-hidden">
                {imageUrl ? (
                  <Image 
                    src={imageUrl} 
                    alt={item.titulo || ''} 
                    fill 
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-4xl bg-neutral-800">🎬</div>
                )}
                
                {/* Barra de progresso */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                  <div 
                    className="h-full bg-[var(--gold-primary)] transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Botão play */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-2xl">
                    <span className="text-2xl ml-1">▶</span>
                  </div>
                </div>
              </div>

              {/* Informações */}
              <div className="p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-sm font-black uppercase truncate text-white drop-shadow-md mb-1">
                  {item.titulo}
                </p>
                {isSeries && item.episode && (
                  <p className="text-xs text-gray-400">
                    T{item.season || 1}:E{item.episode}
                  </p>
                )}
                <p className="text-xs text-[var(--gold-primary)] font-bold mt-1">
                  {Math.floor(progress / 60)}:{(progress % 60).toString().padStart(2, '0')} assistidos
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
