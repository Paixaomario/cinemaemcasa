'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { getShowDetails, TMDB_IMG } from '@/lib/tmdb'
import { Navbar } from '@/components/layout/Navbar'
import { VideoPlayer } from '@/app/VideoPlayer'
import Image from 'next/image'
import { ContentCard } from '@/components/ui/ContentCard'
import { useAuth } from '@/components/layout/SupabaseProvider'
import { Heart } from 'lucide-react'

export default function SeriesDetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black animate-pulse" />}>
      <SeriesContent />
    </Suspense>
  )
}

function SeriesContent() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [series, setSeries] = useState<any>(null)
  const [seasons, setSeasons] = useState<any[]>([])
  const [episodes, setEpisodes] = useState<any[]>([])
  const [selectedSeason, setSelectedSeason] = useState<any>(null)
  const [filteredRecommendations, setFilteredRecommendations] = useState<any[]>([])
  const [isFavorite, setIsFavorite] = useState(false)
  const [contentUuid, setContentUuid] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeEpisode, setActiveEpisode] = useState<any>(null)
  const [showPlayer, setShowPlayer] = useState(false)
  const [autoPlayNext, setAutoPlayNext] = useState(false)

  // Estados da Sala (Assistir Juntos)
  const [activeRoomId, setActiveRoomId] = useState(searchParams.get('room'))
  const [isGuestMode] = useState(!!searchParams.get('room'))
  const [guestStep, setGuestStep] = useState<'prompt' | 'name' | 'ready' | null>(searchParams.get('room') ? 'prompt' : null)
  const [guestName, setGuestName] = useState('')

  useEffect(() => {
    if (!id) return

    async function loadSeries() {
      const sb = createClient()
      setLoading(true)
      const rawId = String(id)
      const cleanId = rawId.replace('serie-', '')
      const isNumeric = /^\d+$/.test(cleanId)
      
      // Garante que o ID seja tratado de forma resiliente para Smart TVs
      let localSeriesId: string | null = null
      let localData = null

      try {
        // 1. Resolver ID Real (UUID da content ou id_n da series)
        if (!isNumeric) {
          const { data: contentData } = await sb
            .from('content')
            .select('id, title')
            .eq('id', rawId)
            .maybeSingle()
          
          if (contentData) {
            const { data: sData } = await sb
              .from('series')
              .select('*')
              .ilike('titulo', contentData.title.trim())
              .maybeSingle()
            
            if (sData) {
              localData = sData
              localSeriesId = String(sData.id_n || sData.id)
              setContentUuid(contentData.id)
            }
          }
        } else {
          const { data: sData } = await sb
            .from('series')
            .select('*')
            .eq('id_n', cleanId)
            .maybeSingle()
          
          if (sData) {
            localData = sData
            localSeriesId = cleanId
          }
        }

        if (!localData || !localSeriesId) {
          router.push('/')
          return
        }

        // 2. Busca metadados ricos no TMDB
        let finalData = localData
        if (localData.tmdb_id) {
          try {
            const tmdbData = await getShowDetails(localData.tmdb_id)
            if (tmdbData) finalData = { ...tmdbData, ...localData }
          } catch (e) {
            console.warn("TMDB Series metadata not found, using local only");
          }

          if (finalData.recommendations?.results?.length > 0) {
            const recIds = finalData.recommendations.results.map((r: any) => r.id)
            const { data: existing } = await sb
              .from('series')
              .select('id_n, titulo, capa, poster, rating, ano, genero, tmdb_id')
              .in('tmdb_id', recIds)
            setFilteredRecommendations(existing || [])
          }
        }
        setSeries(finalData)

        // Sincronização UUID
        let cid = contentUuid
        if (!cid && localData?.titulo) {
          const { data: contentData } = await sb.from('content').select('id').eq('title', localData.titulo).eq('type', 'series').maybeSingle()
          if (contentData) cid = contentData.id
        }
        if (cid) setContentUuid(cid)

        // 3. Busca Temporadas e Episódios (Tentativa Híbrida)
        // Primeiro tenta na tabela 'temporadas' (Legado)
        let { data: seasonsData } = await sb
          .from('temporadas')
          .select('*')
          .or(`serie_id.eq.${localSeriesId},id_serie.eq.${localSeriesId}`)
          .order('numero_temporada', { ascending: true })

        // Se não houver temporadas, tenta extrair do 'content' (Unificado)
        if (!seasonsData || seasonsData.length === 0) {
          const { data: contentEpisodes } = await sb
            .from('content')
            .select('season_number')
            .eq('parent_id', contentUuid)
            .eq('type', 'episode')

          if (contentEpisodes && contentEpisodes.length > 0) {
            const uniqueSeasons = Array.from(new Set(contentEpisodes.map((e: any) => e.season_number))).sort();
            seasonsData = uniqueSeasons.map(num => ({
              id_n: `s-${num}`,
              numero_temporada: num,
              titulo: `Temporada ${num}`
            }));
          }
        }

        setSeasons(seasonsData || [])
        if (seasonsData && seasonsData.length > 0) {
          const firstSeason = seasonsData[0]
          setSelectedSeason(firstSeason)
          
          // Busca episódios da primeira temporada
          const seasonId = firstSeason.id_n || firstSeason.id;
          let { data: episodesData } = await sb
            .from('episodios')
            .select('*')
            .or(`temporada_id.eq.${seasonId},id_temporada.eq.${seasonId}`)
            .order('numero_episodio', { ascending: true })
          
          // Fallback para content
          if ((!episodesData || episodesData.length === 0) && contentUuid) {
             const { data: cEps } = await sb
               .from('content')
               .select('*')
               .eq('parent_id', contentUuid)
               .eq('season_number', firstSeason.numero_temporada)
               .eq('type', 'episode')
               .order('episode_number', { ascending: true })
             
             if (cEps) {
               episodesData = cEps.map(e => ({
                 ...e,
                 id_n: e.id,
                 numero_episodio: e.episode_number,
                 titulo: e.title,
                 arquivo: e.video_url
               }))
             }
          }
          setEpisodes(episodesData || [])
        }
      } catch (err) {
        console.error("Erro ao carregar série:", err)
      } finally {
        setLoading(false)
      }
    }

    loadSeries()
  }, [id, router, user])

  const startParty = useCallback(() => {
    const newRoomId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const inviteLink = `${window.location.origin}${window.location.pathname}?room=${newRoomId}`;
    const inviteMsg = `Vamos assistir comigo?\n\n🍿 ${series.titulo || series.name}\n🔗 ${inviteLink}`;
    
    navigator.clipboard.writeText(inviteMsg);
    alert("🎉 Sala criada! Convite copiado para sua área de transferência.");
    setActiveRoomId(newRoomId);
    setShowPlayer(true);
    if (!activeEpisode && episodes.length > 0) setActiveEpisode(episodes[0]); // Ativa o primeiro episódio para o host
  }, [series, activeEpisode, episodes]);

  // Implementação do próximo episódio automático
  const handleNextEpisode = useCallback(() => {
    if (!activeEpisode || episodes.length === 0) return

    // Encontra o índice do episódio atual
    const currentIndex = episodes.findIndex(ep => 
      String(ep.id_n || ep.id) === String(activeEpisode.id_n || activeEpisode.id)
    )
    
    if (currentIndex !== -1 && currentIndex < episodes.length - 1) {
      // Próximo na mesma temporada
      setActiveEpisode(episodes[currentIndex + 1])
    } else {
      // Tenta próxima temporada
      const currentSeasonIndex = seasons.findIndex(s => 
        String(s.id_n || s.id) === String(selectedSeason?.id_n || selectedSeason?.id)
      )
      
      if (currentSeasonIndex !== -1 && currentSeasonIndex < seasons.length - 1) {
        const nextSeason = seasons[currentSeasonIndex + 1]
        setSelectedSeason(nextSeason)
        setAutoPlayNext(true)
      } else {
        // Fim da série
        setActiveEpisode(null)
        setShowPlayer(false)
      }
    }
  }, [activeEpisode, episodes, seasons, selectedSeason])

  // Efeito para iniciar o primeiro episódio da nova temporada após o autoPlay
  useEffect(() => {
    if (autoPlayNext && episodes.length > 0) {
      setActiveEpisode(episodes[0])
      setAutoPlayNext(false)
    }
  }, [episodes, autoPlayNext])

  async function toggleFavorite() {
    if (!user) return router.push('/login')
    const sb = createClient()
    const targetId = contentUuid

    if (!targetId) return

    if (isFavorite) {
      const { error } = await sb.from('favorites').delete().match({ user_id: user.id, content_id: targetId });
      if (!error) setIsFavorite(false);
    } else {
      const { error } = await sb.from('favorites').insert({ user_id: user.id, content_id: targetId });
      if (!error) setIsFavorite(true);
    }
  }

  // Busca episódios quando a temporada muda
  useEffect(() => {
    const seasonId = selectedSeason?.id_n || selectedSeason?.id;
    if (!seasonId || loading) return

    async function loadEpisodes() {
      const sb = createClient()
      let { data: episodesData } = await sb
        .from('episodios')
        .select('*')
        .or(`temporada_id.eq.${seasonId},id_temporada.eq.${seasonId}`)
        .order('numero_episodio', { ascending: true })

      // Fallback para content
      if ((!episodesData || episodesData.length === 0) && contentUuid) {
        const { data: cEps } = await sb
          .from('content')
          .select('*')
          .eq('parent_id', contentUuid)
          .eq('season_number', selectedSeason.numero_temporada)
          .eq('type', 'episode')
          .order('episode_number', { ascending: true })
        
        if (cEps) {
          episodesData = cEps.map(e => ({
            ...e,
            id_n: e.id,
            numero_episodio: e.episode_number,
            titulo: e.title,
            arquivo: e.video_url
          }))
        }
     }
     setEpisodes(episodesData || [])
    }

    loadEpisodes()
  }, [selectedSeason, loading])

  if (loading || !series) {
    return <div className="min-h-screen bg-black animate-pulse" />
  }

  const backdrop = TMDB_IMG.backdrop(series.backdrop_path || series.banner)
  const title = series.titulo || series.name
  const description = series.overview || series.description || series.descricao

  const countryCode = (Array.isArray(series.origin_country) ? series.origin_country[0] : series.origin_country) || '';

  return (
    <main className="min-h-screen bg-black text-white relative">
      <Navbar />

      {/* Banner de Fundo */}
      <div className="absolute inset-0 h-[90vh] w-full">
        {backdrop && (
          <Image
            src={backdrop}
            alt={title}
            fill
            className="object-cover opacity-40"
            priority
            sizes="100vw"
            unoptimized
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent" />
      </div>

      {/* Conteúdo - Ajustado padding para visibilidade imediata das temporadas */}
      <div className="relative pt-[45vh] md:pt-[55vh] px-6 md:px-16 z-10">
        <div className="max-w-6xl">
        <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-4 drop-shadow-2xl">
          {title}
        </h1>
        {series.tagline && (
          <p className="text-brand-cyan font-bold tracking-widest uppercase text-sm mb-4 drop-shadow-md">{series.tagline}</p>
        )}

        <div className="flex items-center gap-4 mb-8 text-sm md:text-base font-bold">
          {countryCode && countryCode.length === 2 && (
            <img 
              src={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`} 
              alt={countryCode}
              className="h-7 w-auto object-contain rounded-sm shadow-sm"
              title={countryCode}
            />
          )}
          <span className="bg-brand-cyan text-black px-2 py-0.5 rounded text-xs">TMDB {series.vote_average?.toFixed(1) || series.rating}</span>
          <span className="text-neutral-400">{series.first_air_date?.slice(0, 4) || series.ano}</span>
          {series.number_of_seasons && (
            <span className="text-neutral-400 font-bold uppercase tracking-widest">{series.number_of_seasons} Temporadas</span>
          )}
        </div>

        <p className="text-lg md:text-xl text-neutral-300 leading-relaxed mb-12 max-w-3xl drop-shadow">
          {description}
        </p>

        <div className="flex flex-wrap items-center gap-4 mb-16">
          {/* Botão Assistir Agora (Cor do Logo) */}
          <button
            onClick={() => episodes[0] && setActiveEpisode(episodes[0])}
            className="px-10 py-4 bg-brand-cyan text-white font-montserrat font-black uppercase tracking-widest rounded-[20px] hover:brightness-110 transition-all transform hover:scale-105 focus:ring-4 focus:ring-brand-cyan outline-none border border-transparent"
          >
            ▶ Assistir Agora
          </button>

          <button
            onClick={startParty}
            className="px-10 py-4 bg-white/10 text-white font-montserrat font-black uppercase tracking-widest rounded-[20px] border border-white/20 hover:bg-brand-cyan hover:text-black transition-all transform hover:scale-105 focus:ring-4 focus:ring-brand-cyan outline-none"
          >
            🍿 Assistir Juntos
          </button>

          {/* Botão Voltar */}
          <button 
            onClick={() => router.back()}
            className="px-10 py-4 bg-[#001f3f] text-white font-montserrat font-black uppercase tracking-widest rounded-[20px] hover:brightness-125 transition-all focus:ring-4 focus:ring-blue-500 outline-none border border-transparent"
          >
            Voltar
          </button>

          {/* Botão Trailer */}
          {series.trailer && (
            <a
              href={series.trailer}
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-4 bg-[#FF0000] text-white font-montserrat font-black uppercase tracking-widest rounded-[20px] hover:brightness-110 transition-all focus:ring-4 focus:ring-red-600 outline-none border border-transparent"
            >
              🎬 Trailer
            </a>
          )}

          {/* Botão Favoritos (Apenas ícone) */}
          <button 
            onClick={toggleFavorite}
            className={`p-4 rounded-[20px] transition-all border border-white/10 focus:ring-4 outline-none ${isFavorite ? 'bg-red-600/20 border-red-600 text-red-600 focus:ring-red-600' : 'bg-white/5 text-white hover:bg-white/10 focus:ring-white'}`}
            title={isFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
          >
            <Heart className={`w-7 h-7 ${isFavorite ? 'fill-red-600 text-red-600' : 'fill-none'}`} />
          </button>
        </div>
        </div>

        {/* Seção de Episódios - Agora logo após o Banner */}
        <div className="mt-8 bg-neutral-900/40 p-8 rounded-3xl border border-white/5 backdrop-blur-md mb-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 border-b border-white/10 pb-6">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-brand-cyan">Episódios</h2>
            
            {seasons.length > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-xs font-black uppercase text-neutral-500 tracking-widest">Temporada:</span>
                <select 
                  value={selectedSeason?.id_n || selectedSeason?.id}
                  onChange={(e) => setSelectedSeason(seasons.find(s => String(s.id_n || s.id) === e.target.value))}
                  className="bg-black text-white border border-white/20 rounded-xl px-6 py-3 font-bold focus:ring-4 focus:ring-brand-cyan/40 outline-none transition-all cursor-pointer hover:bg-neutral-800"
                >
                  {seasons.map(s => (
                    <option key={s.id_n || s.id} value={s.id_n || s.id}>
                      {s.numero_temporada === 0 ? 'Especiais' : `Temporada ${s.numero_temporada}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {episodes.map((ep) => {
              const imageUrl = ep.imagem_500 || ep.banner ? TMDB_IMG.backdrop(ep.imagem_500 || ep.banner) : null;
              return (
              <button
                key={ep.id_n || ep.id}
                onClick={() => setActiveEpisode(ep)}
                className="group flex flex-col gap-4 text-left p-4 rounded-2xl hover:bg-white/5 transition-all focus:ring-4 focus:ring-brand-cyan outline-none border border-transparent hover:border-white/10"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-neutral-800 border border-white/5">
                  {imageUrl ? (
                    <Image 
                      src={imageUrl} 
                      alt={ep.titulo} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-500" 
                      unoptimized 
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">📺</div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-brand-cyan flex items-center justify-center text-black text-xl pl-1 shadow-lg">▶</div>
                  </div>
                  <div className="absolute top-2 left-2 px-3 py-1 bg-black/80 rounded-lg text-[10px] font-black uppercase tracking-widest text-brand-cyan border border-brand-cyan/20">
                    Episódio {ep.numero_episodio}
                  </div>
                </div>
                <div>
                  <h3 className="font-black text-white group-hover:text-brand-cyan transition-colors line-clamp-1 uppercase text-sm tracking-tight">{ep.titulo}</h3>
                  <p className="text-xs text-neutral-500 line-clamp-2 mt-2 font-medium leading-relaxed">{ep.descricao || 'Sem descrição disponível para este episódio.'}</p>
                </div>
              </button>
            )})}
            {episodes.length === 0 && (
              <div className="col-span-full py-20 text-center opacity-30">
                <p className="text-xl font-black uppercase tracking-widest">Nenhum episódio cadastrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Informações Técnicas Séries */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 text-neutral-400 text-sm border-t border-white/5 pt-10">
           <div>
              <span className="block font-black uppercase text-[10px] mb-1">Nome Original</span>
              <p className="text-white font-bold">{series.original_name}</p>
           </div>
           <div>
              <span className="block font-black uppercase text-[10px] mb-1">Status</span>
              <p className="text-white font-bold">{series.status === 'Returning Series' ? 'Em exibição' : 'Finalizada'}</p>
           </div>
           <div>
              <span className="block font-black uppercase text-[10px] mb-1">Tipo</span>
              <p className="text-white font-bold">{series.type}</p>
           </div>
           <div>
              <span className="block font-black uppercase text-[10px] mb-1">Emissora</span>
              <p className="text-white font-bold">{series.networks?.[0]?.name || 'N/A'}</p>
           </div>
        </div>

        {/* Elenco da Série */}
        {series.credits?.cast && (
          <section className="mb-20">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 border-l-4 border-brand-cyan pl-4">Elenco Principal</h2>
            <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
              {series.credits.cast.slice(0, 12).map((actor: any) => (
                <div key={actor.id} className="min-w-[140px] text-center group">
                  <div className="relative w-28 h-28 mx-auto rounded-full overflow-hidden border-2 border-white/5 group-hover:border-brand-cyan transition-colors mb-3">
                    <Image src={TMDB_IMG.profile(actor.profile_path) || 'https://via.placeholder.com/185x185?text=👤'} alt={actor.name} fill className="object-cover" unoptimized />
                  </div>
                  <p className="text-xs font-bold text-white line-clamp-1">{actor.name}</p>
                  <p className="text-[10px] text-neutral-500 line-clamp-1">{actor.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recomendações de Séries */}
        {filteredRecommendations.length > 0 && (
          <section className="mb-32">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 border-l-4 border-brand-cyan pl-4">Você também pode gostar</h2>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
              {filteredRecommendations.slice(0, 6).map((item: any) => (
                <ContentCard 
                  key={item.id} 
                  item={item} 
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Modal de Convidado (Assistir Juntos) */}
      {guestStep && (
        <div className="fixed inset-0 z-[10002] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
            {guestStep === 'prompt' ? (
              <>
                <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Vamos assistir comigo?</h2>
                <p className="text-brand-cyan text-2xl font-bold uppercase">{series.titulo || series.name}</p>
                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={() => setGuestStep('name')}
                    className="px-12 py-4 bg-brand-cyan text-black font-black uppercase rounded-[20px] hover:scale-110 transition-transform"
                  >Sim</button>
                  <button 
                    onClick={() => { setGuestStep(null); router.push('/'); }}
                    className="px-12 py-4 bg-white/10 text-white font-black uppercase rounded-[20px]"
                  >Não</button>
                </div>
              </>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); if(guestName.trim()) { setGuestStep(null); setShowPlayer(true); if(!activeEpisode && episodes.length > 0) setActiveEpisode(episodes[0]); } }} className="space-y-6">
                <h2 className="text-2xl font-black uppercase text-white">Como podemos te chamar?</h2>
                <input 
                  type="text" 
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Seu nome ou apelido"
                  className="w-full bg-white/5 border-2 border-white/20 rounded-[20px] px-6 py-4 text-white text-xl text-center focus:border-brand-cyan outline-none transition-all"
                  autoFocus
                />
                <button 
                  type="submit"
                  disabled={!guestName.trim()}
                  className="w-full py-4 bg-brand-cyan text-black font-black uppercase rounded-[20px] disabled:opacity-30"
                >
                  Entrar na Sala
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Player de Vídeo - Condição corrigida para convidados */}
      {(showPlayer || activeEpisode || (guestName && activeRoomId)) && (activeEpisode?.arquivo || episodes[0]?.arquivo) && (
        <VideoPlayer
          src={activeEpisode?.arquivo || episodes[0]?.arquivo}
          title={activeEpisode ? `${title} - ${activeEpisode.titulo}` : title}
          contentId={contentUuid || String(series.id_n || series.id)} 
          userId={user?.id}
          onClose={() => { setShowPlayer(false); setActiveEpisode(null); setActiveRoomId(null); setGuestName(''); setAutoPlayNext(false); }}
          partyRoomId={activeRoomId}
          isGuest={isGuestMode}
          guestName={guestName}
          backdrop={series.backdrop_path || series.banner}
          onNext={handleNextEpisode}
        />
      )}
    </main>
  )
}