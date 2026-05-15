'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Image from 'next/image'

// Ordem de categorias permitidas
const CATEGORY_ORDER = [
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

interface Cinema {
  id: number
  titulo: string | null
  tmdb_id: number | null
  url: string | null
  trailer: string | null
  year: number | null
  rating: number | null
  description: string | null
  poster: string | null
  category: string | null
  type: string | null
  created_at: string | null
  banner: string | null
  backdrop: string | null
  duration: string | null
}

export function CinemaGrid({ contentType }: { contentType: 'movie' | 'series' }) {
  const [films,      setFilms]      = useState<Cinema[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [category,   setCategory]   = useState('all')

  useEffect(() => {
    const sb = createClient()
    sb.from('cinema')
      .select('id,titulo,tmdb_id,url,trailer,year,rating,description,poster,category,type,created_at,banner,backdrop,duration')
      .eq('type', contentType) // Filtra por tipo de conteúdo
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) {
          console.error('Supabase error:', err)
          setError(`Erro ao carregar: ${err.message}`)
          setLoading(false)
          return
        }
        const rows = (data || []) as Cinema[]
        setFilms(rows)
        setLoading(false)
      })
  }, [])

  // Função para extrair categorias válidas de um filme
  const getFilmCategories = (filmCategory: string | null): string[] => {
    if (!filmCategory) return []
    
    // Se contém vírgula, é múltiplas categorias
    const cats = filmCategory.split(',').map(c => c.trim())
    
    // Filtrar apenas as categorias permitidas
    return cats.filter(c => CATEGORY_ORDER.includes(c))
  }

  const filtered = category === 'all'
    ? films
    : films.filter(f => getFilmCategories(f.category).includes(category))

  // Group by category when showing all
  const grouped: Record<string, Cinema[]> = {}
  if (category === 'all') {
    CATEGORY_ORDER.forEach(cat => {
      const items = films.filter(f => getFilmCategories(f.category).includes(cat))
      if (items.length) grouped[cat] = items
    })
    // Uncategorized
    const uncatItems = films.filter(f => getFilmCategories(f.category).length === 0)
    if (uncatItems.length) grouped['Sem categoria'] = uncatItems
  }

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* States */}
      {loading && (
        <div style={{ padding:'0 clamp(16px,4vw,60px)' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(100px,13vw,180px),1fr))',
            gap: 'clamp(8px,1.2vw,14px)',
          }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ aspectRatio:'2/3', borderRadius:10 }} />
            ))}
          </div>
        </div>
      )}

      {error && (
        <div style={{ textAlign:'center', padding:'60px 20px' }}>
          <p style={{ color:'#ff6b6b', fontFamily:"'Open Sans',sans-serif", fontSize:14 }}>{error}</p>
          <p style={{ color:'#888', fontFamily:"'Open Sans',sans-serif", fontSize:12, marginTop:8 }}>
            Verifique se a tabela <code style={{color:'#d9a23a'}}>cinema</code> existe no Supabase e as RLS estão configuradas.
          </p>
        </div>
      )}

      {!loading && !error && films.length === 0 && (
        <div style={{ textAlign:'center', padding:'80px 20px' }}>
          <span style={{ fontSize:56 }}>🎬</span>
          <p style={{ color:'#d9a23a', fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:18, marginTop:16 }}>
            Nenhum filme na tabela cinema
          </p>
          <p style={{ color:'#666', fontFamily:"'Open Sans',sans-serif", fontSize:13, marginTop:8 }}>
            Adicione registros na tabela <strong style={{color:'#d9a23a'}}>cinema</strong> no Supabase
          </p>
        </div>
      )}

      {!loading && !error && films.length > 0 && (
        category === 'all' ? (
          // Grouped by category
          Object.entries(grouped).map(([cat, items]) => (
            <section key={cat} style={{ padding:'0 clamp(16px,4vw,60px) clamp(20px,2.5vw,36px)' }}>
              <h2 style={{
                fontFamily:    "'Inter', sans-serif",
                fontWeight:    800,
                fontSize:      'clamp(13px,1.6vw,20px)',
                color:         '#d9a23a',
                marginBottom:  'clamp(10px,1.2vw,16px)',
                borderLeft:    'none',
                paddingLeft:   0,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}>{cat}</h2>
              <CinemaRow items={items} />
            </section>
          ))
        ) : (
          // Single category — grid
          <section style={{ padding:'0 clamp(16px,4vw,60px)' }}>
            <CinemaGridFull items={filtered} />
          </section>
        )
      )}
    </div>
  )
}

/* ── Carrossel horizontal ── */
function CinemaRow({ items }: { items: Cinema[] }) {
  return (
    <div style={{
      display:          'flex',
      gap:              'clamp(10px, 1.5vw, 20px)',
      overflowX:        'auto',
      paddingBottom:    6,
      scrollbarWidth:   'none',
      WebkitOverflowScrolling: 'touch',
    } as React.CSSProperties}>
      {items.map(f => <CinemaCard key={f.id} film={f} />)}
    </div>
  )
}

/* ── Grade responsiva ── */
function CinemaGridFull({ items }: { items: Cinema[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
      {items.map(f => <CinemaCard key={f.id} film={f} />)}
    </div>
  )
}

/* ── Card individual ── */
function CinemaCard({ film }: { film: Cinema }) {
  const [hovered, setHovered] = useState(false)
  const img = film.poster || film.banner || film.backdrop

  const handleNavigate = () => {
    window.location.href = `/detalhes/${film.id}`
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setHovered(false)}
      onClick={handleNavigate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleNavigate() // Garante que o foco funcione como clique
        }
      }}
      tabIndex={0}
      role="link"
      style={{
        flexShrink:  0,
        width:       'calc((100vw - (2 * clamp(16px, 4vw, 60px)) - (2 * clamp(10px, 1.5vw, 20px))) / 3)', 
        aspectRatio: '2/3',
        borderRadius: 'var(--r-card)',
        overflow:    'hidden',
        position:    'relative',
        cursor:      'pointer',
        background:  'var(--bg-card)',
        boxShadow:   'var(--shadow-premium)',
        transform:   hovered ? 'scale(1.03) translateY(-5px)' : 'scale(1)',
        transition:  'all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)',
        outline:     'none', // O outline é tratado por :focus-visible no globals.css
      }}
    >
      {img ? (
        <Image
          src={img}
          alt={film.titulo || ''}
          fill
          sizes="(max-width:640px) 40vw, (max-width:1280px) 15vw, 180px"
          style={{ objectFit:'cover' }}
          loading="lazy"
          unoptimized
        />
      ) : (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', fontSize:40 }}>🎬</div>
      )}
    </div>
  )
}
