import type { Metadata } from 'next'
import { getHomeBannerItems, getHomeSections, getSectionContent } from '@/lib/queries'
import { ContentGrid } from '@/components/ContentGrid'
import { HeroBanner } from '@/components/HeroBanner' // Importar o novo componente

export const metadata: Metadata = {
  title: 'PaixãoFlix - Cinema em Casa',
  description: 'Sua plataforma de streaming premium',
}

export default async function HomePage() {
  const sections = await getHomeSections()
  const bannerItems = await getHomeBannerItems(12)
  const sectionContents: Record<string, any[]> = {}
  const usedIds = new Set<string>()

  // O primeiro item do banner será nosso herói
  const heroItem = bannerItems.length > 0 ? bannerItems[0] : null

  // Adiciona o ID do herói aos IDs já usados para evitar repetição na primeira prateleira
  if (heroItem) {
    usedIds.add(heroItem.id)
  }

  for (const section of sections) {
    sectionContents[section.id] = await getSectionContent(section, usedIds)
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-black text-white">
      {/* Hero Banner no estilo Netflix */}
      <HeroBanner item={heroItem} />
      <div className="-mt-16 space-y-4 px-4 pt-16 pb-8 md:-mt-24 md:space-y-8 md:px-16 md:pt-24 md:pb-12">
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
