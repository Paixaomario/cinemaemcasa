'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { HomeClient } from './HomeClient'

export default function Page() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar se é a primeira visita (apenas no cliente)
    const hasVisited = localStorage.getItem('has_visited_before')
    if (!hasVisited) {
      // Redirecionar para página de loading
      router.replace('/loading')
    } else {
      setIsLoading(false)
    }
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <HomeClient />
    </main>
  )
}