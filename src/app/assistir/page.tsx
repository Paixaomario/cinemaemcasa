'use client'

import { useAuth } from '@/components/layout/SupabaseProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AssistirDespoisPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !user) {
      router.push('/login')
    }
  }, [user, mounted, router])

  if (!mounted) return null

  return (
    <main style={{
      marginTop: 'clamp(100px, 15vh, 150px)',
      padding: 'clamp(20px, 4vw, 40px)',
      minHeight: '70vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        textAlign: 'center',
        color: '#fff',
      }}>
        <div style={{ fontSize: 'clamp(48px, 10vw, 80px)', marginBottom: '20px' }}>🕒</div>
        <h1 style={{ fontSize: 'clamp(24px, 5vw, 36px)', marginBottom: '15px', fontWeight: 'bold' }}>
          Assistir Depois
        </h1>
        <p style={{ fontSize: 'clamp(14px, 2vw, 16px)', color: '#aaa', marginBottom: '30px' }}>
          Nenhum filme ou série adicionado para assistir depois
        </p>
        <p style={{ fontSize: 'clamp(12px, 1.8vw, 14px)', color: '#888' }}>
          Encontre conteúdo interessante e clique em "Assistir Depois" para salvá-lo aqui
        </p>
      </div>
    </main>
  )
}
