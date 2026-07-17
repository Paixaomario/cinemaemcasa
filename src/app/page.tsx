import type { Metadata } from 'next'
import Link from 'next/link'
import { getHomeBannerItems, getHomeSections, getSectionContent } from '@/lib/queries'
import { ContentGrid } from '@/components/ContentGrid'
import { RotatingBanner } from '@/components/RotatingBanner'

export const metadata: Metadata = {
  title: 'PaixãoFlix - Cinema em Casa',
  description: 'Sua plataforma de streaming premium',
}

function getItemId(item: any) {
  return item?.id ?? item?.id_n
}

export default async function HomePage() {
  const sections = await getHomeSections()
  const bannerItems = await getHomeBannerItems(12)
  const sectionContents: Record<string, any[]> = {}
  const usedIds = new Set<string>()

  for (const section of sections) {
    sectionContents[section.id] = await getSectionContent(section, usedIds)
  }

  const heroSection = sections[0]
  const heroItem = heroSection ? sectionContents[heroSection.id]?.[0] : null
  const heroPoster = heroItem?.poster || heroItem?.capa || heroItem?.banner
  const heroHref = heroItem ? `/detalhes/${getItemId(heroItem)}` : undefined

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Full width rotating banner */}
      <RotatingBanner items={bannerItems} title={heroItem?.titulo || 'Em destaque'} subtitle={heroItem ? `${heroItem.year ?? heroItem.ano ?? 'N/A'} • ⭐ ${heroItem.rating ?? 'N/A'}` : 'Conteúdo em destaque no catálogo.'} />

      <div className="mx-auto max-w-7xl space-y-10 px-6 py-8">
        {sections.map((section) => (
          <section key={section.id} className="space-y-3">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold break-words whitespace-normal text-white drop-shadow-lg sm:text-4xl lg:text-5xl">{section.titulo}</h2>
                {section.subtitulo ? <p className="mt-2 text-lg break-words whitespace-normal text-slate-400">{section.subtitulo}</p> : null}
              </div>
            </div>
            <ContentGrid items={sectionContents[section.id] || []} />
          </section>
        ))}
      </div>
    </main>
  )
}
