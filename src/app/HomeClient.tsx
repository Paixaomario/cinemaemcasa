'use client'

import { useEffect, useState, CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { HeroBanner } from '@/components/sections/HeroBanner'
import { getMovieDetails, getShowDetails, TMDBMovie, TMDBShow, formatRuntime } from '@/lib/tmdb'
import Image from 'next/image'
import { useAuth } from '@/components/layout/SupabaseProvider'

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
  id: number | string
  titulo: string | null
  poster: string | null
  banner: string | null
  backdrop: string | null
  year: number | null
  rating: number | null
  category: string | null
  type: string | null
  url: string | null
  duration: string | null
  last_position?: number
  duration_seconds?: number
  tmdb_id?: number | null
}

export function HomeClient() {
  const { user } = useAuth()
  const [sections,   setSections]   = useState<HomeSection[]>([])
  const [itemsMap,   setItemsMap]   = useState<Record<string, CinemaItem[]>>({})
  const [continueWatching, setContinueWatching] = useState<CinemaItem[]>([])
  const [bannerPool, setBannerPool] = useState<Array<TMDBMovie | TMDBShow>>([])
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true) // Sempre começa em true para evitar hydration errors
  const [dbError,    setDbError]    = useState('')

  useEffect(() => {
    async function load() {
      const sb = createClient()
      const hasLoadedBefore = typeof window !== 'undefined' && sessionStorage.getItem('paixaoflix_loaded')

      // Conjunto de chaves únicas para evitar duplicatas (ID, tmdb_id, slug)
      const seenContentKeys = new Set<string>()

      try {
        if (!hasLoadedBefore) setLoading(true)
        setProgress(25)

        // 2. Processar "Continuar Assistindo" PRIMEIRO
        if (user) {
          const { data: progressData } = await sb
            .from('view_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_finished', false)
            .order('updated_at', { ascending: false })
            .limit(5)

          // Adiciona os IDs do continuar assistindo para evitar duplicatas na home
          if (progressData) {
            progressData.forEach(p => {
              const idKey = String(p.content_id)
              seenContentKeys.add(idKey)
              // Se for formato "filme-123", extrai o ID numérico também
              if (idKey.includes('-')) seenContentKeys.add(idKey.split('-')[1])
            })
          }

          if (progressData && progressData.length > 0) {
            const hydrated = await Promise.all(
              progressData.map(async (p) => {
                const idStr = String(p.content_id)
                let item: TMDBMovie | TMDBShow | CinemaItem | null = null
                if (!idStr.includes('-')) {
                  const { data } = await sb.from('cinema').select('*').eq('id', p.content_id).single()
                  item = data as CinemaItem
                } else {
                  const [type, rawId] = idStr.split('-')
                  try {
                    // Busca direta pelo ID do filme para evitar dados de coleção agrupados
                    item = type === 'filme' ? await getMovieDetails(Number(rawId)) : await getShowDetails(Number(rawId))
                  } catch { return null }
                }
                if (item) {
                  const itemData = item as CinemaItem & TMDBMovie & TMDBShow;
                  return {
                    ...item,
                    id: idStr,
                    titulo: itemData.titulo || itemData.title || itemData.name || 'Sem título',
                    poster: (itemData.poster && itemData.poster.length > 5) ? itemData.poster : (itemData.poster_path ? `https://image.tmdb.org/t/p/w500${itemData.poster_path}` : null),
                    last_position: p.last_position,
                    duration_seconds: itemData.duration_seconds || (itemData.runtime ? itemData.runtime * 60 : 3600)
                  }
                }
                return null
              })
            )
            setContinueWatching(hydrated.filter(Boolean) as CinemaItem[])
          }
        }
        setProgress(45)

        // 2. Buscar definições de seções
        const { data: secs, error: secErr } = await sb
          .from('home_sections')
          .select('*')
          .eq('ativo', true)
          .order('posicao', { ascending: true })

        if (secErr) throw secErr
        
        // Para garantir que as datas sejam interpretadas corretamente,
        // é crucial que `data_inicio` e `data_fim` sejam inseridas no Supabase
        // no formato ISO 8601 (YYYY-MM-DD HH:MM:SS) ou que o DateStyle do PostgreSQL
        // esteja configurado para DMY.
        const now = new Date() // Data/hora local atual
        const currentUtcDate = new Date(now.toISOString()) // Data/hora UTC atual para comparação consistente de intervalos de data
        const currentTimeMinutes = now.getHours() * 60 + now.getMinutes() // Current local time in minutes for daily schedule comparison

        // Filtragem por Agendamento (Hora e Data)
        const homeSections = (secs || []).filter((sec: HomeSection) => {
          // 1. Checagem por Data (Sazonal)
          if (sec.data_inicio && new Date(sec.data_inicio) > currentUtcDate) return false
          if (sec.data_fim && new Date(sec.data_fim) < currentUtcDate) return false

          // 2. Checagem por Horário (Diário)
          if (sec.hora_inicio && sec.hora_fim) {
            const [hStart, mStart] = sec.hora_inicio.split(':').map(Number)
            const [hEnd, mEnd] = sec.hora_fim.split(':').map(Number)
            const startVal = hStart * 60 + mStart
            const endVal = hEnd * 60 + mEnd

            if (startVal < endVal) {
              // Horário normal (ex: 08:00 as 18:00)
              if (currentTimeMinutes < startVal || currentTimeMinutes > endVal) return false
            } else {
              // Horário que vira a noite (ex: 23:59 as 05:59)
              if (currentTimeMinutes < startVal && currentTimeMinutes > endVal) return false
            }
          }
          return true
        }) as HomeSection[]

        setSections(homeSections)
        setProgress(60)
        
        // 4. Banner Pool: Puxa 20 itens aleatórios de TODO o banco via RPC
        const { data: bannerItems } = await sb.rpc('get_random_content_pool', { cnt: 20 })

        if (bannerItems && bannerItems.length > 0) {
          const hydratedBanners = await Promise.all(bannerItems.map(async (item: CinemaItem) => {
            try {
              const idKey = String(item.id)
              const tmdbId = item.tmdb_id ? String(item.tmdb_id) : null
              
              // Marca IDs como vistos
              seenContentKeys.add(idKey)
              if (tmdbId) seenContentKeys.add(tmdbId)
              
              // Filtra "Coleções" (geralmente não têm runtime ou têm "Collection" no nome)
              if (item.titulo?.toLowerCase().includes('coleção') || item.titulo?.toLowerCase().includes('collection')) return null;

              return item.type === 'serie' ? await getShowDetails(item.tmdb_id!) : await getMovieDetails(item.tmdb_id!)
            } catch { return null }
          }))
          setBannerPool(hydratedBanners.filter(Boolean) as Array<TMDBMovie | TMDBShow>)
        }

        // 3. Buscar e filtrar itens de cada seção (sequencialmente)
        const sectionsPromises = homeSections.map(async (sec) => {
          // Chamada via RPC para garantir aleatoriedade real do Postgres
          const { data } = await sb.rpc('get_home_section_v2', { section_id: sec.id })
          return { 
            id: sec.id, 
            items: (data || []) as CinemaItem[], 
            limit: sec.limite || 5 
          }
        })

        const resolved = await Promise.all(sectionsPromises)
        const newMap: Record<string, CinemaItem[]> = {}
        setProgress(80)

        resolved.forEach(res => {
          const filtered: CinemaItem[] = []
          for (const item of res.items) {
            const idKey   = String(item.id)
            const tmdbId  = item.tmdb_id ? String(item.tmdb_id) : null
            
            // Verifica duplicata em múltiplos formatos
            const isDuplicate = seenContentKeys.has(idKey) || 
                               (tmdbId && seenContentKeys.has(tmdbId)) ||
                               (tmdbId && seenContentKeys.has(`filme-${tmdbId}`)) ||
                               (tmdbId && seenContentKeys.has(`serie-${tmdbId}`))

            if (!isDuplicate) {
              filtered.push(item)
              seenContentKeys.add(idKey)
              if (tmdbId) seenContentKeys.add(tmdbId)
            }
            if (filtered.length >= res.limit) break
          }
          newMap[res.id] = filtered
        })
        setItemsMap(newMap)
        
        setProgress(100)
        if (typeof window !== 'undefined') sessionStorage.setItem('paixaoflix_loaded', 'true')
        // Delay sincronizado com a animação de progresso
        setTimeout(() => setLoading(false), 800)

      } catch (err) {
        setDbError('Erro ao carregar dados da Home. Verifique o console para mais detalhes.')
        console.error('Erro no carregamento da Home:', err)
      } finally {
        // O loading é controlado pelo progresso agora
      }
    }
    
    // Removido o atalho do hasLoaded para garantir que as imagens e banners estejam prontos antes de remover o Splash
    load()
  }, [user])

  useEffect(() => {
    console.log('HomeClient: bannerPool length:', bannerPool.length);
    console.log('HomeClient: continueWatching length:', continueWatching.length);
  }, [bannerPool, continueWatching])

  if (loading) {
    return (
      <div style={{ 
        position: 'fixed', 
        inset: 0, 
        backgroundColor: '#000', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 100000 
      }}>
        <div className="flex flex-col items-center gap-12" style={{ width: '100%', maxWidth: '800px', padding: '0 20px' }}>
          {/* Logotipo Ampliado (3x impacto visual no mobile) */}
          <div style={{ 
            width: 'min(800px, 100vw)', 
            height: 'auto',
            aspectRatio: '200 / 80',
            position: 'relative',
            transform: 'scale(1.4)',
            filter: 'drop-shadow(0 0 20px rgba(229, 9, 20, 0.2))'
          }}>
            <Image
              src="/logo.png"
              alt="PAIXAOFLIX"
              fill
              priority
              style={{ objectFit: 'contain' }}
              className="animate-pulse"
            />
          </div>
          
          {/* Barra de Carregamento Dinâmica 0-100% */}
          <div className="flex flex-col items-center gap-4" style={{ width: 'min(450px, 90vw)', marginTop: '40px' }}>
            <div style={{ 
              width: '100%', 
              height: '8px', 
              background: 'rgba(255, 0, 0, 0.15)', 
              borderRadius: '20px',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ 
                width: `${progress}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, #E50914 0%, #F5C76B 100%)',
                boxShadow: '0 0 20px rgba(229, 9, 20, 0.6)',
                transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
            </div>
            <span style={{ 
              color: 'var(--gold-primary)', 
              fontSize: '18px', 
              fontFamily: 'Inter, sans-serif',
              fontWeight: '900', 
              letterSpacing: '4px',
              textShadow: '0 0 10px rgba(245, 199, 107, 0.3)'
            }}>
              {progress}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (dbError) {
    return (
      <div style={{ textAlign:'center', padding:'80px 20px' }}>
        <span className="text-hero-title" style={{ fontSize: '48px' }}>⚠️</span>
        <p className="text-section-title" style={{ color:'#ff6b6b', marginTop:16 }}>{dbError}</p>
        <p className="text-metadata" style={{ color:'#888', marginTop:8 }}>
          Execute o SQL <code style={{color:'#d9a23a'}}>fix_cinema_rls.sql</code> no Supabase
        </p>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: 140 }}>
      {/* Hero Banner */}
      <div style={{ marginBottom: '35px' }}>
        {bannerPool.length > 0 ? (
        <HeroBanner type="all" initialPool={bannerPool} />
      ) : (
        <div style={{ height: 'clamp(312px,60vw,650px)', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '18px' }}>
          Nenhum banner disponível. Verifique a tabela &apos;cinema&apos; e os &apos;tmdb_id&apos;s.
        </div>
        )}
      </div>

      {/* Seção Continuar Assistindo */}
      {continueWatching.length > 0 && (
        <section style={{ padding:'20px var(--container-px) var(--section-gap)' }}>
          <h2 className="text-section-title" style={{
            marginBottom:  'clamp(14px,1.5vw,22px)',
            color:         'var(--gold-primary)',
            borderLeft:    'none',
            paddingLeft:   0
          }}>Continuar Assistindo</h2>
          <RowLayout items={continueWatching} showProgress />
        </section>
      )}
      {continueWatching.length === 0 && user && !loading && (
        <section style={{ padding:'0 var(--container-px) var(--section-gap)', textAlign: 'center', color: '#888', fontSize: '16px' }}>
          Nenhum conteúdo para continuar assistindo. Comece a ver algo!
        </section>
      )}
      {continueWatching.length === 0 && !user && !loading && (
        <section style={{ padding:'0 var(--container-px) var(--section-gap)', textAlign: 'center', color: '#888', fontSize: '16px' }}>
          Faça login para ver seu histórico de visualização.
        </section>
      )}

      {/* Seções dinâmicas */}
      {sections.length === 0 ? (
        <EmptyState />
      ) : (
        sections.map(sec => {
          const items = itemsMap[sec.id] || []

          // Seções cinema sem filmes ficam ocultas
          if (sec.fonte === 'cinema' && items.length === 0) return null

          return (
            <section key={sec.id} style={{ padding:'0 var(--container-px) var(--section-gap)' }}>
              <h2 className="text-section-title" style={{
                marginBottom:  'clamp(14px,1.5vw,22px)',
                color:         'var(--gold-primary)',
                borderLeft:    'none',
                paddingLeft:   0
              }}>{sec.titulo}</h2>

              {sec.layout === 'grid'
                ? <GridLayout items={items} />
                : <RowLayout  items={items} showProgress={false} />
              }
            </section>
          )
        })
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign:'center', padding:'80px 20px' }}>
      <span className="text-hero-title">🏠</span>
      <p className="text-section-title" style={{ color:'#d9a23a', marginTop:16 }}>
        Configure as seções da home no Supabase
      </p>
      <p className="text-metadata" style={{ color:'#666', marginTop:8 }}>
        Acesse <strong style={{color:'#d9a23a'}}>Table Editor → home_sections</strong> e insira uma linha com <code>ativo = true</code>
      </p>
    </div>
  )
}

function RowLayout({ items, showProgress }: { items: CinemaItem[]; showProgress?: boolean }) {
  return (
    <div style={{
      display:'flex', gap:'var(--card-gap)',
      overflowX:'auto', paddingBottom:8, scrollbarWidth:'none',
      width: '100%',
      maxWidth: '100%',
      WebkitOverflowScrolling: 'touch',
    } as CSSProperties} className="scroll-row no-scrollbar">
      {items.map(item => (
        <div key={item.id} style={{ width: 'var(--card-poster-w)', flexShrink: 0 }}>
          <HomeCard item={item} showProgress={showProgress} />
        </div>
      ))}
    </div>
  )
}

function GridLayout({ items }: { items: CinemaItem[] }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(var(--grid-cols, 5), 1fr)',
      gap: 'var(--card-gap, 16px)',
    }}>
      {items.map(item => <HomeCard key={item.id} item={item} />)}
    </div>
  )
}

function HomeCard({ item, showProgress }: { item: CinemaItem, showProgress?: boolean }) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)
  const img = item.poster || item.banner || item.backdrop
  
  const prefix = (item.type === 'serie' || item.type === 'series') ? 'serie' : 'filme'
  const detailUrl = `/detalhes/${prefix}-${item.id}`
  const progressPercent = (item.last_position && item.duration_seconds) ? (item.last_position / item.duration_seconds) * 100 : 0
  const remainingSecs = (item.duration_seconds || 0) - (item.last_position || 0)
  const remainingText = remainingSecs > 0 ? formatRuntime(Math.floor(remainingSecs / 60)) : ''

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setHovered(false)}
      onClick={() => router.push(detailUrl)}
      onFocus={(e) => {
        e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(detailUrl)
        }
      }}
      tabIndex={0}
      role="link"
      style={{
        width:       '100%',
        aspectRatio: '2/3',
        borderRadius: 14,
        overflow:    'hidden',
        position:    'relative',
        cursor:      'pointer',
        background:  'var(--bg-card)',
        boxShadow:   hovered ? '0 10px 30px rgba(0,0,0,0.8)' : '0 4px 18px rgba(0,0,0,0.75)',
        transform:   hovered ? 'scale(1.05)' : 'scale(1)',
        transition:  'all .4s cubic-bezier(0.165, 0.84, 0.44, 1)',
        outline:     'none',
        zIndex:      hovered ? 99 : 1,
        border:      '2px solid transparent',
      }}
      className="tv-focus"
    >
      {img ? (
        <Image
          src={img}
          alt={item.titulo || ''}
          fill
          sizes="(max-width:640px) 40vw, 180px"
          style={{ objectFit:'cover' }}
          loading="lazy"
        />
      ) : (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', fontSize:40 }}>🎬</div>
      )}

      {/* Barra de progresso Estilo Netflix Premium */}
      {showProgress && item.last_position && item.last_position > 0 && (
        <div className="absolute bottom-0 left-0 w-full p-3 bg-black/80 backdrop-blur-md">
          <div className="flex justify-between text-[11px] font-black text-white mb-2 uppercase tracking-tighter">
            <span className="text-[var(--gold-primary)]">{Math.round(progressPercent)}% VISTO</span>
            {remainingText && <span className="opacity-70">FALTAM {remainingText}</span>}
          </div>
          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--red-primary)] shadow-[0_0_12px_var(--red-primary)] transition-all duration-1000"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
