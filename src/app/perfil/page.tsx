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
import { StatisticsSection } from '@/components/profile/StatisticsSection'
import { AccessibilitySection } from '@/components/profile/AccessibilitySection'
import { uploadAvatar } from '@/lib/avatarUpload'
import { saveProfileSettings, getProfileSettings } from '@/lib/profileSettings'
import { getUserDevices, logoutDevice, detectDeviceType, detectDeviceName } from '@/lib/deviceManager'
import { getProfileStatistics } from '@/lib/profileStatistics'

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
  const [settings, setSettings] = useState<any>(null)
  const [accessibilitySettings, setAccessibilitySettings] = useState<any>(null)
  const [devices, setDevices] = useState<any[]>([])
  const [statistics, setStatistics] = useState<any>(null)
  const [editingName, setEditingName] = useState(false)
  const [tempName, setTempName] = useState('')
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

        // Atualizar estatísticas após carregar histórico
        const { updateProfileStatistics } = await import('@/lib/profileStatistics')
        await updateProfileStatistics(userId)

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

      // 5. Buscar configurações do perfil
      try {
        const profileSettings = await getProfileSettings(userId)
        setSettings(profileSettings)
      } catch (error) {
        console.error('Erro ao buscar configurações:', error)
        setSettings({
          language: 'pt-BR',
          subtitles: 'off',
          video_quality: 'auto',
          data_saver: false,
        })
      }

      // 6. Buscar configurações de acessibilidade
      try {
        const { data: accSettings } = await sb
          .from('accessibility_settings')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()

        if (accSettings) {
          setAccessibilitySettings(accSettings)
        } else {
          setAccessibilitySettings({
            subtitle_size: 'medium',
            subtitle_color: 'white',
            subtitle_background: 'black',
            audio_description: false,
            high_contrast: false,
            reduced_motion: false,
          })
        }
      } catch (error) {
        console.error('Erro ao buscar configurações de acessibilidade:', error)
        setAccessibilitySettings({
          subtitle_size: 'medium',
          subtitle_color: 'white',
          subtitle_background: 'black',
          audio_description: false,
          high_contrast: false,
          reduced_motion: false,
        })
      }

      // 7. Buscar dispositivos conectados
      try {
        const userDevices = await getUserDevices(userId)
        setDevices(userDevices)
      } catch (error) {
        console.error('Erro ao buscar dispositivos:', error)
        setDevices([])
      }

      // 8. Buscar estatísticas do perfil
      try {
        const profileStats = await getProfileStatistics(userId)
        setStatistics(profileStats)
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error)
        setStatistics({
          total_watch_time: 0,
          movies_watched: 0,
          series_watched: 0,
          episodes_watched: 0,
          last_watch_date: null,
          most_watched_genre: null,
        })
      }

      // 9. Registrar dispositivo atual
      try {
        const userAgent = navigator.userAgent
        const deviceType = detectDeviceType(userAgent)
        const deviceName = detectDeviceName(userAgent)

        // Gerar ou recuperar ID do dispositivo
        let deviceId = localStorage.getItem('device_id')
        if (!deviceId) {
          deviceId = crypto.randomUUID()
          localStorage.setItem('device_id', deviceId)
        }

        // Verificar se dispositivo já existe
        const { data: existingDevice } = await sb
          .from('connected_devices')
          .select('*')
          .eq('user_id', userId)
          .eq('device_id', deviceId)
          .maybeSingle()

        if (existingDevice) {
          // Atualizar último acesso
          await sb
            .from('connected_devices')
            .update({
              last_active: new Date().toISOString(),
              is_current: true,
            })
            .eq('id', existingDevice.id)
        } else {
          // Criar novo dispositivo
          await sb
            .from('connected_devices')
            .insert({
              user_id: userId,
              device_id: deviceId,
              device_name: deviceName,
              device_type: deviceType,
              user_agent: userAgent,
              last_active: new Date().toISOString(),
              is_current: true,
            })
        }
      } catch (error) {
        console.error('Erro ao registrar dispositivo:', error)
      }

      setLoading(false)
    }

    loadData()
  }, [user])

  const handleAvatarChange = async (file: File) => {
    if (!user) return

    try {
      const avatarUrl = await uploadAvatar(file, user.id)
      setProfile({ ...profile, avatar_url: avatarUrl })
      alert('Avatar atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar avatar:', error)
      alert('Erro ao atualizar avatar. Tente novamente.')
    }
  }

  const handleSettingsChange = async (newSettings: any) => {
    if (!user) return

    try {
      await saveProfileSettings(user.id, newSettings)
      setSettings(newSettings)
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      alert('Erro ao salvar configurações. Tente novamente.')
    }
  }

  const handleAccessibilityChange = async (newSettings: any) => {
    if (!user) return

    const sb = createClient()
    try {
      const { data: existing } = await sb
        .from('accessibility_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (existing) {
        await sb
          .from('accessibility_settings')
          .update(newSettings)
          .eq('user_id', user.id)
      } else {
        await sb
          .from('accessibility_settings')
          .insert({
            user_id: user.id,
            ...newSettings
          })
      }
      setAccessibilitySettings(newSettings)
    } catch (error) {
      console.error('Erro ao salvar configurações de acessibilidade:', error)
      alert('Erro ao salvar configurações de acessibilidade. Tente novamente.')
    }
  }

  const handleLogoutDevice = async (deviceId: string) => {
    if (!user) return
    try {
      await logoutDevice(user.id, deviceId)
      setDevices(devices.filter(d => d.id !== deviceId))
      alert('Dispositivo desconectado com sucesso')
    } catch (error) {
      console.error('Erro ao desconectar dispositivo:', error)
      alert('Erro ao desconectar dispositivo')
    }
  }

  const handleDeleteHistoryItem = async (itemId: string) => {
    if (!user) return
    const sb = createClient()
    try {
      await sb
        .from('view_progress')
        .delete()
        .eq('content_id', itemId)
        .eq('user_id', user.id)
      setHistory(history.filter(item => item.id !== itemId))
    } catch (error) {
      console.error('Erro ao deletar item do histórico:', error)
      alert('Erro ao deletar item do histórico')
    }
  }

  const handleClearHistory = async () => {
    if (!user) return
    if (!confirm('Tem certeza que deseja limpar todo o histórico de reprodução?')) return
    const sb = createClient()
    try {
      await sb
        .from('view_progress')
        .delete()
        .eq('user_id', user.id)
      setHistory([])
    } catch (error) {
      console.error('Erro ao limpar histórico:', error)
      alert('Erro ao limpar histórico')
    }
  }

  const handleSaveName = async () => {
    if (!user || !tempName.trim()) return
    const sb = createClient()
    try {
      await sb
        .from('profiles')
        .update({ full_name: tempName.trim() })
        .eq('id', user.id)
      setProfile({ ...profile, full_name: tempName.trim() })
      setEditingName(false)
    } catch (error) {
      console.error('Erro ao atualizar nome:', error)
      alert('Erro ao atualizar nome')
    }
  }

  const handleCancelEditName = () => {
    setTempName(profile?.full_name || profile?.username || '')
    setEditingName(false)
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    if (!confirm('Tem certeza que deseja excluir sua conta? Esta ação é IRREVERSÍVEL e apagará todos os seus dados permanentemente.')) return
    if (!confirm('Tem certeza ABSOLUTA? Todos os seus dados serão perdidos para sempre.')) return

    const sb = createClient()
    try {
      // Deletar todos os dados do usuário
      await sb.from('profile_settings').delete().eq('user_id', user.id)
      await sb.from('accessibility_settings').delete().eq('user_id', user.id)
      await sb.from('connected_devices').delete().eq('user_id', user.id)
      await sb.from('active_sessions').delete().eq('user_id', user.id)
      await sb.from('profile_statistics').delete().eq('user_id', user.id)
      await sb.from('view_progress').delete().eq('user_id', user.id)
      await sb.from('favorites').delete().eq('user_id', user.id)
      await sb.from('profiles').delete().eq('id', user.id)

      // Deletar usuário do auth
      const { error: authError } = await sb.auth.admin.deleteUser(user.id)

      if (authError) {
        console.error('Erro ao deletar usuário do auth:', authError)
        alert('Erro ao deletar conta. Entre em contato com o suporte.')
        return
      }

      alert('Conta excluída com sucesso. Redirecionando...')
      window.location.href = '/'
    } catch (error) {
      console.error('Erro ao excluir conta:', error)
      alert('Erro ao excluir conta. Tente novamente.')
    }
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
          <div className="text-center sm:text-left flex-1">
            {editingName ? (
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-white bg-transparent focus:outline-none"
                  autoFocus
                />
                <div className="flex gap-2 mt-2 sm:mt-0">
                  <button
                    onClick={handleSaveName}
                    className="px-4 py-2 bg-[var(--gold-primary)] text-black font-bold rounded-xl hover:bg-[var(--gold-primary)]/80 transition-colors"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={handleCancelEditName}
                    className="px-4 py-2 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-white drop-shadow-2xl">
                  {profile?.full_name || profile?.username || 'Meu Perfil'}
                </h1>
                <button
                  onClick={() => {
                    setTempName(profile?.full_name || profile?.username || '')
                    setEditingName(true)
                  }}
                  className="text-2xl hover:text-[var(--gold-primary)] transition-colors"
                >
                  ✏️
                </button>
              </div>
            )}
            <p className="text-lg sm:text-xl text-[var(--gold-primary)] font-bold mt-2 opacity-80">{user.email}</p>
            {profile?.is_admin && (
              <span className="inline-block mt-2 px-3 py-1 bg-[var(--gold-primary)] text-black text-xs font-bold uppercase rounded-full">
                Administrador
              </span>
            )}
            <button
              onClick={handleDeleteAccount}
              className="mt-4 px-4 py-2 bg-red-500/20 text-red-400 font-bold rounded-xl hover:bg-red-500/30 transition-colors text-sm"
            >
              Excluir Conta
            </button>
          </div>
        </header>

        {/* Seções do Perfil */}
        <div className="space-y-16 sm:space-y-20">
          <Section title="Histórico de Reprodução" items={history} color="var(--red-primary)" emptyMsg="Você ainda não iniciou nenhum vídeo." showDelete={true} onDelete={handleDeleteHistoryItem} onClearAll={handleClearHistory} />
          <StatisticsSection statistics={statistics} />
          <SettingsSection settings={settings} onSettingsChange={handleSettingsChange} />
          <AccessibilitySection settings={accessibilitySettings} onSettingsChange={handleAccessibilityChange} />
          <DevicesSection devices={devices} onLogoutDevice={handleLogoutDevice} />
        </div>
      </div>
    </main>
  )
}

function Section({ title, items, color, emptyMsg, showDelete = false, onDelete, onClearAll }: { title: string, items: ProfileItem[], color: string, emptyMsg: string, showDelete?: boolean, onDelete?: (itemId: string) => void, onClearAll?: () => void }) {
  return (
    <section className="animate-in fade-in slide-in-from-left-4 duration-1000">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4" style={{ color }}>
          <span className="w-2 h-10 rounded-full" style={{ backgroundColor: color }}></span>
          {title}
        </h2>
        {showDelete && items.length > 0 && onClearAll && (
          <button
            onClick={onClearAll}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors font-bold text-sm"
          >
            Limpar Tudo
          </button>
        )}
      </div>

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
            <div key={item.id} className="relative aspect-[2/3] w-full group rounded-xl overflow-hidden bg-neutral-900 border border-white/5 hover:border-brand-cyan transition-all shadow-xl">
              <Link
                href={isSeries ? `/series/${item.id}` : `/detalhes/${item.id}`}
                className="absolute inset-0"
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
              {showDelete && onDelete && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    onDelete(String(item.id))
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 z-10"
                >
                  <span className="text-white font-bold">×</span>
                </button>
              )}
            </div>
          )})}
        </div>
      )}
    </section>
  )
}