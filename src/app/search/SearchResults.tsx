'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ContentCard } from '@/components/ui/ContentCard'
import { searchMulti } from '@/lib/tmdb'

export function SearchResults() {
  const params = useSearchParams()
  const q = params.get('q') || ''
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!q.trim()) return
    setLoading(true)
    searchMulti(q).then(data => {
      const filtered = (data.results || []).filter(
        (item: any) => item.media_type === 'movie' || item.media_type === 'tv'
      )
      setResults(filtered)
      setLoading(false)
    })
  }, [q])

  if (!q) return (
    <div className="flex flex-col items-center gap-3 py-24 text-center section-px">
      <span style={{ fontSize: '64px' }}>🔍</span>
      <p className="text-lg font-semibold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
        Busque filmes e séries
      </p>
    </div>
  )

  return (
    <div className="section-px py-8">
      <h1 className="mb-6 text-xl font-bold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
        {loading ? 'Buscando...' : `Resultados para "${q}" — ${results.length} título${results.length !== 1 ? 's' : ''}`}
      </h1>
      {loading && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: '2/3', borderRadius: '10px' }} />
          ))}
        </div>
      )}
      {!loading && results.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
          {results.map((item: any) => (
            <ContentCard key={`${item.media_type}-${item.id}`} item={item} />
          ))}
        </div>
      )}
      {!loading && results.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <span style={{ fontSize: '64px' }}>😕</span>
          <p className="text-lg font-semibold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            Nenhum resultado encontrado
          </p>
          <p className="text-sm" style={{ color: '#888', fontFamily: "'Open Sans', sans-serif" }}>
            Tente outro título
          </p>
        </div>
      )}
    </div>
  )
}
