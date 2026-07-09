'use client'

console.log('[IMMEDIATE] 🚀 Page.tsx carregado!')

import { useEffect } from 'react'

export default function Home() {
  console.log('[RENDER] Page renderizando...')
  
  useEffect(() => {
    console.log('[HOME] 🚀 useEffect executou!')
  }, [])

  return (
    <div style={{ padding: '20px', color: '#fff', background: '#000' }}>
      <h1>Cinema em Casa</h1>
      <p>Verifique console por [IMMEDIATE], [RENDER], ou [HOME]</p>
    </div>
  )
}
