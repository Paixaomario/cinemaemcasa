'use client'

import { useEffect, useState } from 'react'
import { getMovieBannerItems, getMovies, getMovieCategories } from '@/lib/queries'
import { ContentGrid } from '@/components/ContentGrid'
import { RotatingBanner } from '@/components/RotatingBanner'

export default function FilmesPage() {
  const [movieSections, setMovieSections] = useState<Array<{ category: string; items: any[] }>>([])
  const [bannerItems, setBannerItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [categories, banner] = await Promise.all([getMovieCategories(), getMovieBannerItems(undefined, 12)])
        setBannerItems(banner)
        const sections = await Promise.all(
          categories.map(async (category) => ({
            category,
            items: await getMovies(category, 5),
          }))
        )

        setMovieSections(sections)
      } catch (err) {
        console.error('Erro filmes:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return <div className="min-h-screen bg-black px-6 py-10 text-white">Carregando filmes...</div>
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-10">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Catálogo</p>
          <h1 className="text-3xl font-semibold">🎬 Filmes</h1>
          <p className="max-w-2xl text-sm text-slate-400">
            As categorias aparecem em blocos separados, com rolagem horizontal e até 5 capas por linha.
          </p>
        </header>

        {/* Full width banner */}
        <div className="w-full px-0">
          <RotatingBanner items={bannerItems} title="Filmes em destaque" subtitle="As melhores capas do catálogo rotacionam automaticamente." />
        </div>

        <div className="space-y-8">
          {movieSections.map((section) => (
            <section key={section.category} className="space-y-3">
              <div className="flex items-end justify-between gap-4">
                <h2 className="text-lg font-semibold text-white">{section.category}</h2>
                <span className="text-sm text-slate-500">{section.items.length} títulos</span>
              </div>
              <ContentGrid items={section.items} />
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}