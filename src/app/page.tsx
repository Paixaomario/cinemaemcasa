'use client'

import { useEffect, useState } from 'react'
import { getMovies, getSeries } from '@/lib/queries'

export default function Home() {
  const [movies, setMovies] = useState<any[]>([])
  const [series, setSeries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [moviesData, seriesData] = await Promise.all([
          getMovies(),
          getSeries()
        ])
        setMovies(moviesData || [])
        setSeries(seriesData || [])
      } catch (error) {
        console.error('Erro:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) return <div style={{ padding: '20px', color: '#fff' }}>Carregando...</div>

  return (
    <div style={{ padding: '20px', color: '#fff', background: '#000', minHeight: '100vh' }}>
      <h1>Cinema em Casa</h1>
      
      <h2>Filmes ({movies.length})</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
        {movies.map((m) => (
          <div key={m.id} style={{ background: '#333', padding: '10px', borderRadius: '8px' }}>
            {m.poster ? (
              <img src={m.poster} alt={m.titulo} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }} />
            ) : (
              <div style={{ height: '200px', background: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>Sem capa</div>
            )}
            <p style={{ fontSize: '12px', marginTop: '10px', color: '#ccc' }}>{m.titulo}</p>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: '30px' }}>Séries ({series.length})</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
        {series.map((s) => (
          <div key={s.id_n} style={{ background: '#333', padding: '10px', borderRadius: '8px' }}>
            {s.poster ? (
              <img src={s.poster} alt={s.titulo} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }} />
            ) : (
              <div style={{ height: '200px', background: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>Sem capa</div>
            )}
            <p style={{ fontSize: '12px', marginTop: '10px', color: '#ccc' }}>{s.titulo}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
