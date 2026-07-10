export const dynamic = 'force-dynamic'

export default function Home() {
  // Dados FAKE para testar renderização
  const mockMovies = [
    { id: 1, titulo: 'Filme Teste 1', poster: 'https://via.placeholder.com/150x200?text=Filme+1' },
    { id: 2, titulo: 'Filme Teste 2', poster: 'https://via.placeholder.com/150x200?text=Filme+2' },
    { id: 3, titulo: 'Filme Teste 3', poster: 'https://via.placeholder.com/150x200?text=Filme+3' },
  ]

  return (
    <div style={{ padding: '20px', color: '#fff', background: '#000', minHeight: '100vh' }}>
      <h1>🎬 Cinema em Casa - TESTE COM DADOS FAKE</h1>
      <p style={{ color: '#0f0' }}>Se você vê as 3 imagens abaixo = página funciona, problema é Supabase</p>
      
      <h2>Filmes Teste ({mockMovies.length})</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
        {mockMovies.map((m) => (
          <div key={m.id} style={{ background: '#333', padding: '10px', borderRadius: '8px' }}>
            <img src={m.poster} alt={m.titulo} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }} />
            <p style={{ fontSize: '12px', marginTop: '10px' }}>{m.titulo}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
