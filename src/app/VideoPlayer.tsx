'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { 
  MediaPlayer, 
  MediaProvider, 
  Poster, 
  Track,
  useMediaState,
  type MediaPlayerInstance 
} from '@vidstack/react';
import { 
  DefaultVideoLayout, 
  defaultLayoutIcons 
} from '@vidstack/react/player/layouts/default';
import { useAuth } from '@/components/layout/SupabaseProvider';
import { PartyChat } from './PartyChat';

// Importar estilos necessários
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

interface Props {
  src: string
  title: string
  contentId?: string | null
  userId?: string | null
  startOffset?: number
  onClose: () => void
  onNext?: () => void
  partyRoomId?: string | null
  isGuest?: boolean
  guestName?: string
  backdrop?: string | null
}

export function VideoPlayer({ src, title, contentId, userId, startOffset = 0, onClose, onNext, partyRoomId, isGuest, guestName, backdrop }: Props) {
  const player = useRef<MediaPlayerInstance>(null);
  const [mediaInstance, setMediaInstance] = useState<MediaPlayerInstance | null>(null);
  const [showChat, setShowChat] = useState(!!partyRoomId);
  const { user } = useAuth()
  const sb = useMemo(() => createClient(), [])

  async function saveProgress(seconds: number) {
    if (!userId || !contentId || isNaN(seconds)) return;
    try {
      await sb.from('view_progress').upsert({
        user_id: userId,
        content_id: contentId,
        last_position: Math.floor(seconds),
        updated_at: new Date().toISOString(),
        is_finished: false
      }, { onConflict: 'user_id,content_id' });
    } catch (err) {
      console.error('Erro ao salvar progresso:', err);
    }
  }

  // Função chamada quando o tempo do vídeo muda
  function onTimeUpdate(time: number) {
    if (Math.floor(time) % 10 === 0 && time > 0) {
      saveProgress(time);
    }
  }
  
  function handleStop() {
    player.current?.pause();
    player.current!.currentTime = 0;
  }

  // Lógica de Sincronização Realtime
  useEffect(() => {
    if (!partyRoomId || !mediaInstance) return;

    const channel = sb.channel(`party-${partyRoomId}`);

    if (!isGuest) {
      // Anfitrião envia comandos
      const unsubPlay = mediaInstance.subscribe(({ paused, currentTime }) => {
        if (!paused) {
          channel.send({ type: 'broadcast', event: 'sync-play', payload: { time: currentTime } });
        } else {
          channel.send({ type: 'broadcast', event: 'sync-pause', payload: { time: currentTime } });
        }
      });

      const unsubSeek = mediaInstance.subscribe(({ seeking, currentTime }) => {
        if (seeking) {
          channel.send({ type: 'broadcast', event: 'sync-seek', payload: { time: currentTime } });
        }
      });

      channel.subscribe();
      return () => { unsubPlay(); unsubSeek(); sb.removeChannel(channel); };
    } else {
      // Convidado recebe comandos
      channel
        .on('broadcast', { event: 'sync-play' }, ({ payload }) => {
          const drift = Math.abs(mediaInstance.currentTime - payload.time);
          if (drift > 1.5) mediaInstance.currentTime = payload.time;
          mediaInstance.play();
        })
        .on('broadcast', { event: 'sync-pause' }, () => {
          mediaInstance.pause();
        })
        .on('broadcast', { event: 'sync-seek' }, ({ payload }) => {
          mediaInstance.currentTime = payload.time;
        })
        .subscribe();

      return () => { sb.removeChannel(channel); };
    }
  }, [partyRoomId, isGuest, sb, mediaInstance]);

  return (
    <div className={`fixed inset-0 z-[10000] bg-black flex hero-enter ${showChat ? 'flex-row' : 'flex-col'}`}>
      {/* Header do Player */}
      <div className="absolute top-0 left-0 right-0 p-8 z-[10005] flex items-center justify-between bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none">
        <button 
          onClick={onClose}
          className="flex items-center gap-4 text-white text-2xl font-bold hover:text-[#00ADEF] transition-colors rounded-[20px] pointer-events-auto outline-none"
        >
          <span className="text-4xl">←</span>
          <span className="uppercase tracking-widest font-montserrat">{title}</span>
        </button>

        {partyRoomId && (
          <button 
            onClick={() => setShowChat(!showChat)}
            className="px-6 py-2 bg-white/10 hover:bg-[#00ADEF] text-white rounded-[20px] pointer-events-auto transition-all font-montserrat font-bold text-xs uppercase tracking-widest"
          >
            {showChat ? '❌ Fechar Chat' : '💬 Abrir Chat'}
          </button>
        )}
      </div>
      
      <div className="flex-1 relative h-full bg-black">
        <MediaPlayer
          ref={player}
          onInstance={setMediaInstance}
          title={title}
          src={src}
          currentTime={startOffset}
          onTimeUpdate={(detail) => onTimeUpdate(detail.currentTime)}
          onEnded={onNext}
          seekStep={10}
          key={src}
          autoPlay={!isGuest}
          className="w-full h-full vds-cinema-player"
        >
          <MediaProvider>
            {(isGuest || !mediaInstance) && backdrop && <Poster src={backdrop} className="vds-poster" />}
          </MediaProvider>
          <DefaultVideoLayout 
            icons={defaultLayoutIcons} 
            slots={{
              beforePlayButton: (
                <button onClick={handleStop} className="vds-button" title="Parar">
                  <svg viewBox="0 0 32 32" className="w-8 h-8 fill-current"><rect x="6" y="6" width="20" height="20" /></svg>
                </button>
              )
            }}
            noScrubGesture 
          />
        </MediaPlayer>
      </div>

      {partyRoomId && showChat && (
        <div className="w-80 h-full">
          <PartyChat roomId={partyRoomId} userName={isGuest ? (guestName || 'Convidado') : (user?.email?.split('@')[0] || 'Anfitrião')} />
        </div>
      )}
    </div>
  )
}