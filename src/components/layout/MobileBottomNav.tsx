'use client'
import React, { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/layout/SupabaseProvider'
import { createClient } from '@/lib/supabase'
import { Home, Film, Tv, Search, User } from 'lucide-react'

function NavContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab')
  const { user } = useAuth()
  const [isChild, setIsChild] = useState(false)

  // Busca o perfil localmente para garantir o modo infantil no menu
  useEffect(() => {
    if (user) {
      const sb = createClient()
      sb.from('profiles').select('is_child').eq('id', user.id).maybeSingle()
        .then(({ data }) => setIsChild(!!data?.is_child))
    }
  }, [user])

  // Visível em todas as páginas, o player usará Z-index superior para cobrir
  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/filmes', label: 'Filmes', icon: Film },
    { href: '/series', label: 'Séries', icon: Tv },
    { href: '/search', label: 'Localizar', icon: Search },
    { href: user ? '/perfil' : '/login', label: 'Perfil', icon: User },
  ]

  return (
    <>
      <nav className={`mobile-bottom-nav ${isChild ? 'child-mode-border' : ''}`}>
        <div className="nav-wrapper">
          <div className="nav-group">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={`nav-item ${pathname === item.href ? 'active' : ''}`} tabIndex={0}>
                <item.icon className="icon" size={22} />
                <span className="legend">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <style jsx>{`
        .mobile-bottom-nav {
          position: fixed;
          bottom: 25px;
          left: 5% !important;
          right: 5% !important;
          width: 90% !important;
          max-width: 450px !important;
          margin: 0 auto !important;
          z-index: 9999;
          background: linear-gradient(135deg, rgba(20, 20, 25, 0.9) 0%, rgba(10, 10, 15, 0.95) 100%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-top: 1px solid rgba(0, 173, 239, 0.4);
          border-radius: 28px;
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.9),
            0 0 20px rgba(0, 173, 239, 0.15),
            inset 0 1px 1px rgba(255, 255, 255, 0.1);
          padding: 12px 10px;
          transform: perspective(1000px) rotateX(2deg);
          overflow: hidden;
        }

        /* Efeito de Reflexo Glossy (Vidro Polido) */
        .mobile-bottom-nav::before {
          content: "";
          position: absolute;
          top: 0;
          left: -150%;
          width: 80%;
          height: 100%;
          background: linear-gradient(
            120deg, 
            transparent, 
            rgba(255, 255, 255, 0.1) 20%, 
            rgba(255, 255, 255, 0.3) 50%, 
            rgba(255, 255, 255, 0.1) 80%, 
            transparent
          );
          animation: shine 2.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          animation-delay: 0.8s;
          pointer-events: none;
          z-index: 1;
        }

        @keyframes shine {
          0% { left: -150%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: 150%; opacity: 0; }
        }

        .nav-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          position: relative;
          z-index: 2;
        }

        .nav-group {
          display: flex;
          flex: 1;
          justify-content: space-evenly;
          align-items: center;
        }

        .nav-item {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          flex: 1;
          text-decoration: none;
          color: #ffffff;
          transition: all 0.2s ease;
          gap: 4px;
          pointer-events: auto !important;
          touch-action: manipulation; /* Remove tap delay no mobile */
          min-width: 0;
          width: 100%;
          height: 100%;
        }

        .nav-item.active {
          color: #00ADEF;
          transform: translateY(-3px);
        }

        .icon { font-size: 22px; margin-bottom: 2px; }
        .legend { 
          font-size: 8px; 
          font-weight: 900; 
          text-transform: uppercase; 
          letter-spacing: 0.3px;
          opacity: 0.8;
          display: block !important;
          width: 100%;
          white-space: nowrap;
          text-align: center;
        }

        @media (min-width: 1024px) { .mobile-bottom-nav { display: none !important; } }
      `}</style>
    </>
  )
}

export function MobileBottomNav() {
  return (
    <Suspense fallback={null}>
      <NavContent />
    </Suspense>
  )
}