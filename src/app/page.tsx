import type { Metadata } from 'next'
import { getHomeBannerItems, getHomeSections, getSectionContent, getContinueWatchingList } from '@/lib/queries'
import { ContentGrid } from '@/components/ContentGrid'
import { RotatingBanner } from '@/components/RotatingBanner'

export const metadata: Metadata = {
  title: 'PaixãoFlix - Cinema em Casa',
  description: 'Sua plataforma de streaming premium',
}

export default async function HomePage() {
  const [sections, bannerItems, continueWatchingItems] = await Promise.all([
    getHomeSections(),
    getHomeBannerItems(20),
    getContinueWatchingList(),
  ])

  const sectionContents: Record<string, any[]> = {}
  const usedIds = new Set<string>()

  // Adiciona os IDs dos itens do banner aos 'usedIds' para não repeti-los nas seções abaixo
  bannerItems.forEach((item: any) => usedIds.add(String(item.id ?? item.id_n)))

  // Adiciona também os itens de "Continuar Assistindo" para não repeti-los
  continueWatchingItems.forEach((item: any) => usedIds.add(String(item.content_id)))

  for (const section of sections) {
    sectionContents[section.id] = await getSectionContent(section, usedIds)
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Banner rotativo com filmes e séries */}
      <RotatingBanner items={bannerItems} />
      <div className="-mt-16 space-y-8 px-4 pt-16 pb-8 md:-mt-24 md:space-y-12 md:px-16 md:pt-24 md:pb-12">
        {continueWatchingItems.length > 0 && (
          <section className="space-y-3">
            <h2
              className="text-3xl font-bold sm:text-4xl lg:text-5xl"
              style={{ color: '#2aa3d3', textShadow: '2px 2px 4px rgba(0,0,0,0.5), -1px -1px 2px rgba(255,255,255,0.3), 0 0 10px rgba(255,255,255,0.2)' }}
            >
              Continuar Assistindo
            </h2>
            <ContentGrid
              items={continueWatchingItems.map(item => ({ ...item, id: item.content_id }))}
              isContinueWatching
            />
          </section>
        )}
        {sections.map((section) => (
          <section key={section.id} className="space-y-3">
            <h2
              className="text-3xl font-bold sm:text-4xl lg:text-5xl"
              style={{ color: '#2aa3d3', textShadow: '2px 2px 4px rgba(0,0,0,0.5), -1px -1px 2px rgba(255,255,255,0.3), 0 0 10px rgba(255,255,255,0.2)' }}
            >
              {section.titulo}
            </h2>
            <ContentGrid items={sectionContents[section.id] || []} />
          </section>
        ))}
      </div>
    </main>
  )
}
