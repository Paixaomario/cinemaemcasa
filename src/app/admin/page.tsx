'use client'
export const dynamic = 'force-dynamic'

import { Navbar } from '@/components/layout/Navbar'

export default function AdminPage() {
  return (
    <div className="min-h-screen page-enter" style={{ background: '#000' }}>
      <Navbar />
      <div className="section-px py-8">
        <h1 className="mb-2 text-2xl font-bold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
          Painel Admin
        </h1>
        <p className="mb-8 text-sm" style={{ color: '#888', fontFamily: "'Open Sans', sans-serif" }}>
          Gerencie o conteúdo via Supabase
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: 16 }}>
          {[
            { title: 'Banco de Dados', desc: 'Acesse o Supabase para gerenciar tabelas, usuários e dados', href: 'https://app.supabase.com', icon: '🗄️' },
            { title: 'Seções da Home', desc: 'Edite a tabela home_sections no Supabase Table Editor', href: 'https://app.supabase.com', icon: '🏠' },
            { title: 'API TMDB', desc: 'Todo conteúdo vem automaticamente da API TMDB', href: 'https://www.themoviedb.org', icon: '🎬' },
          ].map(card => (
            <a key={card.title} href={card.href} target="_blank" rel="noopener noreferrer"
              style={{ display:'block', background:'#141414', border:'1px solid #2a2a2a', borderRadius:12, padding:'20px 24px', textDecoration:'none' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor='#c0392b')}
              onMouseLeave={e => (e.currentTarget.style.borderColor='#2a2a2a')}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{card.icon}</div>
              <h3 style={{ fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:16, color:'#fff', marginBottom:6 }}>
                {card.title}
              </h3>
              <p style={{ fontFamily:"'Open Sans',sans-serif", fontSize:13, color:'#888', lineHeight:1.5 }}>
                {card.desc}
              </p>
            </a>
          ))}
        </div>
        <div className="mt-10 rounded-xl p-6" style={{ background:'#141414', border:'1px solid #2a2a2a' }}>
          <h2 className="mb-4 text-lg font-bold text-white" style={{ fontFamily:"'Inter',sans-serif" }}>
            Tornar-se Admin
          </h2>
          <p style={{ fontFamily:"'Open Sans',sans-serif", fontSize:14, color:'#ccc', marginBottom:12 }}>
            Execute no SQL Editor do Supabase:
          </p>
          <pre style={{ background:'#0a0a0a', border:'1px solid #2a2a2a', borderRadius:8, padding:'12px 16px', color:'#f39c12', fontSize:13, overflowX:'auto' }}>
{`UPDATE public.profiles 
SET is_admin = true 
WHERE id = 'SEU-USER-ID';`}
          </pre>
        </div>
      </div>
    </div>
  )
}
