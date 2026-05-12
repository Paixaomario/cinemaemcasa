export const dynamic = 'force-dynamic'

import { Navbar } from '@/components/layout/Navbar'

export default function AoVivoPage() {
  return (
    <div className="min-h-screen" style={{ background: '#000' }}>
      <Navbar />
      <div className="section-px py-10 page-enter">
        <div className="mb-6 flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="live-ping absolute inline-flex h-full w-full rounded-full" style={{ background: '#e74c3c' }} />
            <span className="relative inline-flex h-3 w-3 rounded-full" style={{ background: '#e74c3c' }} />
          </span>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            Ao Vivo
          </h1>
        </div>
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <span style={{ fontSize: '64px' }}>📡</span>
          <p className="text-lg font-semibold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            Nenhuma transmissão ativa
          </p>
          <p className="text-sm" style={{ color: '#888', fontFamily: "'Open Sans', sans-serif" }}>
            As transmissões ao vivo aparecem aqui quando estiverem ativas
          </p>
        </div>
      </div>
    </div>
  )
}
