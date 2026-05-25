'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { getMovieDetails, TMDB_IMG } from '@/lib/tmdb'
import { Navbar } from '@/components/layout/Navbar'
import { VideoPlayer } from '@/app/VideoPlayer'
import Image from 'next/image'
import { ContentCard } from '@/components/ui/ContentCard'
import { useAuth } from '@/components/layout/SupabaseProvider'
import { Heart } from 'lucide-react'

export default function MovieDetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black animate-pulse" />}>
      <MovieContent />
    </Suspense>
  )
}

function MovieContent() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [movie, setMovie] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filteredRecommendations, setFilteredRecommendations] = useState<any[]>([])
  const [isFavorite, setIsFavorite] = useState(false)
  const [contentUuid, setContentUuid] = useState<string | null>(null)
  const [legacyId, setLegacyId] = useState<number | null>(null)
  const [showPlayer, setShowPlayer] = useState(false)

  // Estados da Sala (Assistir Juntos)
  const [activeRoomId, setActiveRoomId] = useState(searchParams.get('room'))
  const [isGuestMode] = useState(!!searchParams.get('room'))
  const [guestStep, setGuestStep] = useState<'prompt' | 'name' | 'ready' | null>(searchParams.get('room') ? 'prompt' : null)
  const [guestName, setGuestName] = useState('')

  useEffect(() => {
    if (!id) return

    async function loadMovie() {
      const sb = createClient()
      let movieIdNum = Number(id)
      let localData = null
      
      // 1. Resolver ID (pode ser BIGINT ou UUID da tabela content)
      if (isNaN(movieIdNum)) {
        const { data: contentData } = await sb
          .from('content')
          .select('id, title')
          .eq('id', id)
          .maybeSingle()

        if (contentData) {
          const { data: mData } = await sb
            .from('cinema')
            .select('*')
            .eq('titulo', contentData.title)
            .maybeSingle()
          localData = mData
          if (mData) movieIdNum = mData.id
          setContentUuid(contentData.id)
        }
      } else {
        const { data: mData } = await sb
          .from('cinema')
          .select('*')
          .eq('id', movieIdNum)
          .maybeSingle()
        localData = mData
      }

      if (!localData) {
        router.push('/')
        return
      }

      setLegacyId(movieIdNum)

      // 2. Busca metadados ricos no TMDB
      if (localData.tmdb_id) {
        try {
          const tmdbData = await getMovieDetails(localData.tmdb_id)
          if (tmdbData) {
            setMovie({ ...tmdbData, ...localData })

            // Filtra recomendações: apenas o que existe no seu banco
            if (tmdbData.recommendations?.results?.length > 0) {
              const recIds = tmdbData.recommendations.results.map((r: any) => r.id)
              const { data: existing } = await sb
                .from('cinema')
                .select('*')
                .in('tmdb_id', recIds)
              setFilteredRecommendations(existing || [])
            }
          } else {
            setMovie(localData)
          }
        } catch (e) {
          console.warn('Erro ao buscar dados do TMDB, usando dados locais:', e)
          setMovie(localData)
        }
      } else {
        setMovie(localData)
      }

      // Sincronização UUID Content para favoritos e progresso
      let cid = null
      if (localData?.titulo) {
        const { data: contentData } = await sb
          .from('content')
          .select('id')
          .eq('title', localData.titulo)
          .eq('type', 'movie')
          .maybeSingle()

        if (contentData) {
          cid = contentData.id
        } else {
          const { data: newContent } = await sb.from('content')
            .insert({ 
              title: localData.titulo, 
              type: 'movie', 
              poster: localData.poster || localData.poster_path || localData.banner || localData.backdrop || localData.backdrop_path,
              is_published: true 
            }).select('id').maybeSingle()
          if (newContent) cid = newContent.id
        }
      }
      setContentUuid(cid)

      if (cid && user) {
          const { data: fav } = await sb
            .from('favorites')
            .select('id')
            .match({ user_id: user.id, content_id: cid })
            .maybeSingle()
          setIsFavorite(!!fav)
      }

      setLoading(false)
    }

    loadMovie()
  }, [id, router, user])

  const startParty = useCallback(async () => {
    if (!user) {
      router.push('/login')
      return
    }

    const newRoomId = Math.random().toString(36).substring(2, 11);
    const sb = createClient()

    console.log('Criando sala:', newRoomId, 'para conteúdo:', id, 'tipo: movie')

    // Criar sala na tabela party_rooms
    const { error, data } = await sb.from('party_rooms').insert({
      id: newRoomId,
      content_id: id,
      content_type: 'movie',
      host_id: user.id
    }).select()

    if (error) {
      console.error('Erro ao criar sala:', error)
      alert('Erro ao criar sala. Tente novamente.')
      return
    }

    console.log('Sala criada com sucesso:', data)

    // Aguarda um momento para garantir que a sala foi criada no banco
    await new Promise(resolve => setTimeout(resolve, 500))

    // Redirecionar para a página da sala
    router.push(`/room/${newRoomId}`)
  }, [id, user, router]);

  async function toggleFavorite() {
    if (!user) return router.push('/login')
    const sb = createClient()

    // Usa contentUuid se disponível, senão usa legacyId
    const targetId = contentUuid
    const targetLegacyId = legacyId

    if (!targetId && !targetLegacyId) {
      return
    }

    if (isFavorite) {
      const { error } = await sb.from('favorites').delete().match({
        user_id: user.id,
        ...(targetId ? { content_id: targetId } : {}),
        ...(targetLegacyId ? { legacy_id: targetLegacyId } : {})
      });
      if (!error) setIsFavorite(false);
    } else {
      const { error } = await sb.from('favorites').insert({
        user_id: user.id,
        content_type: 'movie',
        ...(targetId ? { content_id: targetId } : {}),
        ...(targetLegacyId ? { legacy_id: targetLegacyId } : {})
      });
      if (!error) setIsFavorite(true);
    }
  }

  // Verifica se o conteúdo já está nos favoritos
  useEffect(() => {
    async function checkFavorite() {
      if (!user || (!contentUuid && !legacyId)) {
        setIsFavorite(false)
        return
      }

      const sb = createClient()
      let query = sb.from('favorites').select('*').eq('user_id', user.id)

      // Verifica por content_id ou legacy_id
      if (contentUuid) {
        query = query.eq('content_id', contentUuid)
      } else if (legacyId) {
        query = query.eq('legacy_id', legacyId)
      }

      const { data, error } = await query.maybeSingle()

      if (!error && data) {
        setIsFavorite(true)
      } else {
        setIsFavorite(false)
      }
    }

    checkFavorite()
  }, [user, contentUuid, legacyId])

  if (loading || !movie) {
    return <div className="min-h-screen bg-black animate-pulse" />
  }

  const backdrop = TMDB_IMG.backdrop(movie.backdrop_path || movie.banner || movie.backdrop)
  const title = movie.titulo || movie.title
  const description = movie.overview || movie.description || movie.descricao
  const formatCurrency = (val: number) => val > 0 ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val) : 'N/A'

  const countryCode = movie.production_countries?.[0]?.iso_3166_1 || 
                     (Array.isArray(movie.origin_country) ? movie.origin_country[0] : movie.origin_country) || '';

  return (
    <main className="min-h-screen bg-black text-white relative">
      <Navbar />

      {/* Banner de Fundo */}
      <div className="absolute inset-0 h-[60vh] sm:h-[70vh] md:h-[90vh] w-full">
        {backdrop && (
          <Image
            src={backdrop}
            alt={title}
            fill
            className="object-cover object-center opacity-40"
            priority
            sizes="100vw"
            unoptimized
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent" />
      </div>

      {/* Conteúdo */}
      <div className="relative pt-[40vh] sm:pt-[50vh] md:pt-[60vh] lg:pt-[82vh] px-4 sm:px-6 md:px-16 pb-20">
        <div className="max-w-6xl">
        {movie.tagline && <p className="text-brand-cyan font-bold tracking-widest uppercase text-sm mb-2">{movie.tagline}</p>}
        <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-4 drop-shadow-2xl">
          {title}
        </h1>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-6 sm:mb-8 text-xs sm:text-sm md:text-base font-bold">
          {countryCode && (
            <img 
              src={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`} 
              alt={countryCode}
              className="h-4 sm:h-6 w-auto object-contain rounded-sm shadow-sm"
              title={countryCode}
            />
          )}
          <span className="bg-brand-cyan text-black px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs">TMDB {movie.vote_average?.toFixed(1) || movie.rating}</span>
          <span className="text-neutral-400 text-xs sm:text-sm">{movie.release_date?.slice(0, 4) || movie.year}</span>
          {movie.runtime && (
            <span className="text-neutral-400 text-xs sm:text-sm">{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}min</span>
          )}
        </div>

        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-neutral-300 leading-relaxed mb-6 sm:mb-8 max-w-3xl drop-shadow px-2">
          {description}
        </p>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 max-w-2xl">
          <button
            onClick={() => setShowPlayer(true)}
            className="flex-1 min-w-[120px] sm:flex-none px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-brand-cyan text-white font-montserrat font-black uppercase tracking-wider sm:tracking-widest rounded-[12px] sm:rounded-[16px] md:rounded-[20px] hover:brightness-110 transition-all transform hover:scale-105 focus:ring-4 focus:ring-brand-cyan outline-none border border-transparent text-xs sm:text-sm md:text-base"
          >
            ▶ Assistir
          </button>

          <button
            onClick={(e) => {
              console.log('Botão Assistir Juntos clicado!', e)
              startParty()
            }}
            className="flex-1 min-w-[120px] sm:flex-none px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-white/10 text-white font-montserrat font-black uppercase tracking-wider sm:tracking-widest rounded-[12px] sm:rounded-[16px] md:rounded-[20px] border border-white/20 hover:bg-brand-cyan hover:text-black transition-all transform hover:scale-105 focus:ring-4 focus:ring-brand-cyan outline-none cursor-pointer text-xs sm:text-sm md:text-base"
          >
            🍿 Juntos
          </button>

          {/* Botão Voltar */}
          <button 
            onClick={() => router.back()}
            className="flex-1 min-w-[80px] sm:flex-none px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-[#001f3f] text-white font-montserrat font-black uppercase tracking-wider sm:tracking-widest rounded-[12px] sm:rounded-[16px] md:rounded-[20px] hover:brightness-125 transition-all focus:ring-4 focus:ring-blue-500 outline-none border border-transparent text-xs sm:text-sm md:text-base"
          >
            Voltar
          </button>

          {movie.trailer && (
            <a
              href={movie.trailer}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[80px] sm:flex-none px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-[#FF0000] text-white font-montserrat font-black uppercase tracking-wider sm:tracking-widest rounded-[12px] sm:rounded-[16px] md:rounded-[20px] hover:brightness-110 transition-all focus:ring-4 focus:ring-red-600 outline-none border border-transparent text-xs sm:text-sm md:text-base"
            >
              🎬 Trailer
            </a>
          )}
          
          <button 
            onClick={toggleFavorite}
            className={`p-2 sm:p-3 md:p-4 rounded-[12px] sm:rounded-[16px] md:rounded-[20px] transition-all border border-white/10 focus:ring-4 outline-none ${isFavorite ? 'bg-red-600/20 border-red-600 text-red-600 focus:ring-red-600' : 'bg-white/5 text-white hover:bg-white/10 focus:ring-white'}`}
            title={isFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
          >
            <Heart className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 ${isFavorite ? 'fill-red-600 text-red-600' : 'fill-none'}`} />
          </button>
        </div>
        </div>

        {/* Seção Profissional: Elenco */}
        {movie.credits?.cast && (
          <section className="mt-24">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 border-l-4 border-brand-cyan pl-4">Elenco Principal</h2>
            <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
              {movie.credits.cast.slice(0, 12).map((actor: any) => (
                <div key={actor.id} className="min-w-[140px] text-center group">
                  <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden border-2 border-white/5 group-hover:border-brand-cyan transition-colors shadow-xl mb-3">
                    <Image 
                      src={TMDB_IMG.profile(actor.profile_path) || 'https://via.placeholder.com/185x185?text=👤'} 
                      alt={actor.name} fill className="object-cover" unoptimized 
                    />
                  </div>
                  <p className="text-sm font-bold text-white line-clamp-1">{actor.name}</p>
                  <p className="text-xs text-neutral-500 line-clamp-1">{actor.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Detalhes Técnicos */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-12 bg-white/5 p-10 rounded-3xl border border-white/10 backdrop-blur-md">
          <div className="space-y-1">
            <span className="block text-[10px] font-black uppercase text-neutral-500 tracking-widest">Título Original</span>
            <p className="text-sm font-bold">{movie.original_title}</p>
          </div>
          <div className="space-y-1">
            <span className="block text-[10px] font-black uppercase text-neutral-500 tracking-widest">Status</span>
            <p className="text-sm font-bold">{movie.status === 'Released' ? 'Lançado' : movie.status}</p>
          </div>
          <div className="space-y-1">
            <span className="block text-[10px] font-black uppercase text-neutral-500 tracking-widest">Orçamento</span>
            <p className="text-sm font-bold">{formatCurrency(movie.budget)}</p>
          </div>
          <div className="space-y-1">
            <span className="block text-[10px] font-black uppercase text-neutral-500 tracking-widest">Receita</span>
            <p className="text-sm font-bold">{formatCurrency(movie.revenue)}</p>
          </div>
          <div className="col-span-full md:col-span-2 space-y-1">
            <span className="block text-[10px] font-black uppercase text-neutral-500 tracking-widest">Gêneros</span>
            <p className="text-sm font-bold">{movie.genres?.map((g: any) => g.name).join(' • ')}</p>
          </div>
          <div className="col-span-full md:col-span-2 space-y-1">
            <span className="block text-[10px] font-black uppercase text-neutral-500 tracking-widest">Produção</span>
            <p className="text-sm font-bold">{movie.production_companies?.map((c: any) => c.name).join(', ')}</p>
          </div>
        </div>

        {/* Recomendações */}
        {filteredRecommendations.length > 0 && (
          <section className="mt-24">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 border-l-4 border-brand-cyan pl-4">Títulos Semelhantes</h2>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
              {filteredRecommendations.slice(0, 6).map((item: any) => (
                <ContentCard 
                  key={item.id} 
                  item={{ ...item, type: 'movie' }} 
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="pb-32" />

      {/* Player de Vídeo em Fullscreen */}
      {showPlayer && (
        <VideoPlayer
          src={movie.url}
          title={title}
          contentId={contentUuid || String(movie.id)}
          userId={user?.id}
          onClose={() => setShowPlayer(false)}
        />
      )}
    </main>
  )
}