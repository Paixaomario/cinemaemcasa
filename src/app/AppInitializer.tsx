'use client'

import { useEffect } from 'react'
import { setupAppHealthMonitor } from '@/lib/appMemory'

export function AppInitializer() {
  useEffect(() => {
    setupAppHealthMonitor()
  }, [])

  return null
}