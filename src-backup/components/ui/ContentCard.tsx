import React, { useState } from 'react'
import Link from 'next/link'
 
interface ContentCardProps {
  id?: string | number
  titulo?: string
  type?: 'movie' | 'series'
  poster?: string
  backdrop?: string
  banner?: string
  capa?: string
  imagem_500?: string
  imagem_342?: string
  imagem_185?: string
  rating?: number
  year?: number
  onClick?: () => void
}
 
export function ContentCard({
  id,
  titulo,
  type,
  poster,
  backdrop,
  banner,
  capa,
  imagem_500,
  imagem_342,
  imagem_185,
  rating,
  year,
  onClick
}: ContentCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
 
  const imageUrl = poster || capa || backdrop || banner || imagem_500 || imagem_342 || imagem_185
 
  const handleImageLoad = () => {
    setIsLoading(false)
  }
 
  const handleImageError = () => {
    setImageError(true)
    setIsLoading(false)
  }
 
  const handleClick = () => {
    if (onClick) {
      onClick()
    }
  }
 
  const routePath = type === 'movie' ? `/filmes/${id}` : `/series/${id}`
 
  return (
    <Link href={routePath}>
      <div
        className="group relative cursor-pointer overflow-hidden rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        tabIndex={0}
        role="button"
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleClick()
          }
        }}
      >
        <div className="relative w-full bg-gray-800 pb-[150%]">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-600 border-t-yellow-400" />
            </div>
          )}
 
          {!imageError && imageUrl ? (
            <img
              src={imageUrl}
              alt={titulo}
              className="absolute inset-0 h-full w-full object-cover"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m4 16 4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2 1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"
                  />
                </svg>
                <p className="mt-2 text-xs text-gray-500">{titulo}</p>
              </div>
            </div>
          )}
 
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="line-clamp-2 text-sm font-bold text-white">{titulo}</h3>
              
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-300">
                {year && <span>{year}</span>}
                {rating && (
                  <span className="flex items-center gap-1">
                    ⭐ {rating.toFixed(1)}
                  </span>
                )}
                <span className="rounded bg-gray-800 px-2 py-1">
                  {type === 'movie' ? '🎬 Filme' : '📺 Série'}
                </span>
              </div>
            </div>
          </div>
        </div>
 
        <div className="absolute inset-0 rounded-lg border-2 border-transparent group-focus:border-yellow-400" />
      </div>
    </Link>
  )
}