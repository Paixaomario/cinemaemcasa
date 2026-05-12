'use client'
import React, { useEffect, useRef } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'

interface Props {
  src: string
  title: string
  onClose: () => void
}

export function VideoPlayer({ src, title, onClose }: Props) {
  const videoRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)

  useEffect(() => {
    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement('video-js')
      videoElement.classList.add('vjs-netflix-skin', 'vjs-big-play-centered')
      videoRef.current.appendChild(videoElement)

      const player = playerRef.current = videojs(videoElement, {
        autoplay: true,
        controls: true,
        responsive: true,
        fluid: true,
        playbackRates: [0.5, 1, 1.5, 2],
        userActions: { hotkeys: true },
        sources: [{ src, type: 'video/mp4' }] 
      })

      player.on('ended', () => {
        console.log('Vídeo finalizado')
      })
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose()
        playerRef.current = null
      }
    }
  }, [src])

  return (
    <div className="fixed inset-0 z-[10000] bg-black flex items-center justify-center hero-enter">
      {/* Header do Player conforme padrão @netflix */}
      <div className="absolute top-0 left-0 right-0 p-8 z-[10001] flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <button 
          onClick={onClose}
          className="flex items-center gap-4 text-white text-2xl font-bold hover:text-[var(--gold-primary)] transition-colors"
        >
          <span className="text-4xl">←</span>
          <span className="uppercase tracking-widest">{title}</span>
        </button>
      </div>
      
      <div className="w-full h-full">
        <div ref={videoRef} className="w-full h-full" />
      </div>
    </div>
  )
}