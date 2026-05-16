'use client'
import React, { useRef, useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { PartyChat } from '../../PartyChat'
import { IMG } from '@/lib/tmdb' 

interface ClapprPlayer {
  destroy(): void;
  play(): void;
  pause(): void;
  seek(time: number): void;
  getCurrentTime(): number;
  isPlaying(): boolean;
  on(event: string, callback: (...args: unknown[]) => void): void;
}

interface ClapprLevel {
  level: {
    height: number;
    name: string;
  };
}

interface ClapprConfig {
  source: string;
  parentId: string;
  plugins?: unknown[];
  baseUrl?: string;
  poster?: string;
  autoPlay?: boolean;
  width?: string | number;
  height?: string | number;
  hideMediaControl?: boolean;
  playback?: {
    playInline?: boolean;
    recycleVideo?: boolean;
  };
  events?: {
    onReady?: () => void;
    onEnded?: () => void;
  };
  levelSelectorConfig?: {
    title?: string;
    labelCallback?: (playbackLevel: ClapprLevel) => string;
  };
  playbackSpeedConfig?: {
    defaultValue?: string;
    options?: { value: string; label: string }[];
  };
  markers?: {
    markers?: unknown[];
  };
  chromecast?: {
    appId?: string;
    contentType?: string;
  };
  scrubThumbnails?: {
    backdropHeight?: number;
    spotlightHeight?: number;
    thumbs?: unknown[];
  };
  [key: string]: unknown;
}

declare const Clappr: {
  Player: new (config: ClapprConfig) => ClapprPlayer;
  Events: Record<string, string>;
};
declare const HlsjsPlayback: unknown;
declare const DashShakaPlayback: unknown;
declare const LevelSelector: unknown;
declare const PlaybackSpeed: unknown;
declare const ClapprMarkersPlugin: unknown;
declare const ClapprSubtitlePlugin: unknown;
declare const ChromecastPlugin: unknown;
declare const ClapprThumbnailsPlugin: unknown;

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
  const playerRef = useRef<ClapprPlayer | null>(null)
  
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

  // EFEITO: Inicialização do Clappr
  useEffect(() => {
    if (
      !isYouTube && 
      videoRef.current && 
      typeof Clappr !== 'undefined' && 
      typeof HlsjsPlayback !== 'undefined' &&
      typeof DashShakaPlayback !== 'undefined' &&
      typeof LevelSelector !== 'undefined' &&
      typeof PlaybackSpeed !== 'undefined' &&
      typeof ClapprMarkersPlugin !== 'undefined' &&
      typeof ClapprSubtitlePlugin !== 'undefined' &&
      typeof ChromecastPlugin !== 'undefined' &&
      typeof ClapprThumbnailsPlugin !== 'undefined'
    ) {
      // Limpar player anterior se existir
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      const player = new Clappr.Player({
        source: src,
        parentId: `#clappr-player`,
        plugins: [HlsjsPlayback, DashShakaPlayback, LevelSelector, PlaybackSpeed, ClapprMarkersPlugin, ClapprSubtitlePlugin, ChromecastPlugin, ClapprThumbnailsPlugin],
        levelSelectorConfig: {
          title: 'Qualidade',
          labelCallback: function(playbackLevel: ClapprLevel) {
            return playbackLevel.level.height ? playbackLevel.level.height + 'p' : playbackLevel.level.name;
          }
        },
        playbackSpeedConfig: {
          defaultValue: '1.0',
          options: [
            {value: '0.5', label: '0.5x'},
            {value: '1.0', label: 'Normal'},
            {value: '1.25', label: '1.25x'},
            {value: '1.5', label: '1.5x'},
            {value: '2.0', label: '2.0x'},
          ]
        },
        scrubThumbnails: {
          backdropHeight: 64,
          spotlightHeight: 84,
          thumbs: [] // Pode ser preenchido dinamicamente com URLs de miniaturas ou arquivo VTT
        },
        markers: {
          markers: [] // Aqui você pode injetar instâncias de new ClapprMarkersPlugin.Marker(time, tooltip)
        },
        chromecast: {
          appId: '9DFB77C0', // AppId padrão do Clappr
          contentType: 'video/mp4',
        },
        subtitleConfig: {
          title: 'Legendas',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          fontWeight: 'bold',
        },
        baseUrl: 'https://cdn.jsdelivr.net/npm/clappr@latest/dist',
        poster: backdrop ? (backdrop.startsWith('http') ? backdrop : IMG.original(backdrop)) : undefined,
        autoPlay: true,
        width: '100%',
        height: '100%',
        hideMediaControl: false,
        playback: {
          playInline: true,
          recycleVideo: true,
        },
        events: {
          onReady: () => {
            if (startOffset && startOffset > 0) {
              player.seek(startOffset);
            }
          },
          onEnded: () => {
            if (onNext) onNext();
          }
        }
      });

      playerRef.current = player;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [src, isYouTube, backdrop, startOffset, onNext]);

  // EFEITO: Sincronização e Realtime adaptado para Clappr
  useEffect(() => {
    if (currentRoomId && playerRef.current) {
      const player = playerRef.current;
      const channel = sb.channel(`sync-${currentRoomId}`);
      
      if (!isGuest) {
        // Lógica do Host: envia eventos
        player.on(Clappr.Events.PLAYER_PLAY, () => channel.send({ type: 'broadcast', event: 'play', payload: { time: player.getCurrentTime() } }));
        player.on(Clappr.Events.PLAYER_PAUSE, () => channel.send({ type: 'broadcast', event: 'pause' }));
        player.on(Clappr.Events.PLAYER_SEEK, (time: number) => channel.send({ type: 'broadcast', event: 'seek', payload: { time } }));
      } else {
        // Lógica do Convidado: recebe eventos
        channel
          .on('broadcast', { event: 'play' }, ({ payload }) => {
            const drift = Math.abs(player.getCurrentTime() - payload.time);
            if (drift > 2) player.seek(payload.time);
            player.play();
          })
          .on('broadcast', { event: 'pause' }, () => player.pause())
          .on('broadcast', { event: 'seek' }, ({ payload }) => player.seek(payload.time));
      }

      channel.on('broadcast', { event: 'reaction' }, ({ payload }) => {
        const id = Date.now();
        setReactions(prev => [...prev, { id, emoji: payload.emoji, left: Math.random() * 80 + 10 }]);
        setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 3000);
      }).subscribe();

      return () => { sb.removeChannel(channel); };
    }
  }, [currentRoomId, sb, isGuest]);

  // Efeito para salvar progresso (Clappr)
  useEffect(() => {
    if (playerRef.current && userId && contentId && !isGuest) {
      const player = playerRef.current;
      const interval = setInterval(() => {
        if (player.isPlaying()) {
          const now = Math.floor(player.getCurrentTime());
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
          {/* Marca d'água PaixaoFlix no canto superior direito */}
          {!isYouTube && (
            <div className="paixaoflix-watermark">
               <Image src="/logo.png" alt="PaixaoFlix" width={150} height={60} className="object-contain" />
            </div>
          )}
          
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