'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { supabase, Cinema, Series } from '../../../lib/supabase'
import { saveViewProgress, getViewProgress } from '@/lib/actions'

// Imports do Player de Vídeo Avançado (Vidstack)
import { MediaPlayer, MediaProvider } from '@vidstack/react'
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default'

// Estilos do Player
import '@vidstack/react/player/styles/default/theme.css'
import '@vidstack/react/player/styles/default/layouts/video.css'

function Player() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const trailerUrl = searchParams.get('trailer')

  const contentId = params.id as string
  const [content, setContent] = useState<Cinema | Series | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Se for um trailer, não precisa carregar conteúdo do banco.
    if (trailerUrl) {
      setLoading(false)
      return
    }

    async function loadContent() {
      const id = contentId

      try {
        let url = ''

        // Primeiro tente encontrar um episódio por id_n
        const episodeRes = await supabase
          .from('episodios')
          .select('*')
          .eq('id_n', parseInt(id))
          .single()

        if (episodeRes.data) {
          setContent(episodeRes.data as any)
          url = episodeRes.data.arquivo || ''
        } else {
          // Se não for episódio, tenta filme por id
          const filmRes = await supabase
            .from('cinema')
            .select('*')
            .eq('id', parseInt(id))
            .single()

          if (filmRes.data) {
            setContent(filmRes.data as Cinema)
            url = filmRes.data.url || ''
          }
        }

        if (!url) {
          setError('URL do vídeo não encontrada')
        }
      } catch (err) {
        console.error('Erro ao carregar vídeo:', err)
        setError('Erro ao carregar vídeo')
      } finally {
        setLoading(false)
      }
    }

    loadContent()
  }, [params.id, trailerUrl])

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
    ? trailerUrl
    : (content as any)?.arquivo || (content as Cinema)?.url || ''
  const playerRef = React.useRef<any>(null)

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
          onCanPlay={async () => {
            if (trailerUrl) return; // Não salva progresso de trailers
            const progress = await getViewProgress(contentId);
            if (progress && progress.last_position > 0 && !progress.is_finished) {
              playerRef.current.currentTime = progress.last_position;
            }
          }}
          onTimeUpdate={(e) => {
            // Salva o progresso a cada 15 segundos
            const currentTime = Math.round(e.currentTime);
            if (currentTime > 0 && currentTime % 15 === 0) {
              if (trailerUrl) return;
              saveViewProgress(contentId, currentTime);
            }
          }}
          onEnded={() => {
            if (trailerUrl) return;
            saveViewProgress(contentId, 0, true);
          }}
          onPause={() => {
            if (trailerUrl) return;
            const currentTime = playerRef.current?.currentTime;
            if (currentTime) {
              saveViewProgress(contentId, currentTime);
            }
          }}
        >
          <MediaProvider />
          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>
      </div>
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
