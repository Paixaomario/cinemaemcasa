'use client'

import { useEffect, useState } from 'react'
import { supabase, Cinema, Series } from '../lib/supabase'
import { ContentCard } from '../components/ContentCard'

export default function HomePage() {
  const [movies, setMovies] = useState<Cinema[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadContent() {
      try {
        // Busca filmes
        const { data: moviesData } = await supabase
          .from('cinema')
          .select('id,titulo,poster,banner,backdrop')
          .order('created_at', { ascending: false })
          .limit(20)

        // Busca séries
        const { data: seriesData } = await supabase
          .from('series')
          .select('id_n,titulo,poster,capa,banner')
          .order('created_at', { ascending: false })
          .limit(20)

        if (moviesData) setMovies(moviesData)
        if (seriesData) setSeries(seriesData)
      } catch (error) {
        console.error('Erro ao carregar conteúdo:', error)
      } finally {
        setLoading(false)
      }
    }

    loadContent()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white text-xl">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-400">PaixãoFlix</h1>
        <p className="text-gray-400 mt-2">Seu cinema em casa</p>
      </header>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Filmes</h2>
        {movies.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {movies.map(movie => (
              <ContentCard
                key={movie.id}
                id={movie.id}
                title={movie.titulo}
                poster={movie.poster}
                banner={movie.banner}
                backdrop={movie.backdrop}
                type="movie"
                onClick={() => window.location.href = `/detalhes/${movie.id}`}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Nenhum filme encontrado</p>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Séries</h2>
        {series.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {series.map(serie => (
              <ContentCard
                key={serie.id_n}
                id={serie.id_n}
                title={serie.titulo}
                poster={serie.poster}
                capa={serie.capa}
                banner={serie.banner}
                type="series"
                onClick={() => window.location.href = `/detalhes/series/${serie.id_n}`}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Nenhuma série encontrada</p>
        )}
      </section>
    </div>
  )
}
