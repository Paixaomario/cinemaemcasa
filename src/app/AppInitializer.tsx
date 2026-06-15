'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { setupAppHealthMonitor } from '@/lib/appMemory'

export function AppInitializer() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setupAppHealthMonitor()
  }, [])

  useEffect(() => {
    // Requisito: Garantir que o sistema sempre inicie na Home ao carregar/recarregar
    if (pathname === '/') {
      router.replace('/home')
    }
  }, [pathname, router])

  return null
}