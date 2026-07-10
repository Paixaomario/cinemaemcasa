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
          const content = await getSectionContent(section)
          contents[section.id] = content
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
    return <div style={{ padding: '20px', color: '#fff' }}>Carregando...</div>
  }
 
  return (
    <div style={{ padding: '20px', color: '#fff', background: '#000', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '30px' }}>🎬 Cinema em Casa</h1>
 
      {sections.map((section) => (
        <div key={section.id} style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '15px', borderBottom: '2px solid #ff6b35', paddingBottom: '10px' }}>
            {section.titulo}
          </h2>
          <ContentGrid 
            items={sectionContents[section.id] || []}
            onItemClick={(item) => console.log('Clicou em:', item)}
          />
        </div>
      ))}
    </div>
  )
}