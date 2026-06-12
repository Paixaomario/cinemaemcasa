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
  contentId: string
  userId?: string
  startOffset?: number
}

export function VideoPlayer({ src, title, poster, onClose, onNext }: VideoPlayerProps) {
  const playerRef = useRef<MediaPlayerInstance>(null)
  
  // Acessa o estado do player de forma reativa usando o playerRef
  const audioTracks = useMediaState('audioTracks', playerRef)

  useEffect(() => {
    // Aguarda até que as faixas de áudio sejam carregadas pelo provider
    if (!audioTracks || audioTracks.length === 0) return

    // Lógica de busca para áudio PT-BR (Português Brasil)
    // Verifica padrões comuns em metadados de filmes/séries
    const audioPt = Array.from(audioTracks).find(track => {
      const lang = (track.language || '').toLowerCase()
      const label = (track.label || '').toLowerCase()
      
      return (
        lang === 'por' || 
        lang === 'pob' || 
        lang === 'pt' || 
        lang.includes('pt-br') ||
        label.includes('portugues') || 
        label.includes('dublado') ||
        label.includes('brazil') ||
        label.includes('pob')
      )
    })

    // Força a seleção se encontrar a faixa e ela já não for a ativa
    if (audioPt && !audioPt.selected) {
      // Timeout de segurança para evitar race conditions no carregamento do buffer
      const timer = setTimeout(() => {
        audioPt.selected = true
        console.log(`[AudioSystem] Selecionado automaticamente: ${audioPt.label}`)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [audioTracks])

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
        className="vds-cinema-player w-full h-full"
      >
        <MediaProvider />
        {/* Os controles customizados do Vidstack entram aqui */}
      </MediaPlayer>
    </div>
  )
}