'use client'
import { Navbar } from '@/components/layout/Navbar'
import { HomeClient } from '@/app/HomeClient'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <HomeClient />
    </main>
  )
}
