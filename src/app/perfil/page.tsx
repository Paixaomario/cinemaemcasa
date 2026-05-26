'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Navbar } from '@/components/layout/Navbar'
import { useAuth } from '@/components/layout/SupabaseProvider'
import { CinemaItem } from '@/app/HomeClient'
import { hydrateCinemaItem } from '@/lib/content'
import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import { ContinueWatchingSection } from '@/components/profile/ContinueWatchingSection'
import { SettingsSection } from '@/components/profile/SettingsSection'
import { DevicesSection } from '@/components/profile/DevicesSection'

interface ProfileItem {
  id: string | number;
  titulo: string | null;
  poster: string | null;
  backdrop?: string | null;
  type?: string | null;
}

interface ContinueWatchingItem extends CinemaItem {
  progress?: number
  duration?: number
  episode?: number
  season?: number
}

export default function PerfilPage() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [favorites, setFavorites] = useState<ProfileItem[]>([])
  const [history, setHistory] = useState<ProfileItem[]>([])
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const userId = user.id
    async function loadData() {
      const sb = createClient()

      // 1. Buscar perfil
      const { data: profileData } = await sb
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      setProfile(profileData)

      // 2. Buscar Favoritos
      const { data: favs } = await sb
        .from('favorites')
        .select('content_id')
        .eq('user_id', userId)

      if (favs) {
        const hydratedFavs = await Promise.all(
          favs.map(f => hydrateCinemaItem(sb, f.content_id))
        )
        setFavorites(hydratedFavs.filter(Boolean) as ProfileItem[])
      }

      // 3. Buscar Histórico (view_progress)
      const { data: prog } = await sb
        .from('view_progress')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (prog) {
        const hydratedHistory = await Promise.all(
          prog.map(p => hydrateCinemaItem(sb, p.content_id))
        )
        setHistory(hydratedHistory.filter(Boolean) as ProfileItem[])

        // 4. Criar lista de continuar assistindo com progresso
        const continueWatchingItems = await Promise.all(
          prog.map(async (p) => {
            const item = await hydrateCinemaItem(sb, p.content_id)
            if (!item) return null
            return {
              ...item,
              progress: p.last_position,
              duration: 6000, // valor padrão em segundos
            }
          })
        )
        setContinueWatching(continueWatchingItems.filter(Boolean) as ContinueWatchingItem[])
      }

      setLoading(false)
    }

    loadData()
  }, [user])

  const handleAvatarChange = async (file: File) => {
    if (!user) return

    const sb = createClient()
    // TODO: Implementar upload para Supabase Storage
    console.log('Avatar change:', file.name)
  }

  const handleSettingsChange = async (settings: any) => {
    if (!user) return

    const sb = createClient()
    // TODO: Salvar configurações no banco
    console.log('Settings change:', settings)
  }

  const handleLogoutDevice = async (deviceId: string) => {
    // TODO: Implementar logout de dispositivo
    console.log('Logout device:', deviceId)
  }

  if (authLoading || (user && loading)) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-[var(--gold-primary)] font-bold uppercase tracking-tighter text-2xl animate-pulse">Carregando Perfil Premium...</div>
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <Navbar />
        <h1 className="text-3xl font-bold mb-4">Acesso Restrito</h1>
        <p className="text-gray-400 mb-8">Faça login para gerenciar seus favoritos e histórico.</p>
        <Link href="/login" className="px-10 py-4 bg-[#00ADEF] text-white font-montserrat font-black uppercase rounded-[20px] transition-transform hover:scale-105">Entrar no PAIXÃOFLIX</Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      <Navbar />

      {/* Marca d'água de fundo */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none scale-110">
        <Image
          src="/bg-family.jpg"
          alt=""
          fill
          className="object-cover blur-[2px]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/40 to-black" />
      </div>

      <div className="relative z-10 pt-32 sm:pt-40 px-[var(--container-px)] pb-20 max-w-[2400px] mx-auto">
        {/* Header do Perfil */}
        <header className="mb-16 flex flex-col sm:flex-row items-center gap-6 sm:gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <ProfileAvatar
            avatarUrl={profile?.avatar_url}
            username={profile?.username || profile?.full_name || user.email}
            onAvatarChange={handleAvatarChange}
            editable={true}
          />
          <div className="text-center sm:text-left">
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-white drop-shadow-2xl">
              {profile?.full_name || profile?.username || 'Meu Perfil'}
            </h1>
            <p className="text-lg sm:text-xl text-[var(--gold-primary)] font-bold mt-2 opacity-80">{user.email}</p>
            {profile?.is_admin && (
              <span className="inline-block mt-2 px-3 py-1 bg-[var(--gold-primary)] text-black text-xs font-bold uppercase rounded-full">
                Administrador
              </span>
            )}
          </div>
        </header>

        {/* Seções do Perfil */}
        <div className="space-y-16 sm:space-y-20">
          <ContinueWatchingSection items={continueWatching} />
          <Section title="Meus Favoritos" items={favorites} color="var(--gold-primary)" emptyMsg="Nenhum conteúdo favoritado ainda." />
          <Section title="Histórico de Reprodução" items={history} color="var(--red-primary)" emptyMsg="Você ainda não iniciou nenhum vídeo." />
          <SettingsSection onSettingsChange={handleSettingsChange} />
          <DevicesSection onLogoutDevice={handleLogoutDevice} />
        </div>
      </div>
    </main>
  )
}

function Section({ title, items, color, emptyMsg }: { title: string, items: ProfileItem[], color: string, emptyMsg: string }) {
  return (
    <section className="animate-in fade-in slide-in-from-left-4 duration-1000">
      <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 flex items-center gap-4" style={{ color }}>
        <span className="w-2 h-10 rounded-full" style={{ backgroundColor: color }}></span>
        {title}
      </h2>

      {items.length === 0 ? (
        <div className="p-10 rounded-3xl bg-white/5 border border-white/5 text-gray-500 font-medium italic">
          {emptyMsg}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {items.map(item => {
            const isSeries = (item.type === 'serie' || item.type === 'series')
            const posterPath = item.poster || item.backdrop
            if (!posterPath && !item.titulo) return null
            const imageUrl = posterPath

            return (
            <Link
              key={item.id}
              href={isSeries ? `/series/${item.id}` : `/detalhes/${item.id}`}
              className="relative aspect-[2/3] w-full group rounded-xl overflow-hidden bg-neutral-900 border border-white/5 hover:border-brand-cyan transition-all shadow-xl"
            >
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={item.titulo || ''}
                  fill
                  className="object-cover transition-transform group-hover:scale-110"
                  unoptimized
                />
              ) : (
                <div className="flex items-center justify-center h-full text-5xl">🎬</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <p className="text-xs font-black uppercase truncate text-white drop-shadow-md">{item.titulo}</p>
              </div>
            </Link>
          )})}
        </div>
      )}
    </section>
  )
}