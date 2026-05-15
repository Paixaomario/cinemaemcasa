export const dynamic = 'force-dynamic'

import { Navbar } from '@/components/layout/Navbar'
import { CinemaGrid } from '../filmes/CinemaGrid'
import { HeroBanner } from '@/components/sections/HeroBanner'

export default function SeriesPage() {
    return (
      <div className="min-h-screen page-enter" style={{ background: '#000' }}>
        <Navbar />
        <HeroBanner type="tv" /> {/* Banner específico para séries */}
        <CinemaGrid contentType="series" />
      </div>
    );
}
