'use client'

import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    console.log('[Home] 🚀 Teste básico - useEffect executou!')
  }, [])

  return (
    <div style={{ padding: '20px', color: '#fff', background: '#000', minHeight: '100vh' }}>
      <h1>Cinema em Casa - Teste</h1>
      <p>Abra F12 Console e procure por: [Home] 🚀</p>
    </div>
  )
}
