export default function Home() {
  return (
    <div style={{ padding: '20px', color: '#fff', background: '#000', minHeight: '100vh', fontFamily: 'Arial' }}>
      <h1 style={{ marginBottom: '20px' }}>🎬 Cinema em Casa</h1>
      
      <div style={{ background: '#333', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Teste de Carregamento</h2>
        <p>✅ Se você está vendo isto, page.tsx está funcionando!</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
        <div style={{ background: '#222', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ height: '200px', background: '#444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', borderRadius: '4px' }}>
            Teste 1
          </div>
          <p style={{ fontSize: '12px' }}>Card de Teste</p>
        </div>
        
        <div style={{ background: '#222', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ height: '200px', background: '#444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', borderRadius: '4px' }}>
            Teste 2
          </div>
          <p style={{ fontSize: '12px' }}>Card de Teste</p>
        </div>

        <div style={{ background: '#222', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ height: '200px', background: '#444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', borderRadius: '4px' }}>
            Teste 3
          </div>
          <p style={{ fontSize: '12px' }}>Card de Teste</p>
        </div>
      </div>
    </div>
  )
}
