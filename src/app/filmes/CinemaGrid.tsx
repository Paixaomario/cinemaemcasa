'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ContentRow } from '@/components/sections/ContentRow'

const APP_CATEGORIES = [
  'Lançamento 2026',
  'Lançamento 2025',
  'Animação',
  'Comédia',
  'Ação',
  'Aventura',
  'Dorama',
  'Negritude',
  'Finanças',
  'Infantil',
  'Clássicos',
  'Crime',
  'Anime',
  'Romance',
  'Religioso',
  'Nacional',
  'Documentários',
  'Drama',
  'Família',
  'Musical',
  'Faroeste',
  'Ficção',
  'Policial',
  'Suspense',
  'Terror',
  'Adulto',
]

export function CinemaGrid({ contentType }: { contentType: 'movie' | 'series' }) {
  const [groupedData, setGroupedData] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const sb = createClient()
      const table = contentType === 'movie' ? 'cinema' : 'series'
      // Fallback para id_n caso a tabela de séries não tenha created_at ainda
      const orderField = contentType === 'movie' ? 'created_at' : 'id_n'
      
      const { data: items, error } = await sb
        .from(table)
        .select('*')
        .order(orderField, { ascending: false })

      if (!error && items) {
        const grouped: Record<string, any[]> = {}
        
        APP_CATEGORIES.forEach(cat => {
          const matches = items.filter(item => {
            // Tabela cinema usa 'category', tabela series usa 'genero'
            const itemCategory = (contentType === 'movie' ? item.category : item.genero) || ''
            // Divide a string de categorias por vírgula e remove espaços extras para comparar
            const categoriesArray = itemCategory.split(',').map((c: string) => c.trim())
            return categoriesArray.includes(cat)
          })
          if (matches.length > 0) {
            grouped[cat] = matches
          }
        })
        
        setGroupedData(grouped)
      }
      setLoading(false)
    }

    fetchData()
  }, [contentType])

  if (loading) {
    return (
      <div className="space-y-12 px-6 md:px-16">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-6">
            <div className="h-10 w-64 bg-white/5 animate-pulse rounded-lg" />
            <div className="flex gap-8 overflow-hidden">
              {[1, 2, 3, 4].map(j => (
                <div key={j} className="aspect-[2/3] w-[300px] flex-shrink-0 bg-white/5 animate-pulse rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-20">
      {APP_CATEGORIES.map(cat => {
        const items = groupedData[cat]
        if (!items) return null
        
        return (
          <ContentRow 
            key={cat} 
            title={cat} 
            items={items} 
          />
        )
      })}
    </div>
  )
}
