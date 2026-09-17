'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { searchCatalog } from '@/lib/queries'
import { ContentGrid } from '@/components/ContentGrid'

export const dynamic = 'force-dynamic'

function BuscarContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''

  const [results, setResults] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState(query)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query) {
      const search = async () => {
        setLoading(true)
        try {
          const searchResults = await searchCatalog(query)
          setResults(searchResults)
        } catch (error) {
          console.error('Erro ao buscar:', error)
        } finally {
          setLoading(false)
        }
      }

      search()
    }
  }, [query])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const url = new URL(window.location.href)
      url.searchParams.set('q', searchQuery)
      window.history.pushState({}, '', url)
      setSearchQuery('')
    }
  }

  return (
    <div className="min-h-screen bg-black px-6 py-10 text-white">
      <h1 className="mb-8 text-3xl font-semibold">🔍 Pesquisar</h1>

      <form onSubmit={handleSearch} className="mb-8 space-y-4">
        <input
          type="text"
          placeholder="Buscar filmes, séries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-white outline-none focus:border-white"
        />
        <button
          type="submit"
          className="rounded-2xl bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600"
        >
          Buscar
        </button>
      </form>

      {loading && <p>Buscando...</p>}

      {!loading && query && (
        <>
          <p className="mb-5 text-slate-400">
            {results.length} resultado(s) para "{query}"
          </p>
          {results.length > 0 ? (
            <ContentGrid
              items={results}
              onItemClick={(item) => console.log('Item clicado:', item)}
            />
          ) : (
            <p>Nenhum resultado encontrado.</p>
          )}
        </>
      )}
    </div>
  )
}

export default function BuscarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black px-6 py-10 text-white">Carregando...</div>}>
      <BuscarContent />
    </Suspense>
  )
}
