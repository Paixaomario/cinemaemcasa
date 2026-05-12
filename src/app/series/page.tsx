export const dynamic = 'force-dynamic'

import { Navbar } from '@/components/layout/Navbar'
import { HeroBanner } from '@/components/sections/HeroBanner'
import { ContentRow } from '@/components/sections/ContentRow'
import {
  buildBannerPool, getPopularShows, getTrendingShows,
  getTopRatedShows, getShowsByGenre,
} from '@/lib/tmdb'

export default async function SeriesPage() {
  try {
    const [bannerPool, popular, trending, topRated, action, comedy, drama, crime, scifi] = await Promise.all([
      buildBannerPool('tv', 20),
      getPopularShows(),
      getTrendingShows(),
      getTopRatedShows(),
      getShowsByGenre(10759),
      getShowsByGenre(35),
      getShowsByGenre(18),
      getShowsByGenre(80),
      getShowsByGenre(10765),
    ])

    const tag  = (items: any[]) => { items.forEach((s: any) => { s.media_type = 'tv' }); return items }
    const pick5 = (items: any[]) => {
      const arr = [...items]
      for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]] }
      return arr.slice(0, 5)
    }

    return (
      <div className="min-h-screen page-enter" style={{ background: '#000' }}>
        <Navbar />
        <HeroBanner type="tv" initialPool={bannerPool} />
        <div className="py-4">
          <ContentRow title="Séries Populares"      items={pick5(tag(popular.results  || []))} />
          <ContentRow title="Em Alta Esta Semana"   items={pick5(tag(trending.results || []))} />
          <ContentRow title="Mais Bem Avaliadas"    items={pick5(tag(topRated.results || []))} />
          <ContentRow title="Ação e Aventura"       items={pick5(tag(action.results   || []))} />
          <ContentRow title="Comédia"               items={pick5(tag(comedy.results   || []))} />
          <ContentRow title="Drama"                 items={pick5(tag(drama.results    || []))} />
          <ContentRow title="Crime"                 items={pick5(tag(crime.results    || []))} />
          <ContentRow title="Ficção Científica"     items={pick5(tag(scifi.results    || []))} />
        </div>
        <div className="h-10" />
      </div>
    )
  } catch {
    return (
      <div className="min-h-screen" style={{ background: '#000' }}>
        <Navbar />
        <div className="section-px py-20 text-center">
          <p className="text-lg text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            Carregando séries...
          </p>
        </div>
      </div>
    )
  }
}
