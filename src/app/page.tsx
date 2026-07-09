export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <div style={{ padding: '40px', color: '#fff', background: '#000', minHeight: '100vh', fontFamily: 'Arial, sans-serif', textAlign: 'center' }}>
      <h1 style={{ fontSize: '48px', marginBottom: '30px' }}>🎬 Cinema em Casa v2.0</h1>
      <p style={{ fontSize: '20px', marginBottom: '40px' }}>✅ Versão limpa - Sem cache</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px', maxWidth: '1200px', margin: '0 auto' }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} style={{ background: '#333', padding: '15px', borderRadius: '8px' }}>
            <div style={{ height: '200px', background: '#555', borderRadius: '4px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>Placeholder {i}</div>
            <p style={{ fontSize: '14px', color: '#ccc' }}>Filme {i}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
