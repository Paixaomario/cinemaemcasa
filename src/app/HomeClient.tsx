'use client'

import { useEffect, useState, CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { HeroBanner } from '@/components/sections/HeroBanner'
import { buildBannerPool, getMovieDetails, getShowDetails, TMDBMovie, TMDBShow } from '@/lib/tmdb'
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
}

export function HomeClient() {
  const { user } = useAuth()
  const [sections,   setSections]   = useState<HomeSection[]>([])
  const [itemsMap,   setItemsMap]   = useState<Record<string, CinemaItem[]>>({})
  const [continueWatching, setContinueWatching] = useState<CinemaItem[]>([])
  const [bannerPool, setBannerPool] = useState<Array<TMDBMovie | TMDBShow>>([])
  const [loading,    setLoading]    = useState(true)
  const [dbError,    setDbError]    = useState('')

  useEffect(() => {
    async function load() {
      const sb = createClient()
      const globalSeenIds = new Set<string | number>()

      // Obter lista de IDs do TMDB que realmente existem no nosso acervo (tabela cinema)
      const { data: dbCinemaItems } = await sb.from('cinema').select('tmdb_id')
      const allowedTmdbIds = new Set(dbCinemaItems?.map(x => x.tmdb_id).filter(Boolean))

      try {
        // 1. Processar "Continuar Assistindo" PRIMEIRO
        if (user) {
          const { data: progressData } = await sb
            .from('view_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_finished', false)
            .order('updated_at', { ascending: false })
            .limit(5)

          if (progressData && progressData.length > 0) {
            const hydrated = await Promise.all(
              progressData.map(async (p) => {
                const idStr = String(p.content_id)
                let item: any = null
                if (!idStr.includes('-')) {
                  const { data } = await sb.from('cinema').select('*').eq('id', p.content_id).single()
                  item = data
                } else {
                  const [type, rawId] = idStr.split('-')
                  try {
                    // Busca direta pelo ID do filme para evitar dados de coleção agrupados
                    item = type === 'filme' ? await getMovieDetails(Number(rawId)) : await getShowDetails(Number(rawId))
                  } catch { return null }
                }
                if (item) {
                  globalSeenIds.add(idStr) // Bloqueia ID do histórico para o resto da home
                  return {
                    ...item,
                    id: idStr,
                    titulo: item.titulo || item.title || item.name,
                    poster: item.poster || (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null),
                    last_position: p.last_position,
                    duration_seconds: item.duration_seconds || (item.runtime * 60) || 3600
                  }
                }
                return null
              })
            )
            setContinueWatching(hydrated.filter(Boolean) as CinemaItem[])
          }
        }

        // 2. Buscar definições de seções
        const { data: secs, error: secErr } = await sb
          .from('home_sections')
          .select('id,titulo,categorias,fonte,tmdb_endpoint,layout,limite,ordenacao,posicao,ativo')
          .eq('ativo', true)
          .order('posicao', { ascending: true })

        if (secErr) throw secErr
        const homeSections = (secs || []) as HomeSection[]
        setSections(homeSections)

        // 3. Buscar e filtrar itens de cada seção (sequencialmente)
        const sectionsPromises = homeSections.map(async (sec) => {
          if (sec.fonte !== 'cinema') return { id: sec.id, items: [] as CinemaItem[], limit: sec.limite }
          
          let q = sb.from('cinema').select('id,titulo,poster,banner,backdrop,year,rating,category,type,url,duration')
          if (sec.categorias && sec.categorias.length > 0) q = q.in('category', sec.categorias)
          
          switch (sec.ordenacao) {
            case 'rating_desc': q = q.order('rating', { ascending: false, nullsFirst: false }); break
            case 'year_desc':   q = q.order('year', { ascending: false, nullsFirst: false }); break
            default:            q = q.order('created_at', { ascending: false, nullsFirst: false }); break
          }

          const { data } = await q.limit((sec.limite || 5) * 3) // Buffer para filtragem
          return { id: sec.id, items: (data || []) as CinemaItem[], limit: sec.limite || 5 }
        })

        const resolved = await Promise.all(sectionsPromises)
        const newMap: Record<string, CinemaItem[]> = {}

        resolved.forEach(res => {
          const filtered: CinemaItem[] = []
          for (const item of res.items) {
            const idKey = String(item.id)
            if (idKey && !globalSeenIds.has(idKey)) {
              filtered.push(item)
              globalSeenIds.add(idKey) // Bloqueia este ID para que nunca repita na página
            }
            if (filtered.length >= (res.limit || 5)) break
          }
          newMap[res.id] = filtered
        })
        setItemsMap(newMap)

        // 4. Carregar Banner Pool (TMDB) filtrando apenas o que temos no banco
        const rawPool = await buildBannerPool('all', 60) // Busca mais para ter margem de filtragem
        const pool = rawPool.filter(item => allowedTmdbIds.has(item.id))
        setBannerPool(pool.slice(0, 20))

      } catch (err) {
        console.error('Erro no carregamento da Home:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user])

  if (loading) {
    return (
      <div style={{ paddingBottom: 60 }}>
        <div className="skeleton" style={{ width:'100%', height:'clamp(260px,50vw,650px)' }} />
        <div style={{ padding:'24px clamp(16px,4vw,60px)' }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ marginBottom:32 }}>
              <div className="skeleton" style={{ width:240, height:30, borderRadius:6, marginBottom:14 }} />
              <div style={{ display:'flex', gap:12 }}>
                {Array.from({ length:5 }).map((_,j) => (
                  <div key={j} className="skeleton" style={{ width:'var(--card-poster-w)', aspectRatio:'2/3', borderRadius:10, flexShrink:0 }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (dbError) {
    return (
      <div style={{ textAlign:'center', padding:'80px 20px' }}>
        <span className="text-hero-title">⚠️</span>
        <p className="text-section-title" style={{ color:'#ff6b6b', marginTop:16 }}>{dbError}</p>
        <p className="text-metadata" style={{ color:'#888', marginTop:8 }}>
          Execute o SQL <code style={{color:'#d9a23a'}}>fix_cinema_rls.sql</code> no Supabase
        </p>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Hero Banner */}
      {bannerPool.length > 0 && (
        <HeroBanner type="all" initialPool={bannerPool} />
      )}

      {/* Seção Continuar Assistindo */}
      {continueWatching.length > 0 && (
        <section style={{ padding:'0 var(--container-px) var(--section-gap)' }}>
          <h2 className="text-section-title" style={{
            marginBottom:  'clamp(14px,1.5vw,22px)',
            color:         'var(--gold-primary)',
            borderLeft:    '0',
            paddingLeft:   0
          }}>Continuar Assistindo</h2>
          <RowLayout items={continueWatching} showProgress />
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
                borderLeft:    '0',
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
      display:'flex', gap:'clamp(12px, 1.5vw, 24px)',
      overflowX:'auto', paddingBottom:8, scrollbarWidth:'none',
      width: '100%',
      maxWidth: '100%',
      WebkitOverflowScrolling: 'touch',
    } as CSSProperties}>
      {items.map(item => <HomeCard key={item.id} item={item} showProgress={showProgress} />)}
    </div>
  )
}

function GridLayout({ items }: { items: CinemaItem[] }) {
  return (
    <div style={{
      display:'grid',
      gridTemplateColumns:'repeat(5, 1fr)',
      gap:'clamp(16px, 2vw, 32px)',
    }}>
      {items.map(item => <HomeCard key={item.id} item={item} />)}
    </div>
  )
}

function HomeCard({ item, showProgress }: { item: CinemaItem, showProgress?: boolean }) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)
  const img = item.poster || item.banner || item.backdrop
  
  const detailUrl = `/detalhes/${item.id}`
  const progressPercent = (item.last_position && item.duration_seconds) ? (item.last_position / item.duration_seconds) * 100 : 0

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
        flexShrink:  0,
        width:       'var(--card-poster-w)',
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

      {/* Barra de progresso Netflix */}
      {showProgress && item.last_position && item.last_position > 0 && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 4, background: 'rgba(255,255,255,0.2)' }}>
          <div style={{ 
            width: `${Math.min(progressPercent, 100)}%`, 
            height: '100%', 
            background: 'var(--red-primary)',
            boxShadow: '0 0 10px var(--red-primary)' 
          }} />
        </div>
      )}
    </div>
  )
}
