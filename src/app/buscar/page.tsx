'use client'
 
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { searchCatalog } from '@/lib/queries'
import { ContentGrid } from '@/components/ContentGrid'
 
export default function BuscarPage() {
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
    <div style={{ padding: '20px', color: '#fff', background: '#000', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '30px' }}>🔍 Pesquisar</h1>
 
      <form onSubmit={handleSearch} style={{ marginBottom: '30px' }}>
        <input
          type="text"
          placeholder="Buscar filmes, séries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            borderRadius: '4px',
            border: 'none',
            marginBottom: '10px'
          }}
        />
        <button
          type="submit"
          style={{
            padding: '12px 24px',
            background: '#ff6b35',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Buscar
        </button>
      </form>
 
      {loading && <p>Buscando...</p>}
 
      {!loading && query && (
        <>
          <p style={{ color: '#999', marginBottom: '20px' }}>
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