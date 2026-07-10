export const dynamic = 'force-dynamic'

import { Navbar } from '@/components/layout/Navbar'
import { HeroBanner } from '@/components/sections/HeroBanner'
import { CinemaGrid } from '@/app/filmes/CinemaGrid'

export default function SeriesPage() {
  return (
    <div className="min-h-screen" style={{ background: '#000' }}>
      <Navbar />
      <div style={{ marginBottom: '0px', position: 'relative', zIndex: 10 }}>
        <HeroBanner type="series" />
      </div>
      <CinemaGrid contentType="series" />
    </div>
  )
}