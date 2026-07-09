'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/layout/SupabaseProvider'
import { HeroBanner } from '@/components/sections/HeroBanner'
import { ContentRow } from '@/components/sections/ContentRow'
import { ContentCard } from '@/components/ui/ContentCard'
import { useSpatialNavigation } from '@/hooks/useSpatialNavigation'
import { useBurnInProtection } from '@/hooks/useBurnInProtection'
import { getViewportMetadata } from '@/lib/deviceManager'
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
  const [pageLoading, setPageLoading] = useState(false) // Removido delay inicial
  const [resumeItem, setResumeItem] = useState<any>(null)
  const [canAutoPlayTrailer, setCanAutoPlayTrailer] = useState(false)
  const [isTVLayout, setIsTVLayout] = useState(false)

  // Ativa navegação por controle remoto na Home
  // Temporariamente desabilitado para corrigir erro React #310
  // useSpatialNavigation()

  // Ativa proteção contra Burn-in para TVs OLED
  // Temporariamente desabilitado para corrigir erro React #310
  // useBurnInProtection(5)

  // Ajuste de Layout para TV (Safe Area)
  // Temporariamente desabilitado para corrigir erro React #310
  /* useEffect(() => {
    const { isBigScreen } = getViewportMetadata()
    setIsTVLayout(isBigScreen)
  }, []) */

  // Detecta qualidade da rede para Auto-Play de trailers
  // Temporariamente desabilitado para corrigir erro React #310
  /* useEffect(() => {
    const checkNetwork = () => {
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (conn) {
        // Só permite se não for modo economia de dados e se for wifi ou 4g/5g forte
        const isGoodConnection = !conn.saveData && (conn.type === 'wifi' || ['4g', '5g'].includes(conn.effectiveType));
        setCanAutoPlayTrailer(isGoodConnection);
      } else {
        setCanAutoPlayTrailer(true); // Fallback para navegadores sem API (TVs)
      }
    };
    checkNetwork();
  }, []); */

  // Redireciona para login se não estiver autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Função loadHome usando useCallback para poder ser chamada nas subscriptions
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

    // Inicializa nova sessão de conteúdo (reseta cache a cada carregamento)
    initializeContentSession()

    // 0. Carregar Continuar Assistindo se houver usuário - OTIMIZADO
    if (user) {
      const { data: prog, error: progError } = await sb
        .from('view_progress')
        .select('content_id,last_position')
        .eq('user_id', user.id)
        .eq('is_finished', false)
        .order('updated_at', { ascending: false })
        .limit(4)

      console.log('[Home] Progresso carregado:', prog?.length, 'itens', progError ? 'Erro:' + progError.message : '')

      if (prog) {
        const hydrated = await Promise.all(
          prog.map(async (p) => {
            const idStr = String(p.content_id)
            const isNumeric = /^\d+$/.test(idStr);

            // Busca direta nas tabelas originais para evitar joins complexos
            let contentData: any = null;

            // Tenta buscar em cinema primeiro (id é integer)
            if (isNumeric) {
              const { data: cinemaData } = await sb.from('cinema').select('id,titulo,category,poster,backdrop,banner').eq('id', parseInt(idStr)).maybeSingle();
              if (cinemaData) {
                contentData = { ...cinemaData, source_table: 'cinema', tipo: 'movie' };
              }
            }

            // Se não encontrou em cinema e é numérico, tenta buscar em series (id_n é integer)
            if (!contentData && isNumeric) {
              const { data: seriesData } = await sb.from('series').select('id_n,titulo,ano,poster,capa,banner,backdrop').eq('id_n', parseInt(idStr)).maybeSingle();
              if (seriesData) {
                contentData = { ...seriesData, source_table: 'series', tipo: 'series' };
              }
            }

            // Se o ID não é numérico (UUID), ignora - conteúdo provavelmente foi deletado
            if (!contentData && !isNumeric) {
              console.warn(`Aviso: Conteúdo com UUID não encontrado (provavelmente deletado): ${idStr}`);
              return null;
            }

            if (!contentData) {
              console.warn(`Aviso: Conteúdo não encontrado para view_progress ID ${idStr}`);
              return null;
            }

            const finalId = contentData.source_table === 'series' ? contentData.id_n : contentData.id;
            const finalTitulo = contentData.titulo || contentData.title;
            let finalPoster = contentData.poster || contentData.capa || contentData.banner;

            // Proteção contra URLs incompletas do TMDB
            if (finalPoster === 'https://image.tmdb.org/t/p/w500' || finalPoster === 'https://image.tmdb.org/t/p/original') {
              finalPoster = null;
            }

            const finalType = contentData.tipo || contentData.type;

            // Converte duration de string para segundos
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

    // Adiciona ao cache de exibidos em lote (Otimizado)
    const cwIds = cwItems.map(item => String(item.id)).filter(Boolean)
    addBatchToDisplayedCache(cwIds)

    // 1. Busca seções ativas ordenadas por posição
    const { data: secs, error } = await sb
      .from('home_sections')
      .select('*')
      .eq('ativo', true)
      .order('posicao', { ascending: true })

    console.log(`[Home] ${secs?.length || 0} seções encontradas.`);

    if (error || !secs) {
      console.error("[Home] Erro ao buscar seções:", error);
      setPageLoading(false)
      return
    }

    // 2. Filtra por agendamento (Datas e Horários)
    const now = new Date()
    const currentIsoDate = now.toISOString()
    const currentHms = now.toTimeString().split(' ')[0] // Formato "HH:MM:SS"

    const visibleSections = (secs as HomeSection[]).filter(sec => {
      // Validação de intervalo de datas
      try {
        if (sec.data_inicio && currentIsoDate < sec.data_inicio) return false
        if (sec.data_fim && currentIsoDate > sec.data_fim) return false
      } catch (e) {
        console.warn(`[Home] Erro ao validar datas da seção ${sec.titulo}:`, e);
      }
      
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
    setPageLoading(false) // Libera a UI imediatamente após carregar seções

    // 3. Carrega os itens para cada seção visível em paralelo
    const newSectionsData: Record<string, any[]> = {}
    const sectionPromises = visibleSections.map(async (sec) => {
      try {
        const displayedIds = getDisplayedCache()
        let items: any[] = []

        // Seção especial: Indicados por IA
        const lowerTitle = sec.titulo.toLowerCase();
        if (lowerTitle === 'indicados por ia' || lowerTitle === 'ia') {
          if (user) {
            const userIsNew = await isNewUser(user.id)
            if (userIsNew) {
              items = await getTrendingContent(sec.limite, isChild)
            } else {
              // Aguarda as recomendações para garantir que o cache de IDs exibidos seja atualizado
              items = await getPersonalizedRecommendations(user.id, sec.limite, displayedIds, isChild)
            }
          } else {
            items = await getTrendingContent(sec.limite, isChild)
          }
        } else {
          // Seção normal: usa o gerenciador de conteúdo (independente da fonte)
          // Normalização robusta de categorias vindo do Supabase (text[] ou string separada por vírgula)
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

        // Adiciona IDs ao cache de exibidos
        const newIds = items.map((item: any) => String(item.id)).filter(Boolean)
        addBatchToDisplayedCache(newIds)
        newSectionsData[sec.id] = items
      } catch (sectionError) {
        console.error(`[Home] Erro ao carregar seção ${sec.titulo}:`, sectionError);
      }
    })

    await Promise.all(sectionPromises);
    setSectionsData(newSectionsData);
    setPageLoading(false); // Agora sim, a página está carregada
  }, [user])

  // Carrega dados iniciais e configura polling periódico
  // Temporariamente desabilitado para corrigir erro React #310
  /*
  useEffect(() => {
    if (!user) return

    loadHome()

    // Polling periódico para atualizar dados a cada 5 minutos
    const pollingInterval = setInterval(() => {
      if (user && document.visibilityState === 'visible') {
        loadHome()
      }
    }, 5 * 60 * 1000) // 5 minutos

    // Limpa o intervalo quando o componente é desmontado
    return () => {
      clearInterval(pollingInterval)
    }
  }, [user, loadHome])
  */

  // Carrega dados iniciais sem polling
  useEffect(() => {
    if (!user) return
    loadHome()
  }, [user])

  // Configura Supabase Realtime subscriptions para atualização em tempo real
  // Temporariamente desabilitado para corrigir erro React #310
  /*
  useEffect(() => {
    if (!user) return

    const sb = createClient()

    // Subscription para tabela cinema
    const cinemaSubscription = sb
      .channel('cinema-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cinema' }, () => {
        console.log('[Home] Mudança detectada na tabela cinema, recarregando...')
        loadHome()
      })
      .subscribe()

    // Subscription para tabela series
    const seriesSubscription = sb
      .channel('series-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'series' }, () => {
        console.log('[Home] Mudança detectada na tabela series, recarregando...')
        loadHome()
      })
      .subscribe()

    // Subscription para tabela home_sections
    const homeSectionsSubscription = sb
      .channel('home-sections-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'home_sections' }, () => {
        console.log('[Home] Mudança detectada na tabela home_sections, recarregando...')
        loadHome()
      })
      .subscribe()

    // Limpa as subscriptions quando o componente é desmontado
    return () => {
      cinemaSubscription.unsubscribe()
      seriesSubscription.unsubscribe()
      homeSectionsSubscription.unsubscribe()
    }
  }, [user, loadHome])
  */

  // Mostra skeleton real em vez de um pulso vazio
  if (loading) return <div className="min-h-screen bg-black" />

  // Fallback de segurança: se pageLoading estiver true por muito tempo, libera a UI
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (pageLoading) {
        console.warn('[Home] Timeout de carregamento, forçando renderização')
        setPageLoading(false)
      }
    }, 5000) // 5 segundos de timeout

    return () => clearTimeout(timeout)
  }, [pageLoading])

  return (
    <div className={`flex flex-col gap-16 pb-32 ${isTVLayout ? 'px-[6%] py-[4%]' : 'px-4 md:px-0'}`}>
      {/* Banner de Destaque */}
      {/* Temporariamente desabilitado para corrigir erro React #310 */}
      {/* <HeroBanner canAutoPlayTrailer={canAutoPlayTrailer} /> */}

      {/* Popup de Continuar ou Reiniciar */}
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

      {/* Continuar Assistindo */}
      {continueWatching.length > 0 && ( // Adicionado onItemClick para interceptar e mostrar o modal
        <ContentRow 
          title="Continuar Assistindo" 
          items={continueWatching} 
          showProgress={true} 
          onItemClick={(item) => {
            // Intercepta o clique para mostrar o modal de continuar/reiniciar
            setResumeItem(item);
          }}
        />
      )}

      {sections.map(sec => {
        const items = sectionsData[sec.id] || []
        
        // Seção em carregamento (Skeleton Row para 3G/4G)
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

        // Layout 'row' (Carrossel Horizontal)
        return <ContentRow key={sec.id} title={sec.titulo} items={items} />
      })}
    </div>
  )
}
