'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/layout/SupabaseProvider'
import { HeroBanner } from '@/components/sections/HeroBanner'
import { ContentRow } from '@/components/sections/ContentRow'
import { ContentCard } from '@/components/ui/ContentCard'

interface HomeSection {
  id: string
  titulo: string
  categorias: string[]
  fonte: 'cinema' | 'tmdb'
  tmdb_endpoint: string | null
  layout: 'row' | 'grid' | 'featured'
  limite: number
  ordenacao: string
  posicao: number
  ativo: boolean
  hora_inicio: string | null
  hora_fim: string | null
  data_inicio: string | null
  data_fim: string | null
}

export interface CinemaItem {
  id: string;
  id_n?: number | string;
  titulo: string;
  poster: string | null;
  backdrop: string | null;
  type: 'movie' | 'serie' | 'series' | 'tv' | null;
  year?: number | string | null;
}

export function HomeClient() {
  const { user } = useAuth()
  const [sections, setSections] = useState<HomeSection[]>([])
  const [sectionsData, setSectionsData] = useState<Record<string, any[]>>({})
  const [continueWatching, setContinueWatching] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadHome() {
      const sb = createClient()

      // 0. Carregar Continuar Assistindo se houver usuário
      if (user) {
        console.log('Carregando continuar assistindo para usuário:', user.id);
        const { data: prog, error: progError } = await sb
          .from('view_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_finished', false)
          .order('updated_at', { ascending: false })
          .limit(12)

        console.log('Dados de progresso:', prog, 'Erro:', progError);

        if (prog) {
          const hydrated = await Promise.all(
            prog.map(async (p) => {
              const idStr = String(p.content_id)
              console.log('Buscando content para id:', idStr);
              const { data: contentData } = await sb.from('content').select('*').eq('id', idStr).maybeSingle()

              if (contentData) {
                const table = contentData.type === 'movie' ? 'cinema' : 'series'
                const { data: orig } = await sb.from(table).select('*').ilike('titulo', contentData.title.trim()).maybeSingle()

                return {
                  id: idStr, // UUID da tabela content
                  id_n: contentData.type === 'series' ? idStr : undefined, // Garante que ContentCard trate como série
                  titulo: contentData.title,
                  poster: contentData.poster || (orig ? (orig.poster || orig.capa || orig.poster_path || orig.banner) : null),
                  type: contentData.type,
                  last_position: p.last_position,
                  duration: orig?.duration || orig?.runtime || contentData.duration || null
                }
              }
              return null
            })
          )
          console.log('Dados hidratados:', hydrated);
          setContinueWatching(hydrated.filter(Boolean))
        }
      } else {
        setContinueWatching([])
      }

      // 1. Busca seções ativas ordenadas por posição
      const { data: secs, error } = await sb
        .from('home_sections')
        .select('*')
        .eq('ativo', true)
        .order('posicao', { ascending: true })


      if (error || !secs) {
        setLoading(false)
        return
      }

      // 2. Filtra por agendamento (Datas e Horários)
      const now = new Date()
      const currentIsoDate = now.toISOString()
      const currentHms = now.toTimeString().split(' ')[0] // Formato "HH:MM:SS"

      const visibleSections = (secs as HomeSection[]).filter(sec => {
        // Validação de intervalo de datas
        if (sec.data_inicio && currentIsoDate < sec.data_inicio) return false
        if (sec.data_fim && currentIsoDate > sec.data_fim) return false
        
        // Validação de intervalo de horários
        if (sec.hora_inicio && sec.hora_fim) {
           if (sec.hora_inicio > sec.hora_fim) { // Caso a seção atravesse a meia-noite
              if (currentHms < sec.hora_inicio && currentHms > sec.hora_fim) return false
           } else {
              if (currentHms < sec.hora_inicio || currentHms > sec.hora_fim) return false
           }
        }
        return true
      })

      setSections(visibleSections)

      // 3. Carrega os itens para cada seção visível
      const dataMap: Record<string, any[]> = {}

      // Verificar total de itens na tabela cinema
      const { count: cinemaCount, error: countError } = await sb.from('cinema').select('*', { count: 'exact', head: true })

      // Tentar buscar uma amostra sem filtros
      const { data: sampleCinema, error: sampleError } = await sb.from('cinema').select('*').limit(5)

      await Promise.all(visibleSections.map(async (sec) => {
        if (sec.fonte === 'cinema') {
          let query = sb.from('cinema').select('*')

          if (sec.categorias && sec.categorias.length > 0) {
            // Busca conteúdos que contenham qualquer uma das categorias solicitadas
            const catFilters = sec.categorias.map(c => `category.ilike.%${c}%`).join(',')
            query = query.or(catFilters)
          }

          // Aplica ordenação conforme configurado na tabela
          if (sec.ordenacao === 'rating_desc') query = query.order('rating', { ascending: false })
          else if (sec.ordenacao === 'year_desc') query = query.order('year', { ascending: false })
          else query = query.order('created_at', { ascending: false })

          const { data: items, error: itemsError } = await query.limit(sec.limite)
          dataMap[sec.id] = items || []
        }
      }))

      setSectionsData(dataMap)
      setLoading(false)
    }

    loadHome()
  }, [user])

  if (loading) return <div className="min-h-screen bg-black animate-pulse" />

  return (
    <div className="flex flex-col gap-16 pb-32">
      {/* Banner de Destaque */}
      <HeroBanner />

      {/* Continuar Assistindo */}
      {continueWatching.length > 0 && (
        <ContentRow title="Continuar Assistindo" items={continueWatching} showProgress={true} />
      )}

      {sections.map(sec => {
        const items = sectionsData[sec.id] || []
        if (items.length === 0 || sec.layout === 'featured') return null

        if (sec.layout === 'grid') {
          return (
            <section key={sec.id} className="px-6 md:px-16">
              <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-8 border-l-4 border-brand-cyan pl-4">
                {sec.titulo}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
                {items.map(item => <ContentCard key={item.id} item={item} />)}
              </div>
            </section>
          )
        }

        // Layout 'row' (Carrossel Horizontal)
        return <ContentRow key={sec.id} title={sec.titulo} items={items} />
      })}
    </div>
  )
}
