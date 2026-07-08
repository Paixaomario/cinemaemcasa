import { getMovies, getSeries } from '@/lib/queries'

export default async function Home() {
  let movies = []
  let series = []
  let error = null

  try {
    const [moviesData, seriesData] = await Promise.all([
      getMovies(),
      getSeries()
    ])
    movies = moviesData || []
    series = seriesData || []
  } catch (err) {
    error = err instanceof Error ? err.message : 'Erro ao carregar dados'
    console.error('Erro:', error)
  }

  return (
    <div style={{ padding: '20px', color: '#fff', background: '#000', minHeight: '100vh' }}>
      <h1>Cinema em Casa</h1>
      
      {error && <div style={{ color: '#f00', marginBottom: '20px' }}>Erro: {error}</div>}
      
      <h2>Filmes ({movies.length})</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
        {movies.length > 0 ? (
          movies.map((m: any) => (
            <div key={m.id} style={{ background: '#333', padding: '10px', borderRadius: '8px' }}>
              {m.poster ? (
                <img src={m.poster} alt={m.titulo} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }} />
              ) : (
                <div style={{ height: '200px', background: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>Sem capa</div>
              )}
              <p style={{ fontSize: '12px', marginTop: '10px', color: '#ccc' }}>{m.titulo}</p>
            </div>
          ))
        ) : (
          <p>Nenhum filme encontrado</p>
        )}
      </div>

      <h2 style={{ marginTop: '30px' }}>Séries ({series.length})</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
        {series.length > 0 ? (
          series.map((s: any) => (
            <div key={s.id_n} style={{ background: '#333', padding: '10px', borderRadius: '8px' }}>
              {s.poster ? (
                <img src={s.poster} alt={s.titulo} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }} />
              ) : (
                <div style={{ height: '200px', background: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>Sem capa</div>
              )}
              <p style={{ fontSize: '12px', marginTop: '10px', color: '#ccc' }}>{s.titulo}</p>
            </div>
          ))
        ) : (
          <p>Nenhuma série encontrada</p>
        )}
      </div>
    </div>
  )
}
