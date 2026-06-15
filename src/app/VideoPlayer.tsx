'use client'

import { useEffect, useRef } from 'react'
import { 
  MediaPlayer, 
  MediaProvider, 
  useMediaState, 
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
  preferredLanguage?: string // Adicionado para definir o idioma de áudio padrão
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
  preferredLanguage = 'pt-BR' // Padrão para pt-BR se não for especificado
}: VideoPlayerProps) {
  const playerRef = useRef<MediaPlayerInstance>(null)
  
  // Acessa o estado do player de forma reativa usando o playerRef
  const audioTracks = useMediaState('audioTracks', playerRef)

  useEffect(() => {
    if (!audioTracks || audioTracks.length === 0 || !playerRef.current) return

    const targetLang = preferredLanguage.toLowerCase()

    const preferredAudioTrack = Array.from(audioTracks).find(track => {
      const lang = (track.language || '').toLowerCase()
      const label = (track.label || '').toLowerCase()
      
      return (
        lang === targetLang ||
        lang.includes(targetLang) ||
        // Fallbacks comuns para pt-BR
        (targetLang === 'pt-br' && (lang === 'por' || lang === 'pob' || lang === 'pt')) ||
        // Verifica labels
        label.includes('portugues') || 
        label.includes('dublado') ||
        label.includes('brazil') ||
        label.includes('pob')
      )
    })

    if (preferredAudioTrack && !preferredAudioTrack.selected) {
      // Timeout de segurança para evitar race conditions no carregamento do buffer
      const timer = setTimeout(() => {
        preferredAudioTrack.selected = true
        console.log(`[AudioSystem] Selecionado automaticamente: ${preferredAudioTrack.label} (${preferredAudioTrack.language})`)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [audioTracks, preferredLanguage])

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
        <MediaProvider />
        {/* Os controles customizados do Vidstack entram aqui */}
      </MediaPlayer>
    </div>
  )
}