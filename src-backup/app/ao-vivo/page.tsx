'use client'

import { Navbar } from '@/components/layout/Navbar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'

export default function AoVivoPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="pt-40 flex flex-col items-center justify-center p-6 text-center">
        <span className="text-8xl mb-6">📡</span>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">Canais Ao Vivo</h1>
        <p className="text-neutral-500 max-w-md font-medium">Estamos preparando a melhor grade de programação para você. Volte em breve!</p>
      </div>
      <MobileBottomNav />
    </main>
  )
}