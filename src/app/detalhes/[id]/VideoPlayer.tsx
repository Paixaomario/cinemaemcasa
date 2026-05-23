'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { IMG } from '@/lib/tmdb'
import { PartyChat } from '@/app/PartyChat'

interface Reaction {
  id: number;
  emoji: string;
  left: number;
}

interface Props {
  src: string
  title: string
  contentId?: string | null
  userId?: string | null
  startOffset?: number | null
  onClose: () => void
  onNext?: () => void
  partyRoomId?: string | null
  isGuest?: boolean
  backdrop?: string | null
  shouldStartParty?: boolean // New prop to indicate if a party should be started
}

export function VideoPlayer({ 
  src, title, contentId, userId, startOffset = 0, 
  onClose, onNext, partyRoomId, isGuest, backdrop, shouldStartParty
}: Props) {
  const videoRef = useRef<HTMLDivElement>(null)

  const [currentRoomId, setCurrentRoomId] = useState(partyRoomId)
  const [showChat, setShowChat] = useState(!!partyRoomId)
  const [reactions, setReactions] = useState<Reaction[]>([])

  const isYouTube = src.includes('youtube.com') || src.includes('youtu.be')
  const youtubeId = isYouTube ? (src.includes('v=') ? src.split('v=')[1]?.split('&')[0] : src.split('/').pop()) : null

  const sb = createClient()


  const startParty = useCallback(() => {
    const newRoomId = Math.random().toString(36).substring(2, 11)
    setCurrentRoomId(newRoomId)
    setShowChat(true)
    const url = new URL(window.location.href)
    url.searchParams.set('room', newRoomId)
    window.history.pushState({}, '', url)
    
    // Cria e copia o convite automaticamente ao iniciar a sala com Fallback
    const inviteMsg = `🍿 Vamos assistir "${title}" comigo no PAIXAOFLIX? Acesse: ${url.toString()}`
    
    const tryCopy = async () => {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(inviteMsg);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = inviteMsg;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      alert('🎉 Sala criada e convite copiado!');
    };

    tryCopy();
  }, [title]);

  const copyInviteLink = useCallback(() => {
    if (!currentRoomId) return
    const url = new URL(window.location.href)
    url.searchParams.set('room', currentRoomId)
    const inviteMsg = `🍿 Vamos assistir "${title}" comigo? Acesse: ${url.toString()}`
    navigator.clipboard.writeText(inviteMsg)
    
    const btn = document.getElementById('copy-link-btn')
    if (btn) {
      const originalText = btn.innerText
      btn.innerText = '✅ Copiado!'
      setTimeout(() => {
        btn.innerText = originalText
      }, 2000)
    }
  }, [currentRoomId, title]);

  // EFEITO: Inicialização do Player (HTML5 nativo com controles profissionais)
  useEffect(() => {
    if (!isYouTube && videoRef.current) {
      // Usar player HTML5 nativo para melhor compatibilidade
      const videoElement = document.createElement('video')
      videoElement.src = src
      videoElement.autoplay = true
      videoElement.controls = true
      videoElement.style.width = '100%'
      videoElement.style.height = '100%'
      videoElement.style.objectFit = 'contain'

      if (backdrop) {
        videoElement.poster = backdrop.startsWith('http') ? backdrop : IMG.original(backdrop)
      }

      if (startOffset && startOffset > 0) {
        videoElement.currentTime = startOffset
      }

      videoElement.onended = () => {
        if (onNext) onNext()
      }

      videoRef.current.innerHTML = ''
      videoRef.current.appendChild(videoElement)

      return () => {
        if (videoRef.current) {
          videoRef.current.innerHTML = ''
        }
      }
    }
  }, [src, isYouTube, backdrop, startOffset, onNext])

  // EFEITO: Sincronização e Realtime (HTML5)
  useEffect(() => {
    if (currentRoomId && videoRef.current) {
      const videoElement = videoRef.current.querySelector('video')
      if (!videoElement) return

      const channel = sb.channel(`sync-${currentRoomId}`);

      if (!isGuest) {
        // Lógica do Host: envia eventos
        videoElement.onplay = () => channel.send({ type: 'broadcast', event: 'play', payload: { time: videoElement.currentTime } });
        videoElement.onpause = () => channel.send({ type: 'broadcast', event: 'pause' });
        videoElement.onseeked = () => channel.send({ type: 'broadcast', event: 'seek', payload: { time: videoElement.currentTime } });
      } else {
        // Lógica do Convidado: recebe eventos
        channel
          .on('broadcast', { event: 'play' }, ({ payload }) => {
            const drift = Math.abs(videoElement.currentTime - payload.time);
            if (drift > 2) videoElement.currentTime = payload.time;
            videoElement.play();
          })
          .on('broadcast', { event: 'pause' }, () => videoElement.pause())
          .on('broadcast', { event: 'seek' }, ({ payload }) => videoElement.currentTime = payload.time);
      }

      channel.on('broadcast', { event: 'reaction' }, ({ payload }) => {
        const id = Date.now();
        setReactions(prev => [...prev, { id, emoji: payload.emoji, left: Math.random() * 80 + 10 }]);
        setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 3000);
      }).subscribe();

      return () => { sb.removeChannel(channel); };
    }
  }, [currentRoomId, sb, isGuest]);

  // Efeito para salvar progresso (HTML5)
  useEffect(() => {
    if (videoRef.current && userId && contentId && !isGuest) {
      const videoElement = videoRef.current.querySelector('video')
      if (videoElement) {
        const interval = setInterval(() => {
          if (!videoElement.paused) {
            const now = Math.floor(videoElement.currentTime);
            if (now > 0 && now % 10 === 0) {
              sb.from('view_progress').upsert(
                { user_id: userId, content_id: String(contentId), last_position: now, updated_at: new Date().toISOString() },
                { onConflict: 'user_id,content_id' }
              ).then();
            }
          }
        }, 10000); // Checa a cada 10 segundos
        return () => clearInterval(interval);
      }
    }
  }, [userId, contentId, isGuest, sb]);

  // Effect to automatically start a party if shouldStartParty is true
  useEffect(() => {
    if (shouldStartParty && !isGuest && !currentRoomId) startParty()
  }, [shouldStartParty, isGuest, currentRoomId, startParty])

  const sendReaction = (emoji: string) => {
    if (currentRoomId) {
      sb.channel(`sync-${currentRoomId}`).send({
        type: 'broadcast',
        event: 'reaction',
        payload: { emoji }
      })

      // Feedback visual local imediato
      const id = Date.now()
      setReactions(prev => [...prev, { id, emoji, left: Math.random() * 80 + 10 }])
      setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 3000)
    }
  }

  return (
    <div className={`fixed inset-0 z-[10000] bg-black flex hero-enter ${isGuest ? 'guest-fullscreen-fix' : ''} ${showChat ? 'flex-row' : 'flex-col'}`}>
      {/* Camada de Emojis Voadores */}
      {reactions.map(r => (
        <span 
          key={r.id} 
          className="emoji-reaction" 
          style={{ left: `${r.left}%`, '--emoji-drift': `${(Math.random() - 0.5) * 200}px` } as React.CSSProperties}
        >
          {r.emoji}
        </span>
      ))}

      {/* Header do Player conforme padrão @netflix */}
      <div className="absolute top-0 left-0 right-0 p-8 z-[10001] flex items-center justify-between bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none">
        <button 
          onClick={onClose}
          className="flex items-center gap-4 text-white text-2xl font-bold hover:text-[var(--gold-primary)] focus-visible:text-[var(--gold-primary)] transition-colors pointer-events-auto outline-none" // Added tabIndex={0}
        >
          <span className="text-2xl">←</span>
          <span className="uppercase tracking-widest text-[12px] font-medium opacity-70">{title}</span>
        </button>

        <div className="flex gap-2">
          {!currentRoomId && !isGuest && (
            <button tabIndex={0}
              onClick={startParty}
              className="p-3 bg-[var(--red-primary)] text-white rounded-full hover:bg-[var(--red-hover)] transition-all pointer-events-auto text-sm font-bold uppercase"
            >
              🍿 Assistir Juntos
            </button>
          )}
          
          {currentRoomId && (
            <>
              <button tabIndex={0}
                id="copy-link-btn"
                onClick={copyInviteLink}
                className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all pointer-events-auto text-sm font-bold uppercase"
              >
                🔗 Convidar
              </button>
              <button tabIndex={0}
                onClick={() => setShowChat(!showChat)}
                className="p-3 bg-white/10 rounded-full hover:bg-[#F5C76B] hover:text-black transition-all pointer-events-auto text-sm font-bold uppercase tracking-tighter"
              >
                {showChat ? '❌ Fechar Chat' : '💬 Chat'}
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Marca d'água discreta solicitada anteriormente */}
      <div className="absolute bottom-10 right-10 z-[10001] pointer-events-none select-none opacity-[0.07]">
        <Image src="/logo.png" alt="" width={160} height={60} className="object-contain" />
      </div>

      <div className={`flex-1 h-full relative bg-black ${showChat ? 'w-full lg:w-[calc(100%-320px)]' : 'w-full'}`} id="player-container">
        <div className="w-full h-full relative" id="clappr-player">
          <div className="w-full h-full">
            {isYouTube ? (
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&controls=1`}
                className="w-full h-full border-none hero-enter"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; display-capture"
                allowFullScreen
              ></iframe>
            ) : (
              <div ref={videoRef} className="w-full h-full" />
            )}
          </div>
        </div>
      </div>

      {/* Chat Lateral PAIXÃOFLIX Premium */}
      {currentRoomId && showChat && (
        <PartyChat roomId={currentRoomId} userName={isGuest ? 'Convidado' : 'Anfitrião'} onReaction={sendReaction} />
      )}
    </div>
  )
}