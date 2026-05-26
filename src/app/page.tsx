'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { HomeClient } from './HomeClient'

export default function Page() {
  const router = useRouter()

  useEffect(() => {
    // Verificar se é a primeira visita
    const hasVisited = localStorage.getItem('has_visited_before')
    if (!hasVisited) {
      // Redirecionar para página de loading
      router.replace('/loading')
    }
  }, [router])

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <HomeClient />
    </main>
  )
}