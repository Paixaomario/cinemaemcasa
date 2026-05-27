'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/layout/SupabaseProvider'
import { HeroBanner } from '@/components/sections/HeroBanner'
import { ContentRow } from '@/components/sections/ContentRow'
import { ContentCard } from '@/components/ui/ContentCard'
import { useSpatialNavigation } from '@/hooks/useSpatialNavigation'
import { useBurnInProtection } from '@/hooks/useBurnInProtection'
import {
  initializeContentSession,
  addToDisplayedCache,
  addBatchToDisplayedCache,
  getDisplayedCache,
  getSectionContent,
  getPersonalizedRecommendations,
  getTrendingContent,
  isNewUser
} from '@/lib/homeContentManager'

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
  const { user, loading } = useAuth()
  const router = useRouter()
  const [sections, setSections] = useState<HomeSection[]>([])
  const [sectionsData, setSectionsData] = useState<Record<string, any[]>>({})
  const [continueWatching, setContinueWatching] = useState<any[]>([])
  const [pageLoading, setPageLoading] = useState(true)

  // Ativa navegação por controle remoto na Home
  useSpatialNavigation()

  // Ativa proteção contra Burn-in para TVs OLED
  useBurnInProtection(5)

  // Redireciona para login se não estiver autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    async function loadHome() {
      // Se não estiver autenticado, não carrega conteúdo
      if (!user) return

      const sb = createClient()

      // Busca se o usuário está no Modo Infantil
      const { data: profile } = await sb
        .from('profiles')
        .select('is_child')
        .eq('id', user.id)
        .single()
      
      const isChild = profile?.is_child || false

      // Inicializa nova sessão de conteúdo (reseta cache a cada carregamento)
      initializeContentSession()

      // 0. Carregar Continuar Assistindo se houver usuário
      if (user) {
        const { data: prog, error: progError } = await sb
          .from('view_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_finished', false)
          .order('updated_at', { ascending: false })
          .limit(4)

        if (prog) {
          const hydrated = await Promise.all(
            prog.map(async (p) => {
              const idStr = String(p.content_id)

              // Tenta buscar por UUID primeiro, depois por título se for numérico
              let contentData = null
              const isNumeric = /^\d+$/.test(idStr)
              const isEpisode = idStr.includes('-ep-')

              if (isEpisode) {
                // É episódio de série, extrai o UUID da série
                const seriesUuid = idStr.split('-ep-')[0]
                const { data: dataByUuid } = await sb.from('content').select('*').eq('id', seriesUuid).maybeSingle()
                if (dataByUuid) {
                  // Busca o ID numérico da série na tabela series
                  const { data: seriesData } = await sb.from('series').select('id_n').ilike('titulo', dataByUuid.title.trim()).maybeSingle()
                  contentData = {
                    id: seriesUuid,
                    id_n: seriesData?.id_n || null, // ID numérico para o link
                    title: dataByUuid.title,
                    type: 'series',
                    poster: dataByUuid.poster
                  }
                }
              } else if (!isNumeric) {
                // É UUID, busca direto
                const { data: dataByUuid } = await sb.from('content').select('*').eq('id', idStr).maybeSingle()
                contentData = dataByUuid
              } else {
                // É numérico, busca por título nas tabelas cinema/series
                // Primeiro tenta encontrar na tabela cinema
                const { data: movieData } = await sb.from('cinema').select('*').eq('id', parseInt(idStr)).maybeSingle()
                if (movieData) {
                  contentData = {
                    id: idStr, // Usa o ID numérico como fallback
                    title: movieData.titulo,
                    type: 'movie',
                    poster: movieData.poster || movieData.capa || movieData.poster_path || movieData.banner
                  }
                } else {
                  // Tenta na tabela series
                  const { data: seriesData } = await sb.from('series').select('*').eq('id', parseInt(idStr)).maybeSingle()
                  if (seriesData) {
                    contentData = {
                      id: idStr,
                      title: seriesData.titulo,
                      type: 'series',
                      poster: seriesData.poster || seriesData.capa || seriesData.poster_path || seriesData.banner
                    }
                  }
                }
              }

              if (contentData) {
                const table = contentData.type === 'movie' ? 'cinema' : 'series'
                const { data: orig } = await sb.from(table).select('*').ilike('titulo', contentData.title.trim()).maybeSingle()

                // Tenta obter duration de várias fontes
                let duration = orig?.duration || orig?.runtime || contentData.duration || null

                // Converte duration de string para segundos
                let durationInSeconds = null
                if (duration) {
                  if (typeof duration === 'number') {
                    durationInSeconds = duration
                  } else if (typeof duration === 'string') {
                    try {
                      // Formato "2h 21min" ou "107" (minutos)
                      if (duration.includes('h') && duration.includes('min')) {
                        const parts = duration.split('h')
                        const hours = parseInt(parts[0]) || 0
                        const mins = parseInt(parts[1]?.replace('min', '').trim()) || 0
                        durationInSeconds = hours * 3600 + mins * 60
                      } else if (!isNaN(parseInt(duration))) {
                        // Assume que são minutos
                        durationInSeconds = parseInt(duration) * 60
                      }
                    } catch (error) {
                      console.error('Erro ao fazer parsing de duration:', error)
                      durationInSeconds = null
                    }
                  }
                }

                return {
                  id: idStr,
                  id_n: contentData.id_n || (contentData.type === 'series' ? idStr : undefined),
                  titulo: contentData.title,
                  poster: contentData.poster || (orig ? (orig.poster || orig.capa || orig.poster_path || orig.banner) : null),
                  type: contentData.type,
                  last_position: p.last_position,
                  duration: durationInSeconds
                }
              }
              return null
            })
          )
          const filtered = hydrated.filter(Boolean)
          // Remove duplicatas baseadas no título (mantém o mais recente com UUID)
          const uniqueMap = new Map()
          filtered.forEach(item => {
            if (!item) return
            const key = item.titulo.toLowerCase().trim()
            // Se já existe, mantém o que tem UUID (prioridade)
            if (!uniqueMap.has(key) || (item.id && !/^\d+$/.test(item.id))) {
              uniqueMap.set(key, item)
            }
          })
          const uniqueItems = Array.from(uniqueMap.values())
          setContinueWatching(uniqueItems)

          // Adiciona ao cache de exibidos
          uniqueItems.forEach(item => {
            if (item.id) addToDisplayedCache(String(item.id))
          })
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
        setPageLoading(false)
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

      // Obtém o cache atual de IDs exibidos
      const displayedIds = getDisplayedCache()

      // Adiciona IDs do continuar assistindo ao cache
      continueWatching.forEach(item => {
        if (item.id) {
          const idStr = String(item.id)
          displayedIds.add(idStr)
          addToDisplayedCache(idStr)
        }
      })

      await Promise.all(visibleSections.map(async (sec) => {
        let items: any[] = []

        // Seção especial: Indicados por IA
        if (sec.titulo.toLowerCase().includes('indicados por ia') || sec.titulo.toLowerCase().includes('ia')) {
          if (user) {
            const userIsNew = await isNewUser(user.id)
            if (userIsNew) {
              // Novo usuário: mostra conteúdo em alta
              items = await getTrendingContent(sec.limite, isChild)
            } else {
              // Usuário existente: recomendações personalizadas
              items = await getPersonalizedRecommendations(user.id, sec.limite, displayedIds)
            }
          } else {
            // Não logado: mostra conteúdo em alta
            items = await getTrendingContent(sec.limite, isChild)
          }
        } else {
          // Seção normal: usa o gerenciador de conteúdo (independente da fonte)
          // Converte categorias para array se necessário
          let categories: string[] = []
          if (sec.categorias) {
            if (Array.isArray(sec.categorias)) {
              categories = sec.categorias
            } else if (typeof sec.categorias === 'string') {
              categories = (sec.categorias as string).split(',').map((c: string) => c.trim())
            }
          }

          items = await getSectionContent(
            sec.id,
            categories,
            sec.limite,
            sec.ordenacao,
            displayedIds
          )
        }

        // Adiciona IDs ao cache de exibidos
        const newIds = items.map((item: any) => String(item.id)).filter(Boolean)
        addBatchToDisplayedCache(newIds)
        newIds.forEach(id => displayedIds.add(id))
        
        dataMap[sec.id] = items
      }))

      setSectionsData(dataMap)
      setPageLoading(false)
    }

    loadHome()
  }, [user])

  if (loading || pageLoading) return <div className="min-h-screen bg-black animate-pulse" />

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
              <div 
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 focus-within:ring-2 focus-within:ring-brand-cyan/20 rounded-xl p-2"
                tabIndex={-1}
              >
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
