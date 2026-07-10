'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, Cinema, Series } from '../../../lib/supabase'

export default function AssistirPage() {
  const params = useParams()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [content, setContent] = useState<Cinema | Series | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadContent() {
      const id = params.id as string
      const path = window.location.pathname

      try {
        let url = ''
        
        if (path.includes('/series/')) {
          // É série
          const { data } = await supabase
            .from('series')
            .select('*')
            .eq('id_n', parseInt(id))
            .single()

          if (data) {
            setContent(data as Series)
            // Séries podem ter URLs diferentes, verificar
            url = (data as any).url || ''
          }
        } else {
          // É filme
          const { data } = await supabase
            .from('cinema')
            .select('*')
            .eq('id', parseInt(id))
            .single()

          if (data) {
            setContent(data as Cinema)
            url = data.url || ''
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
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white text-xl">Carregando vídeo...</p>
      </div>
    )
  }

  if (error || !content) {
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

  const titulo = content.titulo
  const url = (content as Cinema).url || (content as any).url

  return (
    <div className="min-h-screen bg-black text-white">
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
        {url ? (
          <video
            ref={videoRef}
            className="w-full h-full max-h-screen"
            controls
            autoPlay
            playsInline
          >
            <source src={url} type="video/mp4" />
            Seu navegador não suporta reprodução de vídeo.
          </video>
        ) : (
          <div className="text-center">
            <p className="text-xl mb-4">Vídeo não disponível</p>
            <button
              onClick={() => router.back()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
