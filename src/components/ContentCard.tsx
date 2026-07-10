'use client'

interface ContentCardProps {
  id: string | number
  title: string
  poster?: string | null
  capa?: string | null
  banner?: string | null
  backdrop?: string | null
  type?: 'movie' | 'series'
  onClick?: () => void
}

export function ContentCard({
  id,
  title,
  poster,
  capa,
  banner,
  backdrop,
  type,
  onClick
}: ContentCardProps) {
  // Prioridade: poster > capa > banner > backdrop
  const imageUrl = poster || capa || banner || backdrop

  return (
    <div
      className="relative group cursor-pointer transition-transform hover:scale-105"
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={title}
    >
      <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <span className="text-xs text-center px-2">{title}</span>
          </div>
        )}
      </div>
      <div className="mt-2">
        <p className="text-sm text-white truncate">{title}</p>
      </div>
    </div>
  )
}
