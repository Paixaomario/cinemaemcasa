import { getMovieBannerItems, getMovies, getMovieCategories } from '@/lib/queries'
import { ContentGrid } from '@/components/ContentGrid'
import { RotatingBanner } from '@/components/RotatingBanner'

export default async function FilmesPage() {
  const [categories, banner] = await Promise.all([getMovieCategories(), getMovieBannerItems(undefined, 12)])
  const sections = await Promise.all(
    categories.map(async (category) => ({
      category,
      items: await getMovies(category, 50),
    }))
  )

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Full width banner */}
      <RotatingBanner items={banner} />

      <div className="mx-auto max-w-7xl space-y-10 px-6 py-10">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Catálogo</p>
          <h1 className="text-5xl font-bold sm:text-6xl lg:text-7xl text-white drop-shadow-lg">🎬 Filmes</h1>
          <p className="max-w-2xl text-lg text-slate-400">
            As categorias aparecem em blocos separados, com rolagem horizontal e até 5 capas por linha.
          </p>
        </header>

        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.category} className="space-y-3">
              <div className="flex items-end justify-between gap-4">
                <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl" style={{ color: '#2aa3d3', textShadow: '2px 2px 4px rgba(0,0,0,0.5), -1px -1px 2px rgba(255,255,255,0.3), 0 0 10px rgba(255,255,255,0.2)' }}>{section.category}</h2>
              </div>
              <ContentGrid items={section.items} />
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}