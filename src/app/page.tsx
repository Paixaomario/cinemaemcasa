'use client'
import { Navbar } from '@/components/layout/Navbar'
import { HomeClient } from './HomeClient'

export default function Page() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <HomeClient />
    </main>
  )
}