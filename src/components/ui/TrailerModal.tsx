'use client'

import { X } from 'lucide-react'

interface TrailerModalProps {
  isOpen: boolean
  onClose: () => void
  trailerUrl: string
}

export function TrailerModal({ isOpen, onClose, trailerUrl }: TrailerModalProps) {
  if (!isOpen) return null

  // Extrair o ID do YouTube do URL
  const getYouTubeId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  const youtubeId = getYouTubeId(trailerUrl)

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-5xl">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-[#00ADEF] transition-colors"
          aria-label="Fechar trailer"
        >
          <X className="w-8 h-8 sm:w-10 sm:h-10" />
        </button>
        
        <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
          {youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=0&controls=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&playlist=${youtubeId}&loop=1&rel=0`}
              title="Trailer"
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              <p className="text-lg">Trailer não disponível</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
