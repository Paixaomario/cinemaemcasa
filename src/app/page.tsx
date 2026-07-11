'use client'

import { useEffect, useState } from 'react'
import { getHomeSections, getSectionContent } from '@/lib/queries'
import { ContentGrid } from '@/components/ContentGrid'

export default function Home() {
  const [sections, setSections] = useState<any[]>([])
  const [sectionContents, setSectionContents] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadHome = async () => {
      try {
        const sectionsData = await getHomeSections()
        setSections(sectionsData)

        const contents: Record<string, any[]> = {}
        for (const section of sectionsData) {
          contents[section.id] = await getSectionContent(section)
        }
        setSectionContents(contents)
      } catch (error) {
        console.error('Erro ao carregar home:', error)
      } finally {
        setLoading(false)
      }
    }

    loadHome()
  }, [])

  if (loading) {
    return <div className="min-h-screen bg-black px-6 py-10 text-white">Carregando...</div>
  }

  const heroItem = sections.length ? sectionContents[sections[0].id]?.[0] : null

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="border-b border-slate-800 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_32%)] px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Streaming em casa</p>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">Cinema em Casa</h1>
              <p className="max-w-2xl text-slate-300">
                Descubra filmes e séries organizados por seção, com visual horizontal e navegação de estilo Netflix.
              </p>
            </div>

            {heroItem ? (
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/90 p-6 shadow-2xl backdrop-blur-xl">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Destaque</p>
                <h2 className="mt-4 text-2xl font-semibold text-white">{heroItem.titulo || 'Sem título'}</h2>
                <div className="mt-4 space-y-2 text-sm text-slate-300">
                  <div>⭐ {heroItem.rating ?? 'N/A'}</div>
                  <div>{heroItem.year ?? heroItem.ano ?? 'N/A'}</div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-10 px-6 py-10">
        {sections.map((section) => (
          <section key={section.id} className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-white">{section.titulo}</h2>
              {section.subtitulo ? <p className="mt-2 text-sm text-slate-400">{section.subtitulo}</p> : null}
            </div>
            <ContentGrid
              items={sectionContents[section.id] || []}
              onItemClick={(item) => console.log('Clicou em:', item)}
            />
          </section>
        ))}
      </div>
    </main>
  )
}
