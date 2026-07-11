'use client'

import { useEffect, useState } from 'react'
import { getMovies, getMovieCategories } from '@/lib/queries'
import { ContentGrid } from '@/components/ContentGrid'

export default function FilmesPage() {
  const [movies, setMovies] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const cats = await getMovieCategories()
        setCategories(cats)

        const data = await getMovies(selected || undefined)
        setMovies(data)
      } catch (err) {
        console.error('Erro filmes:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [selected])

  if (loading) return <div className="min-h-screen bg-black px-6 py-10 text-white">Carregando filmes...</div>

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-3xl font-semibold">🎬 Filmes</h1>

        <div className="mb-6 flex flex-wrap gap-2">
          <button onClick={() => setSelected(null)} className={`rounded-full px-4 py-2 text-sm ${selected===null? 'bg-amber-500 text-slate-900':'bg-slate-900 text-slate-300'}`}>
            Todos
          </button>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setSelected(cat)} className={`rounded-full px-4 py-2 text-sm ${selected===cat? 'bg-amber-500 text-slate-900':'bg-slate-900 text-slate-300'}`}>
              {cat}
            </button>
          ))}
        </div>

        <ContentGrid items={movies} onItemClick={(it) => console.log('Filme:', it)} />
      </div>
    </main>
  )
}