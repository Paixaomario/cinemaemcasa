'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { HeroBanner } from '@/components/sections/HeroBanner'
import { buildBannerPool, getMovieDetails, getShowDetails } from '@/lib/tmdb'
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

interface CinemaItem {
  id: number
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
}

export function HomeClient() {
  const router = useRouter()
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

      // ── 1. Buscar seções ativas ──────────────────────────
      const { data: secs, error: secErr } = await sb
        .from('home_sections')
        .select('id,titulo,categorias,fonte,tmdb_endpoint,layout,limite,ordenacao,posicao,ativo')
        .eq('ativo', true)
        .order('posicao', { ascending: true })

      if (secErr) {
        console.error('home_sections error:', secErr)
        // Não trava a tela em caso de erro no banco (modo desenvolvimento/sem instalação)
        setDbError('') 
        setLoading(false)
        return
      }

      const sections = (secs || []) as HomeSection[]
      setSections(sections)

      // ── 2. Para cada seção fonte=cinema, buscar filmes ───
      const map: Record<string, CinemaItem[]> = {}

      for (const sec of sections) {
        if (sec.fonte !== 'cinema') continue

        let q = sb
          .from('cinema')
          .select('id,titulo,poster,banner,backdrop,year,rating,category,type,url,duration')

        // Filtrar por categorias (se houver)
        if (sec.categorias && sec.categorias.length > 0) {
          q = q.in('category', sec.categorias)
        }

        // Ordenação
        switch (sec.ordenacao) {
          case 'rating_desc':     q = q.order('rating',     { ascending: false, nullsFirst: false }); break
          case 'year_desc':       q = q.order('year',       { ascending: false, nullsFirst: false }); break
          case 'created_at_desc': q = q.order('created_at', { ascending: false, nullsFirst: false }); break
          default:                q = q.order('created_at', { ascending: false, nullsFirst: false }); break
        }

        q = q.limit(50) // Aumentado para permitir rolagem total do acervo

        const { data, error: filmErr } = await q

        if (filmErr) {
          console.error(`cinema error (sec ${sec.titulo}):`, filmErr)
        } else {
          map[sec.id] = (data || []) as CinemaItem[]
        }
      }

      setItemsMap(map)

      // ── 2.1. Buscar "Continuar Assistindo" ───────────────
      if (user) {
        const { data: progressData } = await sb
          .from('view_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_finished', false)
          .order('updated_at', { ascending: false })
          .limit(10)

        if (progressData && progressData.length > 0) {
          const hydratedItems: any[] = await Promise.all(
            progressData.map(async (p) => {
              const idStr = String(p.content_id)
              // Se for ID local (tabela cinema)
              if (!idStr.includes('-')) {
                const { data } = await sb.from('cinema').select('*').eq('id', p.content_id).single()
                return { ...data, last_position: p.last_position, duration_seconds: (data as any)?.duration_seconds || 3600 }
              } 
              // Se for ID TMDB
              const [type, rawId] = idStr.split('-')
              try {
                const data: any = type === 'filme' ? await getMovieDetails(Number(rawId)) : await getShowDetails(Number(rawId))
                return {
                  id: idStr,
                  titulo: (data as any).title || (data as any).name,
                  poster: (data as any).poster_path ? `https://image.tmdb.org/t/p/w500${(data as any).poster_path}` : null,
                  last_position: p.last_position,
                  duration_seconds: (data as any).runtime * 60 || (data as any).episode_run_time?.[0] * 60 || 3600
                }
              } catch { return null }
            })
          )
          setContinueWatching(hydratedItems.filter(Boolean))
        }
      }

      // ── 3. Banner pool TMDB ──────────────────────────────
      try {
        const pool = await buildBannerPool('all', 20)
        setBannerPool(pool)
      } catch (e) {
        console.warn('TMDB banner error:', e)
      }

      setLoading(false)
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
          <h2 className="text-section-title border-l-4" style={{
            marginBottom:  'clamp(14px,1.5vw,22px)',
            borderColor:   'var(--gold-primary)',
            paddingLeft:   12,
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
              <h2 className="text-section-title border-l-4" style={{
                marginBottom:  'clamp(14px,1.5vw,22px)',
                borderColor:   'var(--gold-primary)',
                paddingLeft:   12,
                color:         'var(--gold-primary)'
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

function RowLayout({ items, showProgress }: { items: any[]; showProgress?: boolean }) {
  return (
    <div style={{
      display:'flex', gap:'clamp(12px, 1.5vw, 24px)',
      overflowX:'auto', paddingBottom:8, scrollbarWidth:'none',
    } as React.CSSProperties}>
      {items.map(item => <HomeCard key={item.id} item={item} showProgress={showProgress} />)}
    </div>
  )
}

function GridLayout({ items }: { items: any[] }) {
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

function HomeCard({ item, showProgress }: { item: any, showProgress?: boolean }) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)
  const img = item.poster || item.banner || item.backdrop
  
  const detailUrl = String(item.id).includes('-') ? `/detalhes/${item.id}` : `/detalhes/${item.id}`
  const progressPercent = item.last_position && item.duration_seconds ? (item.last_position / item.duration_seconds) * 100 : 0

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
          unoptimized
        />
      ) : (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', fontSize:40 }}>🎬</div>
      )}

      {/* Barra de progresso Netflix */}
      {showProgress && item.last_position > 0 && (
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
