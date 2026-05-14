'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './SupabaseProvider'

export function MobileBottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  // Não exibir na página de exibição (detalhes/player)
  if (pathname?.startsWith('/detalhes')) return null

  const navItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/filmes', label: 'Filmes', icon: '🎬' },
    { href: '/series', label: 'Séries', icon: '📺' },
    { href: '/perfil', label: 'Favoritos', icon: '❤️' },
    { href: '/perfil', label: 'Assistir Depois', icon: '⏰' },
    { href: '/localizar', label: 'Localizar', icon: '🔍' },
    { href: user ? '/perfil' : '/login', label: 'Perfil', icon: '👤' },
  ]

  return (
    <>
      <nav className="mobile-bottom-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <style jsx>{`
        /* =========================================================
           PAIXAOFLIX - BARRA DE RODAPÉ MOBILE (MODELO 2 - GLASS)
           ========================================================= */
        
        .mobile-bottom-nav {
          position: fixed;
          bottom: 18px;
          left: 0;
          right: 0;
          margin: 0 auto;
          z-index: 5000; /* Abaixo do VideoPlayer que é 10000 */

          width: min(95vw, 860px);
          height: 92px;

          display: flex;
          justify-content: space-around;
          align-items: center;

          padding: 12px 18px;
          border-radius: 40px;

          /* efeito glass / fosco */
          background: rgba(20, 10, 10, 0.55);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);

          /* borda metálica leve */
          border: 2px solid rgba(255, 140, 80, 0.22);

          /* sombra suave de flutuação */
          box-shadow:
            0px 18px 40px rgba(0, 0, 0, 0.75),
            0px 0px 16px rgba(255, 40, 40, 0.12);

          overflow: hidden;
          transition: transform 0.3s ease;
        }

        /* Ocultar em Desktop */
        @media (min-width: 769px) {
          .mobile-bottom-nav {
            display: none !important;
          }
        }

        /* brilho inferior bem discreto (efeito 3D) */
        .mobile-bottom-nav::after {
          content: "";
          position: absolute;
          bottom: -18px;
          left: 12%;
          width: 76%;
          height: 40px;
          background: radial-gradient(
            ellipse,
            rgba(255, 0, 0, 0.18) 0%,
            rgba(255, 0, 0, 0.08) 45%,
            rgba(255, 0, 0, 0.00) 70%
          );
          filter: blur(10px);
          opacity: 0.55;
          pointer-events: none;
        }

        /* linha superior metálica leve */
        .mobile-bottom-nav::before {
          content: "";
          position: absolute;
          top: 0;
          left: 8%;
          width: 84%;
          height: 2px;
          background: linear-gradient(
            90deg,
            rgba(255, 140, 80, 0.00) 0%,
            rgba(255, 180, 120, 0.22) 50%,
            rgba(255, 140, 80, 0.00) 100%
          );
          opacity: 0.55;
          pointer-events: none;
        }

        .nav-item {
          position: relative;
          z-index: 5;
          width: 95px;
          height: 70px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 7px;
          text-decoration: none;
          cursor: pointer;
          border-radius: 18px;
          transition: 0.2s ease;
        }

        .nav-item .icon {
          font-size: 24px;
          color: rgba(255, 190, 90, 0.75);
          transition: 0.2s ease;
        }

        .nav-item span {
          font-size: 14px;
          font-weight: 700;
          color: rgba(255, 190, 90, 0.72);
          letter-spacing: 0.2px;
          transition: 0.2s ease;
        }

        .nav-item.active {
          background: rgba(255, 0, 0, 0.06);
          border: 2px solid rgba(255, 60, 60, 0.15);
          box-shadow:
            inset 0px 0px 14px rgba(255, 0, 0, 0.15),
            0px 0px 18px rgba(255, 0, 0, 0.10);
        }

        .nav-item.active .icon,
        .nav-item.active span {
          color: rgba(255, 90, 60, 0.85);
        }

        .nav-item:hover {
          transform: translateY(-2px);
        }

        .nav-item:hover .icon,
        .nav-item:hover span {
          color: rgba(255, 220, 150, 0.95);
        }

        @media (max-width: 640px) {
          .mobile-bottom-nav {
            height: 82px;
            border-radius: 25px;
            padding: 8px 4px;
            bottom: 12px;
          }
          .nav-item {
            width: auto;
            flex: 1;
            height: 60px;
            gap: 2px;
          }
          .nav-item .icon { font-size: 18px; }
          .nav-item span { font-size: 9px; text-align: center; line-height: 1.1; }
        }
      `}</style>
    </>
  )
}