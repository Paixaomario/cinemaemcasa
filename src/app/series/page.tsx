'use client'
 
import { useEffect, useState } from 'react'
import { getSeries, getSeriesCategories } from '@/lib/queries'
import { ContentGrid } from '@/components/ContentGrid'

export default function SeriesPage() {
  const [series, setSeries] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const cats = await getSeriesCategories()
        setCategories(cats)

        const list = await getSeries(selectedCategory || undefined)
        setSeries(list)
      } catch (err) {
        console.error('Erro ao carregar séries:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [selectedCategory])

  if (loading) return <div className="min-h-screen bg-black px-6 py-10 text-white">Carregando séries...</div>

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="mx-auto max-w-7xl grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="hidden flex-col gap-2 lg:flex">
          <h2 className="text-sm font-semibold text-slate-300">Categorias</h2>
          <div className="flex flex-col gap-2">
            <button onClick={() => setSelectedCategory(null)} className={`text-left rounded-md px-3 py-2 ${selectedCategory===null? 'bg-amber-500 text-slate-900':'bg-slate-900 text-slate-300'}`}>
              Todas
            </button>
            {categories.map((cat) => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`text-left rounded-md px-3 py-2 ${selectedCategory===cat? 'bg-amber-500 text-slate-900':'bg-slate-900 text-slate-300'}`}>
                {cat}
              </button>
            ))}
          </div>
        </aside>

        <section>
          <h1 className="mb-4 text-3xl font-semibold">📺 Séries</h1>
          <div className="mb-6 lg:hidden">
            <label className="mb-2 block text-sm text-slate-300">Filtrar por categoria</label>
            <select value={selectedCategory ?? ''} onChange={(e) => setSelectedCategory(e.target.value || null)} className="w-full rounded-xl bg-slate-900 px-3 py-2 text-white">
              <option value="">Todas</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <p className="mb-4 text-slate-400">{series.length} série(s) encontrada(s)</p>

          <ContentGrid items={series} onItemClick={(it) => console.log('Série:', it)} />
        </section>
      </div>
    </main>
  )
}