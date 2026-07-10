'use client'
 
import { useEffect, useState } from 'react'
import { getSeries, getSeriesCategories } from '@/lib/queries'
import { ContentGrid } from '@/components/ContentGrid'
import { CategoryFilter } from '@/components/CategoryFilter'
 
const DEFAULT_CATEGORIES = [
  'Animação', 'Comédia', 'Ação', 'Aventura', 'Dorama', 'Negritude', 
  'Finanças', 'Infantil', 'Clássicos', 'Crime', 'Anime', 'Romance', 
  'Religioso', 'Nacional', 'Documentários', 'Drama', 'Família', 'Musical', 
  'Faroeste', 'Ficção', 'Policial', 'Suspense', 'Terror', 'Adulto'
]
 
export default function SeriesPage() {
  const [series, setSeries] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
 
  useEffect(() => {
    const loadSeries = async () => {
      try {
        const seriesData = await getSeries(selectedCategory || undefined)
        setSeries(seriesData)
      } catch (error) {
        console.error('Erro ao carregar séries:', error)
      } finally {
        setLoading(false)
      }
    }
 
    loadSeries()
  }, [selectedCategory])
 
  if (loading) {
    return <div style={{ padding: '20px', color: '#fff' }}>Carregando séries...</div>
  }
 
  return (
    <div style={{ padding: '20px', color: '#fff', background: '#000', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '30px' }}>📺 Séries</h1>
      
      <CategoryFilter 
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />
 
      <p style={{ color: '#999', marginBottom: '20px' }}>
        {series.length} série(s) encontrada(s)
      </p>
 
      <ContentGrid 
        items={series}
        onItemClick={(item) => console.log('Série clicada:', item)}
      />
    </div>
  )
}