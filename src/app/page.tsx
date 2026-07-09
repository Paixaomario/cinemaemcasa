'use client'

import { useEffect, useState } from 'react'
import { getMovies, getSeries } from '@/lib/queries'

export default function Home() {
  const [movies, setMovies] = useState<any[]>([])
  const [series, setSeries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('[Home] 🚀 Iniciando carregamento de dados...')
        const moviesData = await getMovies()
        console.log('[Home] ✅ Filmes:', moviesData?.length || 0)
        const seriesData = await getSeries()
        console.log('[Home] ✅ Séries:', seriesData?.length || 0)
        setMovies(moviesData || [])
        setSeries(seriesData || [])
      } catch (err: any) {
        console.error('[Home] ❌ Erro:', err.message)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div style={{ padding: '20px', color: '#fff', background: '#000', minHeight: '100vh' }}>
      <h1>Cinema em Casa</h1>
      {error && <p style={{ color: '#f00' }}>❌ {error}</p>}
      {loading && <p>⏳ Carregando...</p>}
      <h2>Filmes ({movies.length})</h2>
      {movies.length === 0 ? <p>❌ Nenhum filme. Abra F12 Console!</p> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>{movies.map((m: any) => <div key={m.id} style={{ background: '#333', padding: '10px' }}>{m.poster ? <img src={m.poster} alt={m.titulo} style={{ width: '100%', height: '200px', objectFit: 'cover' }} /> : <div style={{ height: '200px', background: '#555' }}>Sem capa</div>}<p style={{ fontSize: '12px', marginTop: '10px' }}>{m.titulo}</p></div>)}</div>}
      <h2 style={{ marginTop: '30px' }}>Séries ({series.length})</h2>
      {series.length === 0 ? <p>❌ Nenhuma série. Abra F12 Console!</p> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>{series.map((s: any) => <div key={s.id_n} style={{ background: '#333', padding: '10px' }}>{s.poster ? <img src={s.poster} alt={s.titulo} style={{ width: '100%', height: '200px', objectFit: 'cover' }} /> : <div style={{ height: '200px', background: '#555' }}>Sem capa</div>}<p style={{ fontSize: '12px', marginTop: '10px' }}>{s.titulo}</p></div>)}</div>}
    </div>
  )
}
