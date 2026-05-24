export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { HeroBanner } from '@/components/sections/HeroBanner'
import { CinemaGrid } from './CinemaGrid'

export default function FilmesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <div className="min-h-screen" style={{ background: '#000' }}>
        <Navbar />
        <div style={{ marginBottom: '0px', position: 'relative', zIndex: 10 }}>
          <HeroBanner type="movie" /> {/* Banner específico para filmes */}
        </div>
        <CinemaGrid contentType="movie" />
      </div>
    </Suspense>
  )
}
