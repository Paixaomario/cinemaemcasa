'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from './SupabaseProvider'

const NAV_LINKS = [
  { href: '/',        label: 'HOME',   icon: '🏠', labelOnly: false },
  { href: '/filmes',  label: 'FILMES', icon: '▶',  labelOnly: false },
  { href: '/series',  label: 'SÉRIES', icon: '📺', labelOnly: false },
]

const ICON_LINKS = [
  { href: '/favoritos',    icon: '❤',  title: 'Favoritos'       },
  { href: '/ao-vivo',      icon: '📡', title: 'TV ao Vivo'      },
  { href: '/assistir',     icon: '🕒', title: 'Assistir Depois' },
  { href: '/modo-cinema',  icon: '🎬', title: 'Modo Cinema'     },
]

export function Navbar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { user, signOut } = useAuth()
  const [scrolled,     setScrolled]     = useState(false)
  const [searchOpen,   setSearchOpen]   = useState(false)
  const [query,        setQuery]        = useState('')
  const [profileOpen,  setProfileOpen]  = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50)
  }, [searchOpen])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setSearchOpen(false)
      setQuery('')
    }
  }

  return (
    <>
      {/* ── FIXED WRAPPER com glass effect ── */}
      <header className="main-navbar" style={{
        position:   'fixed',
        top:        0,
        left:       0,
        right:      0,
        zIndex:     9999,
        display:    'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding:    '0 var(--container-px) clamp(12px, 2vh, 32px)',
        background: 'transparent',
        borderBottom: 'none',
      }}>

        {/* ── TOPBAR ── */}
        <div style={{
          width:          '100%',
          maxWidth:       '2400px',
          height:         'clamp(56px,7vw,110px)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          borderRadius:   '0 0 clamp(12px,1.8vw,26px) clamp(12px,1.8vw,26px)',
          border:         '2.5px solid var(--red-primary)',
          background:     'linear-gradient(90deg, #1A1A1F 0%, #0B0B0F 100%)',
          overflow:       'hidden',
          padding:        '0 clamp(8px,1.2vw,20px)',
        }}>

          {/* ── LOGO — apenas a imagem, sem texto ── */}
          <Link href="/" style={{
            height:         '100%',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            padding:        '0 clamp(8px,1.2vw,20px)',
            borderRight:    '2.5px solid rgba(180,0,0,0.65)',
            background:     'linear-gradient(180deg, #1A1A1F 0%, #0B0B0F 100%)',
            flexShrink:     0,
            minWidth:       'clamp(70px,12vw,200px)',
            textDecoration: 'none',
          }}>
            <Image
              src="/logo.png"
              alt="PAIXAOFLIX"
              width={200}
              height={80}
              priority
              style={{
                width:      'clamp(50px,10vw,175px)',
                height:     'auto',
                objectFit:  'contain',
                display:    'block',
              }}
            />
          </Link>

          {/* ── MENU CENTRAL ── */}
          <nav style={{
            flex:           1,
            display:        'flex',
            justifyContent: 'center',
            alignItems:     'center',
            gap:            'clamp(8px,2.2vw,40px)',
            padding:        '0 clamp(4px,0.8vw,12px)',
          }}>
            {/* LINKS COM LABEL */}
            {NAV_LINKS.map(({ href, label, icon }) => {
              const active = pathname === href
              return (
                <Link key={href} href={href} style={{ textDecoration:'none', outline:'none' }}>
                  <div className="text-nav"
                    style={{
                      display:    'flex',
                      alignItems: 'center',
                      gap:        'clamp(3px,0.5vw,9px)',
                      color:      active ? 'var(--gold-primary)' : 'var(--text-primary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      cursor:     'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      whiteSpace: 'nowrap',
                      fontSize:   '24px',
                      fontWeight: 500,
                      borderBottom: active ? '3px solid var(--gold-primary)' : 'none',
                      paddingBottom: active ? '6px' : '0',
                    }}
                  >
                    <span style={{
                      width:           'clamp(16px,1.9vw,32px)',
                      height:          'clamp(16px,1.9vw,32px)',
                      display:         'flex',
                      justifyContent:  'center',
                      alignItems:      'center',
                      borderRadius:    '50%',
                      background:      active ? 'rgba(245,199,107,0.12)' : 'rgba(255,255,255,0.04)',
                      border:          `1.5px solid ${active ? 'var(--gold-primary)' : 'var(--border-primary)'}`,
                      flexShrink:      0,
                    }}>{icon}</span>
                    <span className="nav-lbl">{label}</span>
                  </div>
                </Link>
              )
            })}

            {/* SEPARADOR */}
            <div style={{ width:1, height:'clamp(20px,3vw,40px)', background:'var(--border-primary)', flexShrink:0 }} />

            {/* ÍCONES APENAS */}
            {ICON_LINKS.map(({ href, icon, title }) => {
              const active = pathname === href
              return (
                <Link key={href} href={href} title={title} style={{ textDecoration:'none', outline:'none' }}>
                  <span style={{
                    width:          'clamp(16px,1.9vw,32px)',
                    height:         'clamp(16px,1.9vw,32px)',
                    display:        'flex',
                    justifyContent: 'center',
                    alignItems:     'center',
                    borderRadius:   '50%',
                    border:         `1.5px solid ${active ? 'var(--gold-primary)' : 'var(--border-primary)'}`,
                    background:     active ? 'rgba(245,199,107,0.12)' : 'rgba(255,255,255,0.04)',
                    color:          active ? 'var(--gold-primary)' : 'var(--text-primary)',
                    fontSize:       '24px',
                    cursor:         'pointer',
                    transition:     'all 0.2s ease-out',
                    flexShrink:     0,
                  }}
                  >{icon}</span>
                </Link>
              )
            })}
          </nav>

          {/* ── ÁREA DIREITA ── */}
          <div style={{ display:'flex', alignItems:'center', gap:'clamp(5px,0.8vw,12px)', flexShrink:0 }}>

            {/* BUSCA */}
            {searchOpen ? (
              <form onSubmit={handleSearch}>
                <input
                  ref={searchRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="text-search"
                  style={{
                    background:  'rgba(255,255,255,0.06)',
                    border:      '2px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    padding:     '18px 24px',
                    color:       '#fff',
                    outline:     'none',
                    width:       'clamp(120px, 14vw, 220px)',
                    fontSize:    '22px',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'var(--gold-primary)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-gold)'
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                title="Buscar"
                style={{
                  width:          'clamp(32px,4vw,64px)',
                  height:         'clamp(32px,3.6vw,58px)',
                  display:        'flex',
                  justifyContent: 'center',
                  alignItems:     'center',
                  borderRadius:   9,
                  background:     'linear-gradient(180deg, var(--gold-hover) 0%, var(--gold-primary) 100%)',
                  border:         '1.5px solid var(--border-gold)',
                  boxShadow:      'var(--shadow-gold)',
                  cursor:         'pointer',
                  transition:     '0.18s ease',
                  fontSize:       'clamp(11px,1.3vw,20px)',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform='scale(1.06)')}
                onMouseLeave={e => (e.currentTarget.style.transform='scale(1)')}
                ><span className="text-nav">🔍</span></button>
            )}

            {/* ENTRAR / PERFIL */}
            {user ? (
              <div style={{ position:'relative' }}>
                <button className="text-nav font-bold"
                  onClick={() => setProfileOpen(!profileOpen)}
                  style={{
                    height:      'clamp(32px,3.6vw,58px)',
                    padding:     '0 clamp(8px,1.2vw,20px)',
                    display:     'flex',
                    alignItems:  'center',
                    gap:         'clamp(4px,0.6vw,8px)',
                    borderRadius: 9,
                    border:      '1.5px solid var(--red-primary)',
                    background:  'linear-gradient(180deg, var(--red-hover) 0%, var(--red-primary) 100%)',
                    color:       '#fff',
                    letterSpacing: '0.06em',
                    cursor:      'pointer',
                    boxShadow:   'var(--shadow-red)',
                    transition:  '0.18s ease',
                    whiteSpace:  'nowrap',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform='scale(1.05)')}
                  onMouseLeave={e => (e.currentTarget.style.transform='scale(1)')}
                >
                  <span>👤</span>
                  <span className="nav-lbl">PERFIL</span>
                </button>

                {profileOpen && (
                  <div style={{
                    position:  'absolute',
                    right:     0,
                    top:       'calc(100% + 8px)',
                    background:'var(--bg-card)',
                    border:    '1px solid var(--border-primary)',
                    borderRadius: 12,
                    overflow:  'hidden',
                    minWidth:  175,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.85)',
                    animation: 'navFadeDown 0.2s ease',
                  }}>
                    <div style={{ padding:'10px 14px', borderBottom:'1px solid #3a0000' }}>
                      <p style={{ color:'var(--gold-primary)', fontFamily:"'Open Sans',sans-serif", fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {user.email}
                      </p>
                    </div>
                    {[
                      { href:'/perfil',    label:'Meu Perfil'   },
                      { href:'/favoritos', label:'Favoritos'    },
                      { href:'/admin',     label:'Painel Admin' },
                    ].map(({ href, label }) => (
                      <Link key={href} href={href} onClick={() => setProfileOpen(false)} style={{
                        display:'block', padding:'9px 14px',
                        fontFamily:"'Inter',sans-serif", fontWeight:600, fontSize:13,
                        color:'var(--text-primary)', textDecoration:'none', transition:'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background='#3a0000')}
                      onMouseLeave={e => (e.currentTarget.style.background='transparent')}
                      >{label}</Link>
                    ))}
                    <button onClick={() => { signOut(); setProfileOpen(false) }} style={{
                      display:'block', width:'100%', padding:'9px 14px',
                      fontFamily:"'Inter',sans-serif", fontWeight:600, fontSize:13,
                      color:'#ff6b6b', background:'none', border:'none', cursor:'pointer',
                      textAlign:'left', borderTop:'1px solid #3a0000',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background='#3a0000')}
                    onMouseLeave={e => (e.currentTarget.style.background='transparent')}
                    >Sair</button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" style={{ textDecoration:'none' }}>
                <div className="text-nav font-bold" style={{
                  height:      'clamp(32px,3.6vw,58px)',
                  padding:     '0 clamp(8px,1.2vw,20px)',
                  display:     'flex',
                  alignItems:  'center',
                  gap:         'clamp(4px,0.6vw,8px)',
                  borderRadius: 9,
                  border:      '1.5px solid var(--red-primary)',
                  background:  'linear-gradient(180deg, var(--red-hover) 0%, var(--red-primary) 100%)',
                  color:       '#fff',
                  letterSpacing: '0.06em',
                  cursor:      'pointer',
                  boxShadow:   'var(--shadow-red)',
                  transition:  '0.18s ease',
                  whiteSpace:  'nowrap',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform='scale(1.05)')}
                onMouseLeave={e => (e.currentTarget.style.transform='scale(1)')}
                >
                  <span>👤</span>
                  <span className="nav-lbl">ENTRAR</span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </header>

      <style>{`
        @keyframes navFadeDown {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        @media (max-width: 600px) { .nav-lbl { display:none !important; } }
        @media (max-width: 768px) {
          .main-navbar { display: none !important; }
        }
      `}</style>
    </>
  )
}
