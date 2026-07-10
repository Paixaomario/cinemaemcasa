'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, Cinema, Series } from '../../../lib/supabase'

export default function DetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const [content, setContent] = useState<Cinema | Series | null>(null)
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState<'movie' | 'series'>('movie')

  useEffect(() => {
    async function loadContent() {
      const id = params.id as string
      const path = window.location.pathname

      try {
        if (path.includes('/series/')) {
          // É série
          const { data } = await supabase
            .from('series')
            .select('*')
            .eq('id_n', parseInt(id))
            .single()

          if (data) {
            setContent(data as Series)
            setType('series')
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
            setType('movie')
          }
        }
      } catch (error) {
        console.error('Erro ao carregar detalhes:', error)
      } finally {
        setLoading(false)
      }
    }

    loadContent()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white text-xl">Carregando...</p>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white text-xl">Conteúdo não encontrado</p>
      </div>
    )
  }

  const imageUrl = (content as Cinema).poster || (content as Series).poster || (content as Series).capa
  const backdropUrl = (content as Cinema).backdrop || (content as Cinema).banner || (content as Series).banner
  const titulo = content.titulo
  const descricao = (content as Cinema).description || (content as Series).descricao
  const ano = (content as Cinema).year || (content as Series).ano
  const rating = content.rating
  const genero = (content as Cinema).category || (content as Series).genero

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Backdrop */}
      {backdropUrl && (
        <div className="relative h-64 md:h-96">
          <img
            src={backdropUrl}
            alt={titulo}
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </div>
      )}

      <div className="px-4 md:px-8 -mt-32 relative z-10">
        <button
          onClick={() => router.back()}
          className="mb-4 text-blue-400 hover:text-blue-300 flex items-center gap-2"
        >
          ← Voltar
        </button>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          {imageUrl && (
            <div className="w-48 md:w-64 flex-shrink-0">
              <img
                src={imageUrl}
                alt={titulo}
                className="w-full rounded-lg shadow-2xl"
              />
            </div>
          )}

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{titulo}</h1>

            <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-400">
              {ano && <span>{ano}</span>}
              {rating && <span>★ {rating}</span>}
              {genero && <span>{genero}</span>}
            </div>

            {descricao && (
              <p className="text-gray-300 mb-6 leading-relaxed">{descricao}</p>
            )}

            <button
              onClick={() => {
                const id = params.id as string
                if (type === 'movie') {
                  router.push(`/assistir/${id}`)
                } else {
                  router.push(`/assistir/series/${id}`)
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Assistir Agora
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
