'use client'

import { useAuth } from '@/components/layout/SupabaseProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ModoCinemaPage() {
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
        <div style={{ fontSize: 'clamp(48px, 10vw, 80px)', marginBottom: '20px' }}>🎬</div>
        <h1 style={{ fontSize: 'clamp(24px, 5vw, 36px)', marginBottom: '15px', fontWeight: 'bold' }}>
          Modo Cinema
        </h1>
        <p style={{ fontSize: 'clamp(14px, 2vw, 16px)', color: '#aaa', marginBottom: '30px' }}>
          Nenhum filme está sendo exibido em modo cinema
        </p>
        <p style={{ fontSize: 'clamp(12px, 1.8vw, 14px)', color: '#888' }}>
          Selecione um filme e ative o modo cinema para uma experiência imersiva
        </p>
      </div>
    </main>
  )
}
