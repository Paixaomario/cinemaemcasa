'use client'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import videojs from 'video.js'
import { createClient } from '@/lib/supabase'
import { PartyChat } from '../../PartyChat'
import { IMG } from '@/lib/tmdb' 
import 'video.js/dist/video-js.css'

// Plugins Premium
import 'videojs-hotkeys'
import 'videojs-mobile-ui'
import 'videojs-hls-quality-selector'
import 'videojs-contrib-quality-levels'
import chromecast from '@silvermine/videojs-chromecast'
import '@silvermine/videojs-chromecast/dist/silvermine-videojs-chromecast.css'
import 'videojs-vtt-thumbnails'
import 'videojs-overlay'

// Registro de botões de Seek customizados (substituindo o plugin incompatível)
const registerPlayerPlugins = (vjs: any) => {
  const Button = vjs.getComponent('Button');
  
  // Define ícones padrão caso a fonte falhe, ensure it's only added once
  if (!document.getElementById('vjs-custom-icons-style')) {
    const style = document.createElement('style');
    style.id = 'vjs-custom-icons-style';
    style.innerHTML = `
      .vjs-icon-replay-10:before { content: "\\f119" !important; }
      .vjs-icon-forward-10:before { content: "\\f11a" !important; }
    `;
    document.head.appendChild(style);
  }

  if (!vjs.getComponent('SeekBackward')) {
    // Register SeekBackward button
    class SeekBackward extends (Button as any) {
      constructor(player: any, options: any) {
        super(player, options);
        this.controlText("Voltar 10s");
      }
      handleClick() {
        this.player().currentTime(this.player().currentTime() - 10);
      }
      buildCSSClass() {
        return 'vjs-icon-replay-10 vjs-control vjs-button';
      }
    }
    vjs.registerComponent('SeekBackward', SeekBackward as any);

    // Register SeekForward button
    class SeekForward extends (Button as any) {
      constructor(player: any, options: any) {
        super(player, options);
        this.controlText("Avançar 10s");
      }
      handleClick() {
        this.player().currentTime(this.player().currentTime() + 10);
      }
      buildCSSClass() {
        return 'vjs-icon-forward-10 vjs-control vjs-button';
      }
    }
    vjs.registerComponent('SeekForward', SeekForward as any);
  }

  // Inicializa o plugin do Chromecast se ainda não foi registrado
  if (typeof vjs.getComponent('ChromecastButton') === 'undefined') {
    chromecast(vjs);
  }
};

interface Props {
  src: string
  title: string
  contentId?: string | null
  userId?: string | null
  startOffset?: number | null
  onClose: () => void
  onNext?: () => void
  thumbnailsVtt?: string // URL para o arquivo VTT de thumbnails
  partyRoomId?: string | null
  isGuest?: boolean
  backdrop?: string | null
  shouldStartParty?: boolean // New prop to indicate if a party should be started
}

export function VideoPlayer({ 
  src, title, contentId, userId, startOffset = 0, 
  onClose, onNext, thumbnailsVtt, partyRoomId, isGuest, backdrop, shouldStartParty
}: Props) {
  const videoRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const [currentRoomId, setCurrentRoomId] = useState(partyRoomId)
  const [showChat, setShowChat] = useState(false)
  const [reactions, setReactions] = useState<any[]>([])

  // Controle de entrada na sala para convidados e anfitriões
  const [hasJoined, setHasJoined] = useState(!isGuest)
  const [nameInput, setNameInput] = useState(isGuest ? '' : 'Anfitrião')
  const [activeUserName, setActiveUserName] = useState(isGuest ? '' : 'Anfitrião')

  const isYouTube = src.includes('youtube.com') || src.includes('youtu.be')
  const youtubeId = isYouTube ? (src.includes('v=') ? src.split('v=')[1]?.split('&')[0] : src.split('/').pop()) : null

  const sb = createClient()

  function handleJoinSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setActiveUserName(nameInput.trim());
    setHasJoined(true);
    setShowChat(true);
  }

  const startParty = useCallback(() => {
    const newRoomId = Math.random().toString(36).substring(2, 11)
    setCurrentRoomId(newRoomId)
    setShowChat(true)
    const url = new URL(window.location.href)
    url.searchParams.set('room', newRoomId)
    window.history.pushState({}, '', url)
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

  useEffect(() => {
    if (!isYouTube && !playerRef.current && videoRef.current && hasJoined) {
      registerPlayerPlugins(videojs);
      const videoElement = document.createElement('video-js')
      videoElement.classList.add('vjs-netflix-skin', 'vjs-big-play-centered', 'vjs-show-big-play-button-on-pause')
      
      // Atributos essenciais para iOS/Safari e Smart TVs
      videoElement.setAttribute('playsinline', 'true')
      videoElement.setAttribute('webkit-playsinline', 'true')
      videoElement.setAttribute('x-webkit-airplay', 'allow')
      
      videoRef.current.appendChild(videoElement)

      // Tentar forçar orientação horizontal em dispositivos móveis
      const lockOrientation = async () => {
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
            if (window.screen.orientation && (window.screen.orientation as any).lock) {
              await (window.screen.orientation as any).lock('landscape');
            }
          }
        } catch (e) { console.log("Auto-rotate prevented by browser policy"); }
      };
      lockOrientation();

      const player = playerRef.current = videojs(videoElement, {
        autoplay: true, // Força o play automático para convidados
        controls: true,
        responsive: true,
        poster: backdrop ? (backdrop.startsWith('http') ? backdrop : IMG.original(backdrop)) : undefined,
        fluid: true,
        preload: 'auto',
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        sources: [{ src, type: src.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4' }],
        controlBar: {
          volumePanel: {
            inline: false,
            vertical: true,
          },
          children: [
            'playToggle',
            'SeekBackward',
            'SeekForward',
            'volumePanel',
            'currentTimeDisplay',
            'progressControl',
            'remainingTimeDisplay',
            'playbackRateMenuButton',
            'subsCapsButton',
            'audioTrackButton',
            'pictureInPictureToggle',
            'chromecastButton',
            'fullscreenToggle',
          ],
        }
      })

      player.ready(() => {
        // 1. Atalhos de Teclado
        (player as any).hotkeys({ volumeStep: 0.1, seekStep: 10, alwaysCaptureHotkeys: true });
        
        // 2. Interface Mobile
        (player as any).mobileUi();
        
        // 3. Seletor de Qualidade HLS
        if (src.includes('.m3u8')) {
          (player as any).hlsQualitySelector({ displayCurrentQuality: true });
        }

        // 4. Thumbnails no hover (se fornecido)
        if (thumbnailsVtt) {
          (player as any).vttThumbnails({ src: thumbnailsVtt });
        }

        // 5. Exemplo de Skip Intro (Overlay)
        // Pode ser expandido futuramente puxando os tempos do banco de dados
        (player as any).overlay({
          overlays: [{
            start: 10,
            end: 40,
            content: '<button class="vjs-skip-button" onclick="this.parentElement.parentElement.player.currentTime(41)">PULAR ABERTURA</button>',
            align: 'bottom-right'
          }]
        });

        // 6. Retomar de onde parou
        if (startOffset > 0) {
          player.currentTime(startOffset);
        }
      })

      player.on('ended', () => {
        if (onNext) onNext();
      });
    }
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
      // Restaurar orientação ao fechar (opcional)
      // Restaurar orientação ao fechar (opcional)
      if (typeof window !== 'undefined' && window.screen?.orientation?.unlock) {
        try {
          window.screen.orientation.unlock();
        } catch (e) {}
      }
      // Clean up the dynamically added style tag
      const styleTag = document.getElementById('vjs-custom-icons-style');
      if (styleTag) {
        document.head.removeChild(styleTag);
      }
    };
  }, [src, isYouTube, hasJoined, backdrop, startOffset, thumbnailsVtt, onNext]); 

  // NOVO EFEITO: Apenas para Sincronização e Realtime
  useEffect(() => {
    if (currentRoomId && playerRef.current) {
      const player = playerRef.current;
      const channel = sb.channel(`sync-${currentRoomId}`);
      
      if (!isGuest) {
        player.on('play', () => channel.send({ type: 'broadcast', event: 'play', payload: { time: player.currentTime() } }));
        player.on('pause', () => channel.send({ type: 'broadcast', event: 'pause' }));
        player.on('seeking', () => channel.send({ type: 'broadcast', event: 'seek', payload: { time: player.currentTime() } }));
      } else {
        channel
          .on('broadcast', { event: 'play' }, ({ payload }) => {
            const drift = Math.abs(player.currentTime() - payload.time);
            if (drift > 2) player.currentTime(payload.time);
            player.play();
          })
          .on('broadcast', { event: 'pause' }, () => player.pause())
          .on('broadcast', { event: 'seek' }, ({ payload }) => player.currentTime(payload.time));
      }

      channel.on('broadcast', { event: 'reaction' }, ({ payload }) => {
        const id = Date.now();
        setReactions(prev => [...prev, { id, emoji: payload.emoji, left: Math.random() * 80 + 10 }]);
        setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 3000);
      }).subscribe();

      return () => { sb.removeChannel(channel); };
    }
  }, [currentRoomId, isGuest, sb]);

  // Efeito para salvar progresso
  useEffect(() => {
    if (playerRef.current && userId && contentId && !isGuest) {
      const player = playerRef.current;
      let lastSaved = 0;
      player.on('timeupdate', () => {
        const now = Math.floor(player.currentTime());
        if (now > 0 && now % 10 === 0 && now !== lastSaved) {
          lastSaved = now;
          sb.from('view_progress').upsert(
            { user_id: userId, content_id: String(contentId), last_position: now },
            { onConflict: 'user_id,content_id' }
          );
        }
      });
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
          style={{ left: `${r.left}%`, '--emoji-drift': `${(Math.random() - 0.5) * 200}px` } as any}
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

      <div className={`flex-1 h-full relative bg-black ${showChat ? 'w-full lg:w-[calc(100%-320px)]' : 'w-full'}`}>
        <div className="w-full h-full">
          <div className={isGuest ? 'vjs-guest-mode' : ''}>
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
      {currentRoomId && showChat && isPartyMode && ( /* Renderiza chat apenas se for party mode */
        <PartyChat roomId={currentRoomId} userName={activeUserName} onReaction={sendReaction} />
      )}
    </div>
  )
}