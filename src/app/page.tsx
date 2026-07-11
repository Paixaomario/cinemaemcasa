import type { Metadata } from 'next'
import Link from 'next/link'
import { getHomeSections, getSectionContent } from '@/lib/queries'
import { ContentGrid } from '@/components/ContentGrid'

export const metadata: Metadata = {
  title: 'PaixãoFlix - Cinema em Casa',
  description: 'Sua plataforma de streaming premium',
}

function getItemId(item: any) {
  return item?.id ?? item?.id_n
}

export default async function HomePage() {
  const sections = await getHomeSections()
  const sectionContents: Record<string, any[]> = {}

  for (const section of sections) {
    sectionContents[section.id] = await getSectionContent(section)
  }

  const heroSection = sections[0]
  const heroItem = heroSection ? sectionContents[heroSection.id]?.[0] : null
  const heroPoster = heroItem?.poster || heroItem?.capa || heroItem?.banner
  const heroHref = heroItem ? `/detalhes/${getItemId(heroItem)}` : undefined

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="border-b border-slate-800 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_32%)] px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Streaming em casa</p>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl break-words whitespace-normal">
                Cinema em Casa
              </h1>
              <p className="max-w-2xl text-slate-300">
                Descubra filmes e séries organizados em seções horizontais, com navegação fluida e foco pronto para TV.
              </p>
            </div>

            {heroItem ? (
              <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/90 p-6 shadow-2xl backdrop-blur-xl">
                {heroPoster ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-40"
                    style={{ backgroundImage: `url(${heroPoster})` }}
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-900/40" />
                <div className="relative space-y-4">
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Destaque</p>
                  <h2 className="text-2xl font-semibold text-white break-words whitespace-normal">
                    {heroItem.titulo || 'Sem título'}
                  </h2>
                  <div className="space-y-2 text-sm text-slate-300">
                    <div>⭐ {heroItem.rating ?? 'N/A'}</div>
                    <div>{heroItem.year ?? heroItem.ano ?? 'N/A'}</div>
                  </div>
                  {heroHref ? (
                    <Link
                      href={heroHref}
                      className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                    >
                      Ver detalhes
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-12 px-6 py-10">
        {sections.map((section) => (
          <section key={section.id} className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-white break-words whitespace-normal">{section.titulo}</h2>
              {section.subtitulo ? <p className="mt-2 text-sm text-slate-400 break-words whitespace-normal">{section.subtitulo}</p> : null}
            </div>
            <ContentGrid
              items={sectionContents[section.id] || []}
            />
          </section>
        ))}
      </div>
    </main>
  )
}
