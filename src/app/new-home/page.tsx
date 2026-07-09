'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { SimpleContentCard } from '@/components/SimpleContentCard'

interface ContentItem {
  id: string | number
  titulo: string
  poster?: string | null
  banner?: string | null
  backdrop?: string | null
  capa?: string | null
  type?: 'movie' | 'series'
}

const supabaseUrl = 'https://ebbuobnltsrvqxayrulk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViYnVvYm5sdHNydnF4YXlydWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMDI0NjQsImV4cCI6MjA5Mzg3ODQ2NH0.9QAf6l69lPn48MhAD2Xgf3adNzEpf6LkBCk3jfqqGXI'

export default function NewHomePage() {
  const [movies, setMovies] = useState<ContentItem[]>([])
  const [series, setSeries] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchContent() {
      const supabase = createClient(supabaseUrl, supabaseKey)

      try {
        // Busca filmes
        const { data: moviesData } = await supabase
          .from('cinema')
          .select('id,titulo,poster,banner,backdrop')
          .limit(20)

        // Busca séries
        const { data: seriesData } = await supabase
          .from('series')
          .select('id_n,titulo,poster,capa,banner')
          .limit(20)

        if (moviesData) {
          setMovies(moviesData.map(m => ({
            id: m.id,
            titulo: m.titulo,
            poster: m.poster,
            banner: m.banner,
            backdrop: m.backdrop,
            type: 'movie'
          })))
        }

        if (seriesData) {
          setSeries(seriesData.map(s => ({
            id: s.id_n,
            titulo: s.titulo,
            poster: s.poster,
            capa: s.capa,
            banner: s.banner,
            type: 'series'
          })))
        }
      } catch (error) {
        console.error('Erro ao buscar conteúdo:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8">PaixãoFlix</h1>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Filmes</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {movies.map(movie => (
            <SimpleContentCard
              key={movie.id}
              id={movie.id}
              title={movie.titulo}
              poster={movie.poster}
              banner={movie.banner}
              backdrop={movie.backdrop}
              type="movie"
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Séries</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {series.map(serie => (
            <SimpleContentCard
              key={serie.id}
              id={serie.id}
              title={serie.titulo}
              poster={serie.poster}
              capa={serie.capa}
              banner={serie.banner}
              type="series"
            />
          ))}
        </div>
      </section>
    </div>
  )
}
