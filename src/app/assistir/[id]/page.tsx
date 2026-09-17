'use client'

import React, { useEffect, useState, Suspense, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation' 
import { supabase, Cinema } from '../../../lib/supabase'
import { saveViewProgress, getViewProgress } from '@/lib/actions'
import { PartyChat } from '@/components/PartyChat'

// Imports do Player de Vídeo Avançado (Vidstack)
import { MediaPlayer, MediaProvider } from '@vidstack/react'
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default'

// Estilos do Player
import '@vidstack/react/player/styles/default/theme.css'
import '@vidstack/react/player/styles/default/layouts/video.css'

interface NextEpisodeInfo {
  id_n: string | number
  titulo: string
}

// Definindo a interface Episodio que estava faltando
interface Episodio {
  id: number;
  serie_id: number;
  temporada_id: number;
  numero_episodio: number;
  titulo: string;
  arquivo: string;
}

// Exemplo de Custom Hook para carregar o conteúdo
function useContent(contentId: string, trailerUrl: string | null) {
  const [content, setContent] = useState<Cinema | Episodio | null>(null);
  const [nextEpisode, setNextEpisode] = useState<NextEpisodeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (trailerUrl) {
      setLoading(false);
      return;
    }

    async function loadContent() {
      setLoading(true);
      setError(null);
      setNextEpisode(null);

      try {
        const { data: episodeData } = await supabase.from('episodios').select('*').eq('id_n', parseInt(contentId)).single();

        if (episodeData) {
          setContent(episodeData as Episodio);
          const { data: nextEpData } = await supabase
            .from('episodios')
            .select('id_n, titulo')
            .eq('serie_id', episodeData.serie_id)
            .eq('temporada_id', episodeData.temporada_id)
            .eq('numero_episodio', episodeData.numero_episodio + 1)
            .single();
          if (nextEpData) setNextEpisode(nextEpData);
        } else {
          const { data: filmData } = await supabase.from('cinema').select('*').eq('id', parseInt(contentId)).single();
          if (filmData) {
            setContent(filmData as Cinema);
          } else {
            setError('Conteúdo não encontrado.');
          }
        }
      } catch (err) {
        console.error('Erro ao carregar conteúdo:', err);
        setError('Ocorreu um erro ao carregar o conteúdo.');
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [contentId, trailerUrl]);

  return { content, nextEpisode, loading, error, setNextEpisode };
}

function Player() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const trailerUrl = searchParams.get('trailer')
  const partyRoomId = searchParams.get('party')

  const contentId = params.id as string
  const { content, nextEpisode, loading, error, setNextEpisode } = useContent(contentId, trailerUrl);
  const [countdown, setCountdown] = useState(10)

  // State para Watch Party
  const [isHost, setIsHost] = useState(false)
  const [partyUsername, setPartyUsername] = useState('')
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null)

  const playerRef = useRef<any>(null)
  const isSeries = content && 'numero_episodio' in content
  const [showAutoplay, setShowAutoplay] = useState(false)

  // Hook para a contagem regressiva do próximo episódio
  useEffect(() => {
    if (showAutoplay && nextEpisode) {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
        return () => clearTimeout(timer)
      } else {
        if (partyRoomId) {
          router.push(`/assistir/${nextEpisode.id_n}?party=${partyRoomId}`)
        } else {
          router.push(`/assistir/${nextEpisode.id_n}`)
        }
      }
    }
  }, [showAutoplay, countdown, nextEpisode, router])

  // Efeito para gerenciar a sala de Watch Party
  useEffect(() => {
    if (partyRoomId && !partyUsername) {
      const name = prompt('Digite seu nome para entrar no chat:')
      if (name) {
        setPartyUsername(name)
      } else {
        router.back() // Volta se o usuário cancelar
        return
      }
    }

    if (partyRoomId && partyUsername) {
      const channel = supabase.channel(`party-room-${partyRoomId}`)

      // Convidados ouvem o estado do player do anfitrião
      if (!isHost) {
        channel.on('broadcast', { event: 'player-state' }, ({ payload }) => {
          if (playerRef.current) {
            const player = playerRef.current
            // Evita loops de eventos
            if (Math.abs(player.currentTime - payload.currentTime) > 2) {
              player.currentTime = payload.currentTime
            }
            if (player.paused !== payload.paused) {
              payload.paused ? player.pause() : player.play()
            }
          }
        })
      }

      channel.subscribe()
      setRealtimeChannel(channel)

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [partyRoomId, isHost, partyUsername, router])

  // Função para o anfitrião transmitir o estado do player
  const broadcastPlayerState = () => {
    if (isHost && realtimeChannel && playerRef.current) {
      realtimeChannel.send({
        type: 'broadcast',
        event: 'player-state',
        payload: {
          currentTime: playerRef.current.currentTime,
          paused: playerRef.current.paused,
        },
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white text-xl">Carregando vídeo...</p>
      </div>
    )
  }

  if (error || (!trailerUrl && !content)) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <p className="text-white text-xl mb-4">{error || 'Conteúdo não encontrado'}</p>
        <button
          onClick={() => router.back()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
        >
          Voltar
        </button>
      </div>
    )
  }

  // Define o título e a URL com base no tipo de conteúdo (trailer ou filme/série)
  const titulo = trailerUrl ? 'Trailer' : content?.titulo || 'Vídeo'
  const url = trailerUrl 
    ? `youtube/${trailerUrl.split('v=')[1] || trailerUrl.split('/').pop()}`
    : (content as Episodio)?.arquivo || (content as Cinema)?.url || ''

  return (
    <div className="min-h-screen bg-black text-white player-page-active">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={() => router.back()}
          className="text-white hover:text-blue-400 flex items-center gap-2"
        >
          ← Voltar
        </button>
        <h1 className="text-lg font-semibold truncate px-4">{titulo}</h1>
        <div className="w-16" />
      </div>

      {/* Video Player */}
      <div className="w-full h-screen flex items-center justify-center">
        <MediaPlayer ref={playerRef}
          title={titulo}
          src={url}
          autoPlay
          playsInline
          className="vds-cinema-player w-full h-full"
          // Anfitrião transmite o estado, convidados têm controles limitados
          onPlay={broadcastPlayerState}
          onSeeked={broadcastPlayerState}
          onPause={() => {
            broadcastPlayerState(); // Para a Watch Party
            if (trailerUrl || partyRoomId) return; // Não salva progresso de trailers ou em watch party
            const currentTime = playerRef.current?.currentTime;
            if (currentTime) {
              saveViewProgress(contentId, currentTime);
            }
          }}
          onCanPlay={async () => {
            if (trailerUrl) return; // Não salva progresso de trailers
            const progress = await getViewProgress(contentId);
            if (progress && progress.last_position > 0 && !progress.is_finished) {
              playerRef.current.currentTime = progress.last_position;
            }
          }}
          onTimeUpdate={(e) => {
            // Salva o progresso a cada 15 segundos
            if (trailerUrl || partyRoomId) return; // Não salva progresso de trailers ou em watch party
            const currentTime = Math.round(e.currentTime);
            if (currentTime > 0 && currentTime % 15 === 0) { 
              saveViewProgress(contentId, currentTime);
            }
            // Mostra o card de autoplay nos últimos 15 segundos para séries
            const duration = playerRef.current?.duration || 0;
            if (isSeries && nextEpisode && duration > 0 && duration - e.currentTime <= 15) {
              setShowAutoplay(true)
            }
          }}
          onEnded={() => {
            if (trailerUrl) return;
            saveViewProgress(contentId, 0, true);
            // Se for o host e tiver próximo episódio, navega para ele com o ID da sala
            if (isHost && isSeries && nextEpisode) {
              router.push(`/assistir/${nextEpisode.id_n}?party=${partyRoomId}`)
            }
          }}
        >
          <MediaProvider />
          <DefaultVideoLayout
            icons={defaultLayoutIcons} 
            // Desabilita controles de busca para convidados
            noGestures={!isHost}
            noScrubGesture={!isHost}
          />
        </MediaPlayer>

        {/* Card de Autoplay no estilo Netflix */}
        {showAutoplay && nextEpisode && (
          <div className="absolute bottom-16 right-8 z-20 flex items-center gap-4 rounded-lg bg-black/70 p-4 backdrop-blur-sm">
            <div className="text-right">
              <p className="text-sm text-gray-400">A seguir</p>
              <p className="font-bold text-white">{nextEpisode.titulo}</p>
            </div>
            <button 
              onClick={() => {
                const nextUrl = partyRoomId ? `/assistir/${nextEpisode.id_n}?party=${partyRoomId}` : `/assistir/${nextEpisode.id_n}`;
                router.push(nextUrl);
              }} 
              className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/50 bg-black/50 text-white transition hover:bg-white/20"
            >
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
            </button>
            <p className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-300">em {countdown}s</p>
          </div>
        )}
      </div>
      {partyRoomId && partyUsername && <PartyChat roomId={partyRoomId} username={partyUsername} />}
    </div>
  )
}

// Envolve o player com Suspense para ler os parâmetros da URL
export default function AssistirPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><p className="text-white">Carregando...</p></div>}>
      <Player />
    </Suspense>
  )
}
