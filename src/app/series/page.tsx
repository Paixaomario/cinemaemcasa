export const dynamic = 'force-dynamic'

import { Navbar } from '@/components/layout/Navbar'
import { CinemaGrid } from '../filmes/CinemaGrid'

export default function SeriesPage() {
    return (
      <div className="min-h-screen page-enter" style={{ background: '#000' }}>
        <Navbar />
        <CinemaGrid />
      </div>
    );
}
