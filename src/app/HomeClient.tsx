'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/layout/SupabaseProvider'
import { HeroBanner } from '@/components/sections/HeroBanner'
import { ContentRow } from '@/components/sections/ContentRow'
import { ContentCard } from '@/components/ui/ContentCard'
import {
  initializeContentSession,
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
  categorias: string[] | string | null
  fonte: 'cinema' | 'tmdb'
  tmdb_endpoint: string | null
  layout: 'row' | 'grid' | 'featured'
  limite: number
  ordenacao: 'created_at_desc' | 'rating_desc' | 'year_desc' | 'random'
  posicao: number
  ativo: boolean
  hora_inicio: string | null
  hora_fim: string | null
  data_inicio: string | null
  data_fim: string | null
  created_at?: string
  updated_at?: string
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
  const [resumeItem, setResumeItem] = useState<any>(null)
  const [canAutoPlayTrailer, setCanAutoPlayTrailer] = useState(false)
  const [isTVLayout, setIsTVLayout] = useState(false)

  // Redireciona para login se não estiver autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Detecta qualidade da rede
  useEffect(() => {
    const checkNetwork = () => {
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (conn) {
        const isGoodConnection = !conn.saveData && (conn.type === 'wifi' || ['4g', '5g'].includes(conn.effectiveType));
        setCanAutoPlayTrailer(isGoodConnection);
      } else {
        setCanAutoPlayTrailer(true);
      }
    };
    checkNetwork();
  }, [])

  // Ajuste de Layout para TV
  useEffect(() => {
    const { isBigScreen } = (window as any).getViewportMetadata?.() || { isBigScreen: false }
    setIsTVLayout(isBigScreen)
  }, [])

  // Função loadHome
  const loadHome = useCallback(async () => {
    if (!user) return

    const sb = createClient()

    // Busca se o usuário está no Modo Infantil
    let cwItems: any[] = []
    const { data: profile } = await sb
      .from('profiles')
      .select('is_child')
      .eq('id', user.id)
      .maybeSingle()
    
    const isChild = profile?.is_child || false

    // Inicializa nova sessão de conteúdo
    initializeContentSession()

    // Carregar Continuar Assistindo
    if (user) {
      const { data: prog, error: progError } = await sb
        .from('view_progress')
        .select('content_id,last_position')
        .eq('user_id', user.id)
        .eq('is_finished', false)
        .order('updated_at', { ascending: false })
        .limit(4)

      if (prog) {
        const hydrated = await Promise.all(
          prog.map(async (p) => {
            const idStr = String(p.content_id)
            const isNumeric = /^\d+$/.test(idStr);
            let contentData: any = null;

            if (isNumeric) {
              const { data: cinemaData } = await sb.from('cinema').select('id,titulo,category,poster,backdrop,banner').eq('id', parseInt(idStr)).maybeSingle();
              if (cinemaData) {
                contentData = { ...cinemaData, source_table: 'cinema', tipo: 'movie' };
              }
            }

            if (!contentData && isNumeric) {
              const numericId = parseInt(idStr);
              if (!isNaN(numericId)) {
                const { data: seriesData } = await sb.from('series').select('id_n,titulo,ano,poster,capa,banner,backdrop').eq('id_n', numericId).maybeSingle();
                if (seriesData) {
                  contentData = { ...seriesData, source_table: 'series', tipo: 'series' };
                }
              }
            }

            if (!contentData && !isNumeric) {
              return null;
            }

            if (!contentData) {
              return null;
            }

            const finalId = contentData.source_table === 'series' ? contentData.id_n : contentData.id;
            const finalTitulo = contentData.titulo || contentData.title;
            let finalPoster = contentData.poster || contentData.capa || contentData.banner;

            if (finalPoster === 'https://image.tmdb.org/t/p/w500' || finalPoster === 'https://image.tmdb.org/t/p/original') {
              finalPoster = null;
            }

            const finalType = contentData.tipo || contentData.type;

            let durationInSeconds = null
            try {
              let duration = contentData.duration || null
              if (duration) {
                if (typeof duration === 'number') {
                  durationInSeconds = duration
                } else if (typeof duration === 'string') {
                  const cleaned = duration.toLowerCase().trim()
                  const match = cleaned.match(/(\d+)\s*h(?:\s*(\d+)\s*min)?/);
                  if (match) {
                    const hours = parseInt(match[1]) || 0;
                    const mins = parseInt(match[2] || '0') || 0;
                    durationInSeconds = (hours * 3600) + (mins * 60)
                  } else {
                    const mins = parseInt(cleaned.replace(/[^0-9]/g, ''))
                    if (!isNaN(mins)) durationInSeconds = mins * 60
                  }
                }
              }
            } catch (e) {
              console.warn('[Home] Erro ao converter duration:', e)
            }

            return {
              id: finalId,
              id_n: contentData.source_table === 'series' ? finalId : undefined,
              titulo: finalTitulo,
              poster: finalPoster,
              type: finalType,
              progress: {
                lastPosition: p.last_position,
                duration: durationInSeconds
              }
            };
          })
        )

        cwItems = hydrated.filter((item): item is NonNullable<typeof item> => item !== null)
        setContinueWatching(cwItems)
      }
    }

    const cwIds = cwItems.map(item => String(item.id)).filter(Boolean)
    addBatchToDisplayedCache(cwIds)

    // Busca seções ativas
    const { data: secs, error } = await sb
      .from('home_sections')
      .select('*')
      .eq('ativo', true)
      .order('posicao', { ascending: true })

    if (error || !secs) {
      console.error("[Home] Erro ao buscar seções:", error);
      setPageLoading(false)
      return
    }

    // Filtra por agendamento
    const now = new Date()
    const currentIsoDate = now.toISOString()
    const currentHms = now.toTimeString().split(' ')[0]

    const visibleSections = (secs as HomeSection[]).filter(sec => {
      try {
        if (sec.data_inicio && currentIsoDate < sec.data_inicio) return false
        if (sec.data_fim && currentIsoDate > sec.data_fim) return false
      } catch (e) {
        console.warn(`[Home] Erro ao validar datas da seção ${sec.titulo}:`, e);
      }
      
      if (sec.hora_inicio && sec.hora_fim) {
         if (sec.hora_inicio > sec.hora_fim) {
            if (currentHms < sec.hora_inicio && currentHms > sec.hora_fim) return false
         } else {
            if (currentHms < sec.hora_inicio || currentHms > sec.hora_fim) return false
         }
      }
      return true
    })

    setSections(visibleSections)
    setPageLoading(false)

    // Carrega itens das seções
    const newSectionsData: Record<string, any[]> = {}
    const sectionPromises = visibleSections.map(async (sec) => {
      try {
        const displayedIds = getDisplayedCache()
        let items: any[] = []

        const lowerTitle = sec.titulo.toLowerCase();
        if (lowerTitle === 'indicados por ia' || lowerTitle === 'ia') {
          if (user) {
            const userIsNew = await isNewUser(user.id)
            if (userIsNew) {
              items = await getTrendingContent(sec.limite, isChild)
            } else {
              items = await getPersonalizedRecommendations(user.id, sec.limite, displayedIds, isChild)
            }
          } else {
            items = await getTrendingContent(sec.limite, isChild)
          }
        } else {
          let categories: string[] = []
          const rawCats = sec.categorias
          if (rawCats) {
            categories = Array.isArray(rawCats) 
              ? rawCats.map(c => String(c).trim()).filter(Boolean)
              : String(rawCats).split(',').map(c => c.trim()).filter(Boolean)
          }

          items = await getSectionContent(
            sec.id,
            categories,
            sec.limite,
            sec.ordenacao,
            displayedIds,
            isChild
          )
        }

        const newIds = items.map((item: any) => String(item.id)).filter(Boolean)
        addBatchToDisplayedCache(newIds)
        newSectionsData[sec.id] = items
      } catch (sectionError) {
        console.error(`[Home] Erro ao carregar seção ${sec.titulo}:`, sectionError);
      }
    })

    await Promise.all(sectionPromises);
    setSectionsData(newSectionsData);
    setPageLoading(false);
  }, [user])

  // Carrega dados iniciais
  useEffect(() => {
    if (!user) return
    loadHome()
  }, [user, loadHome])

  // Timeout de segurança
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (pageLoading) {
        console.warn('[Home] Timeout de carregamento, forçando renderização')
        setPageLoading(false)
      }
    }, 5000)

    return () => clearTimeout(timeout)
  }, [pageLoading])

  if (loading) return <div className="min-h-screen bg-black" />

  return (
    <div className={`flex flex-col gap-16 pb-32 ${isTVLayout ? 'px-[6%] py-[4%]' : 'px-4 md:px-0'}`}>
      <HeroBanner canAutoPlayTrailer={canAutoPlayTrailer} />

      {resumeItem && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#1A1A1F] p-8 rounded-3xl border border-white/10 shadow-2xl max-w-md w-full mx-4">
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Continuar assistindo?</h3>
            <p className="text-neutral-400 mb-8 font-medium">Você já iniciou este conteúdo. Como deseja prosseguir?</p>
            
            <div className="flex flex-col gap-4">
              <button
                autoFocus
                tabIndex={0}
                onClick={() => {
                  const id = resumeItem.id_n || resumeItem.id;
                  router.push(`/assistir/${id}?t=${resumeItem.last_position}`);
                  setResumeItem(null);
                }}
                className="w-full py-4 bg-[#00ADEF] text-white font-bold uppercase tracking-widest rounded-xl hover:scale-105 transition-transform outline-none focus:ring-4 focus:ring-white/20"
              >
                Continuar de onde parei
              </button>
              <button
                tabIndex={0}
                onClick={() => {
                  const id = resumeItem.id_n || resumeItem.id;
                  router.push(`/assistir/${id}?t=0`);
                  setResumeItem(null);
                }}
                className="w-full py-4 bg-white/5 text-white font-bold uppercase tracking-widest rounded-xl border border-white/10 hover:bg-white/10 transition-all outline-none focus:ring-4 focus:ring-white/20"
              >
                Reiniciar do início
              </button>
              <button
                tabIndex={0}
                onClick={() => setResumeItem(null)}
                className="mt-2 text-neutral-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {continueWatching.length > 0 && (
        <ContentRow 
          title="Continuar Assistindo" 
          items={continueWatching} 
          showProgress={true} 
          onItemClick={(item) => {
            setResumeItem(item);
          }}
        />
      )}

      {sections.map(sec => {
        const items = sectionsData[sec.id] || []
        
        if (items.length === 0) {
          if (sec.layout === 'featured') return null
          return (
            <section key={sec.id} className="px-6 md:px-16 animate-pulse">
              <div className="h-8 w-48 bg-neutral-800 rounded mb-8" />
              <div className="flex gap-6 overflow-hidden">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="aspect-[2/3] w-[200px] bg-neutral-900 rounded-xl flex-shrink-0" />
                ))}
              </div>
            </section>
          )
        }

        if (sec.layout === 'grid') {
          return (
            <section key={sec.id} className="px-6 md:px-16">
              <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-8 border-l-4 border-brand-cyan pl-4">
                {sec.titulo}
              </h2>
              <div 
                className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 tv-grid-layout gap-4 md:gap-8 focus-within:ring-2 focus-within:ring-brand-cyan/20 rounded-xl p-2"
                tabIndex={-1}
              >
                {items.map(item => <ContentCard
                  key={item.id}
                  id={item.id}
                  titulo={item.titulo || item.title || 'Sem título'}
                  type={(item.type === 'movie' ? 'movie' : 'series') as 'movie' | 'series'}
                  poster={item.poster || ''}
                  capa={item.capa || ''}
                  backdrop={item.backdrop || ''}
                  banner={item.banner || ''}
                  rating={item.rating || 0}
                  year={item.year || item.ano || new Date().getFullYear()}
                />)}
              </div>
            </section>
          )
        }

        return <ContentRow key={sec.id} title={sec.titulo} items={items} />
      })}
    </div>
  )
}
