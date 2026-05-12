'use client'
export const dynamic = 'force-dynamic'

import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { useAuth } from '@/components/layout/SupabaseProvider'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function FavoritosPage() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const sb = createClient()
    sb.from('favorites').select('*, content(*)').eq('user_id', user.id)
      .then(({ data }) => { setFavorites(data || []); setLoading(false) })
  }, [user])

  return (
    <div className="relative min-h-screen" style={{ background: '#000' }}>
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <Image src="/bg-family.jpg" alt="" fill className="object-cover" />
      </div>
      <div className="relative z-10">
        <Navbar />
        <div className="section-px py-8 page-enter">
          <h1 className="mb-6 text-2xl font-bold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            Meus Favoritos
          </h1>
          {loading ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 10 }} />
              ))}
            </div>
          ) : !user ? (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
              <span style={{ fontSize: 64 }}>🔒</span>
              <p className="text-lg font-semibold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
                Faça login para ver seus favoritos
              </p>
              <Link href="/login" className="btn btn-red btn-sm">Entrar</Link>
            </div>
          ) : favorites.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
              <span style={{ fontSize: 64 }}>🎬</span>
              <p className="text-lg font-semibold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
                Nenhum favorito ainda
              </p>
              <Link href="/" className="btn btn-red btn-sm">Explorar</Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {favorites.map((fav: any) => fav.content && (
                <Link key={fav.id} href={`/detalhes/${fav.content_id}`}
                  className="card-poster block">
                  <div className="relative h-full w-full" style={{ background: '#1a1a1a' }}>
                    {fav.content.thumbnail_url ? (
                      <Image src={fav.content.thumbnail_url} alt={fav.content.title} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl">🎬</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
