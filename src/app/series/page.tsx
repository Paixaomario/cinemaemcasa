'use client'
 
import { useEffect, useState } from 'react'
import { getSeries, getSeriesBannerItems, getSeriesCategories } from '@/lib/queries'
import { ContentGrid } from '@/components/ContentGrid'
import { RotatingBanner } from '@/components/RotatingBanner'

export default function SeriesPage() {
  const [seriesSections, setSeriesSections] = useState<Array<{ category: string; items: any[] }>>([])
  const [bannerItems, setBannerItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [categories, banner] = await Promise.all([getSeriesCategories(), getSeriesBannerItems(undefined, 12)])
        setBannerItems(banner)
        const sections = await Promise.all(
          categories.map(async (category) => ({
            category,
            items: await getSeries(category, 5),
          }))
        )

        setSeriesSections(sections)
      } catch (err) {
        console.error('Erro ao carregar séries:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return <div className="min-h-screen bg-black px-6 py-10 text-white">Carregando séries...</div>
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Full width banner */}
      <RotatingBanner items={bannerItems} title="Séries em destaque" subtitle="O catálogo de séries gira automaticamente sem repetição." />

      <div className="mx-auto max-w-7xl space-y-10 px-6 py-10">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Catálogo</p>
          <h1 className="text-5xl font-bold sm:text-6xl lg:text-7xl text-white drop-shadow-lg">📺 Séries</h1>
          <p className="max-w-2xl text-lg text-slate-400">
            As categorias aparecem em blocos separados, com rolagem horizontal e sem menus laterais.
          </p>
        </header>

        <div className="space-y-8">
          {seriesSections.map((section) => (
            <section key={section.category} className="space-y-3">
              <div className="flex items-end justify-between gap-4">
                <h2 className="text-3xl font-bold text-white drop-shadow-lg sm:text-4xl lg:text-5xl">{section.category}</h2>
              </div>
              <ContentGrid items={section.items} />
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}