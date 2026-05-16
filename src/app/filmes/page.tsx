export const dynamic = 'force-dynamic'

import { Navbar } from '@/components/layout/Navbar'
import { HeroBanner } from '@/components/sections/HeroBanner'
import { CinemaGrid } from './CinemaGrid'

export default function FilmesPage() {
  return (
    <div className="min-h-screen" style={{ background: '#000' }}>
      <Navbar />
      <div style={{ marginBottom: '35px', position: 'relative', zIndex: 10 }}>
        <HeroBanner type="movie" /> {/* Banner específico para filmes */}
      </div>
      <CinemaGrid contentType="movie" />
    </div>
  )
}
