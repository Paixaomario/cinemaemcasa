export const dynamic = 'force-dynamic'

import { Navbar } from '@/components/layout/Navbar'
import { CinemaGrid } from './CinemaGrid'

export default function FilmesPage() {
  return (
    <div className="min-h-screen" style={{ background: '#000' }}>
      <Navbar />
      <CinemaGrid />
    </div>
  )
}
