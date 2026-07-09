'use client'

import Image from 'next/image'

interface SimpleContentCardProps {
  id: string | number
  title: string
  poster?: string | null
  banner?: string | null
  backdrop?: string | null
  capa?: string | null
  type?: 'movie' | 'series'
  onClick?: () => void
}

export function SimpleContentCard({
  id,
  title,
  poster,
  banner,
  backdrop,
  capa,
  type,
  onClick
}: SimpleContentCardProps) {
  // Prioridade de imagem: poster > capa > banner > backdrop
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
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <span className="text-sm">{title}</span>
          </div>
        )}
      </div>
      <div className="mt-2">
        <p className="text-sm text-white truncate">{title}</p>
      </div>
    </div>
  )
}
