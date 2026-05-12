'use client'
export const dynamic = 'force-dynamic'

import Image from 'next/image'
import { Navbar } from '@/components/layout/Navbar'

export default function NotificacoesPage() {
  return (
    <div className="relative min-h-screen" style={{ background: '#000' }}>
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <Image src="/bg-family.jpg" alt="" fill className="object-cover" />
      </div>
      <div className="relative z-10">
        <Navbar />
        <div className="section-px py-10 page-enter">
          <h1 className="mb-6 text-2xl font-bold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            Notificações
          </h1>
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <span style={{ fontSize: 64 }}>🔔</span>
            <p className="text-lg font-semibold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
              Tudo em dia!
            </p>
            <p className="text-sm" style={{ color: '#888', fontFamily: "'Open Sans', sans-serif" }}>
              Nenhuma notificação no momento.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
