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
      <section className="border-b border-slate-800 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_32%)] px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-start">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Streaming em casa</p>
              <h1 className="text-4xl font-semibold leading-tight break-words whitespace-normal sm:text-5xl">
                Cinema em Casa
              </h1>
              <p className="max-w-2xl text-slate-300">
                Descubra filmes e séries organizados em categorias com rolagem horizontal, sem repetir títulos entre as seções.
              </p>
            </div>

            <RotatingBanner items={bannerItems} title={heroItem?.titulo || 'Em destaque'} subtitle={heroItem ? `${heroItem.year ?? heroItem.ano ?? 'N/A'} • ⭐ ${heroItem.rating ?? 'N/A'}` : 'Conteúdo em destaque no catálogo.'} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-10 px-6 py-8">
        {sections.map((section) => (
          <section key={section.id} className="space-y-3">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold break-words whitespace-normal text-white">{section.titulo}</h2>
                {section.subtitulo ? <p className="mt-2 text-sm break-words whitespace-normal text-slate-400">{section.subtitulo}</p> : null}
              </div>
              <span className="text-sm text-slate-500">5 títulos</span>
            </div>
            <ContentGrid items={sectionContents[section.id] || []} />
          </section>
        ))}
      </div>
    </main>
  )
}
