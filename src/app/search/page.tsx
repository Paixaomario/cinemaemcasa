import { Suspense } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { SearchResults } from './SearchResults'

export default function SearchPage() {
  return (
    <div className="min-h-screen page-enter" style={{ background: '#000' }}>
      <Navbar />
      <Suspense fallback={
        <div className="section-px py-8">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ aspectRatio: '2/3', borderRadius: '10px' }} />
            ))}
          </div>
        </div>
      }>
        <SearchResults />
      </Suspense>
    </div>
  )
}
