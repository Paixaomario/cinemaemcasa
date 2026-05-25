'use client'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { ContentCard } from '@/components/ui/ContentCard'
import { createClient } from '@supabase/supabase-js'

export default function BuscarPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    try {
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      
      // Buscar em todas as tabelas
      const [cinemaRes, seriesRes, contentRes] = await Promise.all([
        sb.from('cinema').select('*').ilike('titulo', `%${query}%`).limit(20),
        sb.from('series').select('*').ilike('titulo', `%${query}%`).limit(20),
        sb.from('content').select('*').ilike('titulo', `%${query}%`).limit(20)
      ])

      const allResults = [
        ...(cinemaRes.data || []).map((item: any) => ({ ...item, type: 'filme' })),
        ...(seriesRes.data || []).map((item: any) => ({ ...item, type: 'serie' })),
        ...(contentRes.data || []).map((item: any) => ({ ...item, type: item.tipo }))
      ]

      setResults(allResults)
    } catch (error) {
      console.error('Erro ao buscar:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-32 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter mb-8 text-center">
          Buscar
        </h1>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar filmes e séries..."
              className="w-full bg-white/10 border border-white/20 rounded-full px-6 py-4 text-white text-lg focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400 outline-none transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-cyan-500 hover:bg-cyan-400 text-black p-3 rounded-full transition-all"
            >
              <Search className="w-6 h-6" />
            </button>
          </div>
        </form>

        {loading && (
          <div className="text-center text-neutral-400 py-12">
            Buscando...
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {results.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
              />
            ))}
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <div className="text-center text-neutral-400 py-12">
            Nenhum resultado encontrado para "{query}"
          </div>
        )}
      </div>
    </div>
  )
}
