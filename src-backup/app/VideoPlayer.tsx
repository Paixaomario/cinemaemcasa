'use client'

import { useRef } from 'react'
import { 
  MediaPlayer, 
  MediaProvider, 
  Track,
  type MediaPlayerInstance 
} from '@vidstack/react'

interface VideoPlayerProps {
  src: string
  title?: string
  poster?: string
  onClose?: () => void
  onNext?: () => void
  contentId?: string | null
  userId?: string | null
  startOffset?: number
  partyRoomId?: string | null
  isGuest?: boolean
  guestName?: string | null
  backdrop?: string | null
  nextEpisode?: any
  preferredLanguage?: string
  subtitles?: any[]
  audioTracks?: any[]
}

export function VideoPlayer({ 
  src, 
  title, 
  poster, 
  onClose, 
  onNext,
  contentId,
  userId,
  startOffset,
  partyRoomId,
  isGuest,
  guestName,
  backdrop,
  nextEpisode,
  preferredLanguage = 'pt-BR',
  subtitles = [],
  audioTracks: remoteAudioTracks = []
}: VideoPlayerProps) {
  const playerRef = useRef<MediaPlayerInstance>(null)

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Botão de Voltar Otimizado para TV/WebOS */}
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-8 left-8 z-[100] p-4 bg-black/40 hover:bg-brand-cyan rounded-full transition-all focus:ring-4 focus:ring-brand-cyan outline-none"
        >
          <span className="text-2xl text-white">←</span>
        </button>
      )}

      <MediaPlayer
        ref={playerRef}
        src={src}
        title={title}
        lang="pt-BR"
        autoPlay
        currentTime={startOffset || 0}
        className="vds-cinema-player w-full h-full"
      >
        <MediaProvider>
          {subtitles?.map((track: any, index: number) => (
            <Track
              key={`sub-${index}`}
              src={track.src}
              label={track.label}
              language={track.language || track.srclang}
              kind={track.kind || 'subtitles'}
              default={track.default}
            />
          ))}
        </MediaProvider>
        {/* Os controles customizados do Vidstack entram aqui */}
      </MediaPlayer>
    </div>
  )
}