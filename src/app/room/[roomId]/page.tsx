'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/layout/SupabaseProvider'
import { VideoPlayer } from '@/app/VideoPlayer'
import Image from 'next/image'
import { TMDB_IMG } from '@/lib/tmdb'

export default function PartyRoomPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const roomId = params.roomId as string

  const [loading, setLoading] = useState(true)
  const [guestName, setGuestName] = useState('')
  const [isGuest, setIsGuest] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [roomData, setRoomData] = useState<any>(null)
  const [contentData, setContentData] = useState<any>(null)
  const [showPlayer, setShowPlayer] = useState(false)
  const [isHost, setIsHost] = useState(false)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    async function loadRoom(retryCount = 0) {
      const sb = createClient()

      console.log('Buscando sala:', roomId, 'tentativa:', retryCount + 1)

      // Buscar dados da sala
      const { data: room, error: roomError } = await sb
        .from('party_rooms')
        .select('*')
        .eq('id', roomId)
        .maybeSingle()

      console.log('Resultado da busca:', { room, roomError })

      if (roomError || !room) {
        console.error('Sala não encontrada ou erro:', roomError)
        
        // Tentar novamente até 3 vezes com delay de 1 segundo
        if (retryCount < 3) {
          console.log('Tentando novamente em 1 segundo...')
          setTimeout(() => loadRoom(retryCount + 1), 1000)
          return
        }
        
        alert('Sala não encontrada')
        router.push('/')
        return
      }

      setRoomData(room)

      // Verificar se é o anfitrião
      if (user && user.id === room.host_id) {
        setIsHost(true)
        setHasJoined(true)
      } else {
        setIsGuest(true)
      }

      // Buscar dados do conteúdo
      if (room.content_type === 'movie') {
        const { data: movie } = await sb.from('cinema').select('id,titulo,poster,backdrop,banner,year,category,rating,duration,duration_seconds,created_at,tmdb_id').eq('id', room.content_id).maybeSingle()
        setContentData(movie)
      } else {
        const { data: series } = await sb.from('series').select('id,id_n,titulo,poster,backdrop,banner,ano,classificacao,genero,rating,trailer,created_at,tmdb_id').eq('id_n', room.content_id).maybeSingle()
        setContentData(series)
      }

      setLoading(false)

      // Subscribe para mudanças na sala (quando o anfitrião começar)
      if (!channelRef.current) {
        channelRef.current = sb
          .channel(`room:${roomId}`)
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'party_rooms', filter: `id=eq.${roomId}` }, (payload) => {
            console.log('Sala atualizada - Callback chamado:', payload)
            console.log('started_at:', payload.new.started_at, 'showPlayer atual:', showPlayer, 'hasJoined:', hasJoined)
            if (payload.new.started_at && !showPlayer && hasJoined) {
              console.log('Abrindo player para convidado')
              setShowPlayer(true)
            }
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Subscribed to room:', roomId)
            }
          })
      }

      return () => {
        if (channelRef.current) {
          sb.removeChannel(channelRef.current)
          channelRef.current = null
        }
      }
    }

    loadRoom()
  }, [roomId, user, router])

  async function handleJoin() {
    if (!guestName.trim()) {
      alert('Por favor, insira seu nome')
      return
    }
    setHasJoined(true)
  }

  async function handleStart() {
    if (!isHost) return

    console.log('Anfitrião clicou em Começar Exibição')
    const sb = createClient()
    const { error } = await sb.from('party_rooms').update({ started_at: new Date().toISOString() }).eq('id', roomId)
    
    if (error) {
      console.error('Erro ao atualizar sala:', error)
    } else {
      console.log('Sala atualizada com started_at')
    }
    
    setShowPlayer(true)
  }

  async function handleShare() {
    const shareLink = `${window.location.origin}/room/${roomId}`
    const shareMsg = `Vamos assistir juntos? 🍿 ${title}\n🔗 ${shareLink}`

    console.log('Tentando compartilhar:', shareLink)

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Assistir juntos: ${title}`,
          text: `Vamos assistir juntos? 🍿 ${title}`,
          url: shareLink
        })
        console.log('Compartilhado com sucesso')
      } catch (err) {
        console.log('Erro ao compartilhar com Web Share API:', err)
        // Fallback para clipboard
        try {
          await navigator.clipboard.writeText(shareLink)
          alert('Link copiado para a área de transferência!')
          console.log('Link copiado para clipboard')
        } catch (clipErr) {
          console.error('Erro ao copiar para clipboard:', clipErr)
          alert('Erro ao copiar link. Por favor, copie manualmente: ' + shareLink)
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareLink)
        alert('Link copiado para a área de transferência!')
        console.log('Link copiado para clipboard')
      } catch (err) {
        console.error('Erro ao copiar para clipboard:', err)
        alert('Erro ao copiar link. Por favor, copie manualmente: ' + shareLink)
      }
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-black animate-pulse" />
  }

  if (!hasJoined && isGuest) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#1A1A1F] rounded-3xl p-8 border border-white/10">
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-6 text-center">
            🍿 Entrar na Sala
          </h1>
          <p className="text-neutral-400 text-center mb-6 sm:mb-8 text-sm sm:text-base">
            Digite seu nome para entrar na sala de assistir juntos
          </p>
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Seu nome"
            className="w-full bg-black/50 border border-white/20 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-white text-center text-lg sm:text-xl focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan outline-none transition-all font-montserrat"
            maxLength={20}
          />
          <button
            onClick={handleJoin}
            className="w-full mt-4 sm:mt-6 bg-brand-cyan text-white font-montserrat font-black uppercase tracking-wider sm:tracking-widest rounded-2xl py-3 sm:py-4 hover:brightness-110 transition-all transform hover:scale-105 text-sm sm:text-base"
          >
            Entrar
          </button>
        </div>
      </div>
    )
  }

  const backdrop = contentData ? TMDB_IMG.backdrop(contentData.backdrop_path || contentData.banner || contentData.backdrop) : null
  const title = contentData?.titulo || contentData?.title || contentData?.name
  const poster = contentData ? TMDB_IMG.poster(contentData.poster_path || contentData.poster || contentData.capa) : null

  if (!showPlayer) {
    return (
      <div className="min-h-screen bg-black text-white relative">
        {/* Banner de Fundo */}
        {backdrop && (
          <div className="absolute inset-0 pointer-events-none">
            <Image
              src={backdrop}
              alt={title}
              fill
              className="object-cover opacity-30"
              priority
              sizes="100vw"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
          </div>
        )}

        {/* Conteúdo Central */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
          <div className="max-w-4xl w-full text-center relative z-30">
            {/* Poster */}
            {poster && (
              <div className="mx-auto mb-6 sm:mb-8 w-36 sm:w-48 md:w-64 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl pointer-events-none">
                <Image
                  src={poster}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 144px, (max-width: 768px) 192px, 256px"
                />
              </div>
            )}

            {/* Título */}
            <h1 className="text-2xl sm:text-4xl md:text-7xl font-black uppercase tracking-tighter mb-3 sm:mb-4 drop-shadow-2xl px-2">
              {title}
            </h1>

            {/* Informações da Sala */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 text-xs sm:text-sm md:text-base">
              <span className="bg-brand-cyan text-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold uppercase tracking-wider sm:tracking-widest text-xs sm:text-sm">
                Sala: {roomId}
              </span>
              {isHost && (
                <span className="bg-white/10 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold uppercase tracking-wider sm:tracking-widest text-xs sm:text-sm">
                  🎬 Anfitrião
                </span>
              )}
            </div>

            {/* Botão de Começar (apenas anfitrião) */}
            {isHost ? (
              <div className="flex flex-col items-center gap-3 sm:gap-4 w-full px-4">
                <button
                  onClick={(e) => {
                    console.log('Botão Começar Exibição clicado!', e)
                    handleStart()
                  }}
                  className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-brand-cyan text-white font-montserrat font-black uppercase tracking-wider sm:tracking-widest rounded-[20px] sm:rounded-[30px] hover:brightness-110 transition-all transform hover:scale-105 text-base sm:text-xl shadow-2xl cursor-pointer"
                >
                  ▶ Começar Exibição
                </button>
                <button
                  onClick={(e) => {
                    console.log('Botão compartilhar clicado!', e)
                    handleShare()
                  }}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-white/10 text-white font-montserrat font-bold uppercase tracking-wider sm:tracking-widest rounded-[20px] border border-white/20 hover:bg-white/20 transition-all cursor-pointer text-sm sm:text-base"
                >
                  📤 Compartilhar Link
                </button>
              </div>
            ) : (
              <div className="text-xl text-neutral-300 animate-pulse">
                ⏳ Aguardando o anfitrião começar...
              </div>
            )}

            {/* Informações */}
            <p className="mt-8 text-neutral-400 text-sm">
              {isHost 
                ? 'Você é o anfitrião. Clique em começar quando todos estiverem prontos.'
                : 'Aguarde o anfitrião começar a exibição.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Mostrar player
  const videoUrl = contentData?.video_url || contentData?.url || contentData?.link

  return (
    <VideoPlayer
      src={videoUrl}
      title={title}
      contentId={roomData?.content_id}
      userId={user?.id}
      partyRoomId={roomId}
      isGuest={isGuest}
      guestName={guestName}
      backdrop={backdrop}
      onClose={() => router.push('/')}
    />
  )
}
