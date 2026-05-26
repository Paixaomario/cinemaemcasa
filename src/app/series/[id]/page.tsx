'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { getShowDetails, TMDB_IMG } from '@/lib/tmdb'
import { Navbar } from '@/components/layout/Navbar'
import { VideoPlayer } from '@/app/VideoPlayer'
import Image from 'next/image'
import { ContentCard } from '@/components/ui/ContentCard'
import { TrailerModal } from '@/components/ui/TrailerModal'
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
  const [legacyId, setLegacyId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeEpisode, setActiveEpisode] = useState<any>(null)
  const [showPlayer, setShowPlayer] = useState(false)
  const [autoPlayNext, setAutoPlayNext] = useState(false)
  const [showTrailerModal, setShowTrailerModal] = useState(false)
  const [savedProgress, setSavedProgress] = useState<number>(0)
  const [showResumeModal, setShowResumeModal] = useState(false)

  // Função para carregar progresso salvo do episódio
  const handleEpisodeClick = useCallback(async (episode: any) => {
    if (!user || !contentUuid) {
      setSavedProgress(0)
      setActiveEpisode(episode)
      return
    }

    const sb = createClient()
    // Para séries, usa o content_id da série + episode_id único
    const episodeContentId = `${contentUuid}-ep-${episode.id_n || episode.id}`

    const { data: progress } = await sb
      .from('view_progress')
      .select('last_position')
      .eq('user_id', user.id)
      .eq('content_id', episodeContentId)
      .maybeSingle()

    const savedTime = progress?.last_position || 0
    setSavedProgress(savedTime)

    // Se houver progresso salvo (mais de 10 segundos), mostra modal
    if (savedTime > 10) {
      setShowResumeModal(true)
      setActiveEpisode(episode)
    } else {
      setSavedProgress(0)
      setActiveEpisode(episode)
    }
  }, [user, contentUuid])

  const handleResume = () => {
    setShowResumeModal(false)
  }

  const handleRestart = () => {
    setSavedProgress(0)
    setShowResumeModal(false)
  }

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
      console.log('Carregando série - ID raw:', rawId, 'clean:', cleanId, 'isNumeric:', isNumeric)
      
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
            console.log('Content encontrado:', contentData.id, contentData.title)
            const { data: sData } = await sb
              .from('series')
              .select('*')
              .ilike('titulo', contentData.title.trim())
              .maybeSingle()
            
            console.log('Series encontrado por título:', sData?.titulo, 'id_n:', sData?.id_n)
            if (sData) {
              localData = sData
              localSeriesId = String(sData.id_n || sData.id)
              setContentUuid(contentData.id)
            } else {
              console.log('Série não encontrada na tabela series usando ilike com título:', contentData.title)
            }
          } else {
            console.log('Content não encontrado com ID:', rawId)
          }
        } else {
          console.log('Buscando série por id_n numérico:', cleanId)
          const { data: sData } = await sb
            .from('series')
            .select('*')
            .eq('id_n', cleanId)
            .maybeSingle()
          
          console.log('Série encontrada por id_n:', sData?.titulo, 'id_n:', sData?.id_n)
          console.log('Todos os campos da série:', sData)
          if (sData) {
            localData = sData
            localSeriesId = cleanId
          } else {
            console.log('Série não encontrada com id_n:', cleanId)
          }
        }

        if (!localData || !localSeriesId) {
          console.log('Série não encontrada no banco de dados')
          router.push('/')
          return
        }

        console.log('Série encontrada:', localData.titulo, 'localSeriesId:', localSeriesId)
        setLegacyId(localSeriesId ? Number(localSeriesId) : null)

        // 2. Busca metadados ricos no TMDB
        let finalData = localData
        if (localData.tmdb_id) {
          try {
            const tmdbData = await getShowDetails(localData.tmdb_id)
            if (tmdbData) finalData = { ...tmdbData, ...localData }
          } catch (e) {
            console.warn("TMDB Series metadata not found, using local only");
          }

          // Só busca recomendações se o TMDB retornou dados com recomendações
          if (finalData !== localData && finalData.recommendations?.results?.length > 0) {
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
        let cid: string | null = null
        if (!cid && localData?.titulo) {
          const { data: contentData } = await sb.from('content').select('id').eq('title', localData.titulo).eq('type', 'series').maybeSingle()
          if (contentData) cid = contentData.id
        }
        if (cid) {
          setContentUuid(cid)
        } else {
          // Cria novo registro na tabela content se não existir
          const { data: newContent, error: insertError } = await sb
            .from('content')
            .insert({
              title: localData.titulo,
              type: 'series',
              is_published: true
            })
            .select('id')
            .maybeSingle()

          if (!insertError && newContent) {
            setContentUuid(newContent.id)
          }
        }

        // 3. Busca Temporadas e Episódios (Tentativa Híbrida)
        let seasonsData: any[] = []

        console.log('Buscando temporadas - localSeriesId:', localSeriesId, 'effectiveCid:', cid || contentUuid)
        console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

        // Verificação direta: contar temporadas na tabela legada
        if (localSeriesId && /^\d+$/.test(localSeriesId)) {
          // Primeiro, buscar TODAS as temporadas sem filtro para ver se há dados
          try {
            const { data: allTemporadas, count: allTempCount, error: tempError } = await sb
              .from('temporadas')
              .select('*', { count: 'exact' })
            console.log('TOTAL de temporadas na tabela temporadas (sem filtro):', allTempCount)
            if (tempError) {
              console.error('Erro ao buscar temporadas (sem filtro):', tempError)
            }
          } catch (e) {
            console.error('Exceção ao buscar temporadas (sem filtro):', e)
          }

          // Buscar uma amostra de temporadas sem filtro
          try {
            const { data: sampleTemporadas, error: sampleError } = await sb
              .from('temporadas')
              .select('*')
              .limit(5)
            console.log('Amostra de temporadas (sem filtro):', sampleTemporadas?.length, 'itens')
            if (sampleTemporadas && sampleTemporadas.length > 0) {
              console.log('Primeira temporada:', sampleTemporadas[0])
            }
            if (sampleError) {
              console.error('Erro ao buscar amostra de temporadas:', sampleError)
            }
          } catch (e) {
            console.error('Exceção ao buscar amostra de temporadas:', e)
          }

          // Agora buscar com filtro
          try {
            const { count, error: countError } = await sb
              .from('temporadas')
              .select('*', { count: 'exact', head: true })
              .eq('serie_id', localSeriesId)
            console.log('Total de temporadas na tabela legada com serie_id:', localSeriesId, '=', count)
            if (countError) {
              console.error('Erro ao contar temporadas com serie_id:', countError)
            }
          } catch (e) {
            console.error('Exceção ao contar temporadas com serie_id:', e)
          }

          // Buscar algumas temporadas para ver a estrutura
          try {
            const { data: sampleTemporadas, error: sampleError } = await sb
              .from('temporadas')
              .select('*')
              .limit(5)
            console.log('Amostra de temporadas:', sampleTemporadas)
            if (sampleError) {
              console.error('Erro ao buscar amostra de temporadas:', sampleError)
            }
          } catch (e) {
            console.error('Exceção ao buscar amostra de temporadas:', e)
          }

          // Verificar se há episódios na tabela episodios (precisa buscar via temporada_id)
          // Primeiro precisamos buscar as temporadas para saber os IDs
          const { data: tempForEpisodes, error: tempForEpError } = await sb
            .from('temporadas')
            .select('id_n')
            .eq('serie_id', localSeriesId)

          if (tempForEpError) {
            console.error('Erro ao buscar temporadas para episódios:', tempForEpError)
          }

          if (tempForEpisodes && tempForEpisodes.length > 0) {
            const tempIds = tempForEpisodes.map(t => t.id_n)
            const { count: epCount, error: epCountError } = await sb
              .from('episodios')
              .select('*', { count: 'exact', head: true })
              .in('temporada_id', tempIds)
            console.log('Total de episódios na tabela episodios para estas temporadas:', epCount)
            if (epCountError) {
              console.error('Erro ao contar episódios:', epCountError)
            }
          } else {
            console.log('Nenhuma temporada encontrada para buscar episódios')
          }

          // Buscar TOTAL de episódios sem filtro
          try {
            const { count: allEpCount, error: allEpError } = await sb
              .from('episodios')
              .select('*', { count: 'exact' })
            console.log('TOTAL de episódios na tabela episodios (sem filtro):', allEpCount)
            if (allEpError) {
              console.error('Erro ao buscar total de episódios:', allEpError)
            }
          } catch (e) {
            console.error('Exceção ao buscar total de episódios:', e)
          }

          // Buscar uma amostra de episódios sem filtro
          try {
            const { data: sampleEpisodes, error: sampleEpError } = await sb
              .from('episodios')
              .select('*')
              .limit(5)
            console.log('Amostra de episódios (sem filtro):', sampleEpisodes?.length, 'itens')
            if (sampleEpisodes && sampleEpisodes.length > 0) {
              console.log('Primeiro episódio:', sampleEpisodes[0])
            }
            if (sampleEpError) {
              console.error('Erro ao buscar amostra de episódios:', sampleEpError)
            }
          } catch (e) {
            console.error('Exceção ao buscar amostra de episódios:', e)
          }
        }

        // Verificação direta: contar episódios na tabela content
        if (cid || contentUuid) {
          const effectiveCid = cid || contentUuid
          const { count } = await sb
            .from('content')
            .select('*', { count: 'exact', head: true })
            .eq('parent_id', effectiveCid)
            .eq('type', 'episode')
          console.log('Total de episódios na tabela content com parent_id:', effectiveCid, '=', count)

          // Verificar se há episódios sem parent_id (diretamente vinculados)
          const { count: directCount } = await sb
            .from('content')
            .select('*', { count: 'exact', head: true })
            .eq('title', localData.titulo)
            .eq('type', 'episode')
          console.log('Total de episódios na tabela content com título (direto):', localData.titulo, '=', directCount)
        }

        // Primeiro tenta na tabela 'temporadas' (Legado)
        if (localSeriesId && /^\d+$/.test(localSeriesId)) {
          try {
            const { data: sLegacy, error: sLegacyError } = await sb
              .from('temporadas')
              .select('*')
              .eq('serie_id', localSeriesId)
              .order('numero_temporada', { ascending: true })

            if (sLegacyError) {
              console.error('Erro ao buscar temporadas (serie_id):', sLegacyError)
            }

            seasonsData = sLegacy || []
            console.log('Tabela legada (temporadas) - serie_id:', seasonsData.length, 'temporadas')
          } catch (err) {
            console.error('Exceção ao buscar temporadas:', err)
          }
        }

        // Se não houver temporadas na legada, tenta extrair do 'content' (Unificado)
        if (seasonsData.length === 0 && (cid || contentUuid)) {
          const effectiveCid = cid || contentUuid
          console.log('Tentando buscar temporadas/episódios na tabela content com parent_id:', effectiveCid)
          const { data: contentEpisodes } = await sb
            .from('content')
            .select('*')
            .eq('parent_id', effectiveCid)
            .eq('type', 'episode')

          if (contentEpisodes && contentEpisodes.length > 0) {
            const uniqueSeasons = Array.from(new Set(contentEpisodes.map((e: any) => e.season_number))).sort();
            seasonsData = uniqueSeasons.map(num => ({
              id_n: `s-${num}`,
              numero_temporada: num,
              titulo: `Temporada ${num}`
            }));
            console.log('Temporadas extraídas da tabela content:', seasonsData.length, 'temporadas de', contentEpisodes.length, 'episódios')
          } else {
            console.log('Nenhum episódio encontrado na tabela content com parent_id:', effectiveCid)
          }
        } else {
          console.log('effectiveCid não disponível, não é possível buscar na tabela content')
        }

        console.log('Temporadas encontradas:', seasonsData.length, seasonsData)
        setSeasons(seasonsData || [])
        if (seasonsData && seasonsData.length > 0) {
          const firstSeason = seasonsData[0]
          setSelectedSeason(firstSeason)

          // Busca episódios da primeira temporada
          const seasonId = String(firstSeason.id_n || firstSeason.id || '');
          console.log('Buscando episódios da primeira temporada - seasonId:', seasonId, 'numero_temporada:', firstSeason.numero_temporada)
          let episodesData: any[] = []

          // Só tenta tabela legada se o ID for numérico
          if (/^\d+$/.test(seasonId)) {
            console.log('Tentando tabela legada (episodios) com temporada_id:', seasonId)
            const { data: eLegacy } = await sb
              .from('episodios')
              .select('*')
              .eq('temporada_id', seasonId)
              .order('numero_episodio', { ascending: true })
            episodesData = eLegacy || []
            console.log('Tabela legada (episodios) - temporada_id:', episodesData.length, 'episódios')
          } else {
            console.log('seasonId não é numérico, pulando tabela legada')
          }

          // Fallback para content
          if (episodesData.length === 0 && (cid || contentUuid)) {
            const effectiveCid = cid || contentUuid
            console.log('Tentando tabela content com parent_id:', effectiveCid, 'e season_number:', firstSeason.numero_temporada)
             const { data: cEps } = await sb
               .from('content')
               .select('*')
               .eq('parent_id', effectiveCid)
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
               console.log('Episódios encontrados na tabela content:', episodesData.length)
             } else {
               console.log('Nenhum episódio encontrado na tabela content')
             }
          } else {
            console.log('effectiveCid não disponível ou episódios já encontrados na legada')
          }
          console.log('Episódios encontrados para temporada', firstSeason.numero_temporada, ':', episodesData.length)
          setEpisodes(episodesData || [])
        } else {
          console.log('Nenhuma temporada encontrada para a série')
        }
      } catch (err) {
        console.error("Erro ao carregar série:", err)
      } finally {
        setLoading(false)
      }
    }

    loadSeries()
  }, [id, router, user])

  const startParty = useCallback(async () => {
    if (!user) {
      router.push('/login')
      return
    }

    const newRoomId = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const sb = createClient()

    console.log('Criando sala:', newRoomId, 'para conteúdo:', id, 'tipo: serie')

    // Criar sala na tabela party_rooms
    const { error, data } = await sb.from('party_rooms').insert({
      id: newRoomId,
      content_id: id,
      content_type: 'serie',
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

  // Implementação do próximo episódio automático
  const handleNextEpisode = useCallback(() => {
    if (!activeEpisode || episodes.length === 0) return

    // Encontra o índice do episódio atual
    const currentIndex = episodes.findIndex(ep =>
      String(ep.id_n || ep.id) === String(activeEpisode.id_n || activeEpisode.id)
    )

    if (currentIndex !== -1 && currentIndex < episodes.length - 1) {
      // Próximo na mesma temporada
      handleEpisodeClick(episodes[currentIndex + 1])
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
  }, [activeEpisode, episodes, seasons, selectedSeason, handleEpisodeClick])

  // Função para obter informações do próximo episódio
  const getNextEpisodeInfo = useCallback(() => {
    if (!activeEpisode || episodes.length === 0) return null

    const currentIndex = episodes.findIndex(ep =>
      String(ep.id_n || ep.id) === String(activeEpisode.id_n || activeEpisode.id)
    )

    if (currentIndex !== -1 && currentIndex < episodes.length - 1) {
      const nextEp = episodes[currentIndex + 1]
      const thumbnail = nextEp.imagem_500 || nextEp.banner ? TMDB_IMG.backdrop(nextEp.imagem_500 || nextEp.banner) : null
      return {
        title: nextEp.titulo || `Episódio ${nextEp.numero_episodio}`,
        thumbnail
      }
    }

    // Verifica próxima temporada
    const currentSeasonIndex = seasons.findIndex(s =>
      String(s.id_n || s.id) === String(selectedSeason?.id_n || selectedSeason?.id)
    )

    if (currentSeasonIndex !== -1 && currentSeasonIndex < seasons.length - 1) {
      const nextSeason = seasons[currentSeasonIndex + 1]
      return {
        title: `Temporada ${nextSeason.numero_temporada} - Episódio 1`,
        thumbnail: series.backdrop_path ? TMDB_IMG.backdrop(series.backdrop_path) : null
      }
    }

    return null
  }, [activeEpisode, episodes, seasons, selectedSeason, series])

  // Efeito para iniciar o primeiro episódio da nova temporada após o autoPlay
  useEffect(() => {
    if (autoPlayNext && episodes.length > 0) {
      handleEpisodeClick(episodes[0])
      setAutoPlayNext(false)
    }
  }, [episodes, autoPlayNext, handleEpisodeClick])

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
        content_type: 'serie',
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

  // Busca episódios quando a temporada muda
  useEffect(() => {
    const seasonId = String(selectedSeason?.id_n || selectedSeason?.id || '');
    console.log('Mudando para temporada:', selectedSeason?.numero_temporada, 'ID:', seasonId)
    if (!seasonId || loading) return

    async function loadEpisodes() {
      const sb = createClient()
      console.log('loadEpisodes - seasonId:', seasonId, 'contentUuid:', contentUuid, 'selectedSeason.numero_temporada:', selectedSeason?.numero_temporada)
      let episodesData: any[] = []

      // Só tenta tabela legada se for numérico
      if (/^\d+$/.test(seasonId)) {
        console.log('Tentando tabela legada (episodios) com temporada_id:', seasonId)
        const { data: eLegacy } = await sb
          .from('episodios')
          .select('*')
          .eq('temporada_id', seasonId)
          .order('numero_episodio', { ascending: true })
        episodesData = eLegacy || []
        console.log('Tabela legada (episodios) - temporada_id:', episodesData.length, 'episódios')
      } else {
        console.log('seasonId não é numérico, pulando tabela legada')
      }

      // Fallback para content
      if ((!episodesData || episodesData.length === 0) && contentUuid) {
        console.log('Tentando tabela content com parent_id:', contentUuid, 'e season_number:', selectedSeason?.numero_temporada)
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
          console.log('Episódios encontrados na tabela content:', episodesData.length)
        } else {
          console.log('Nenhum episódio encontrado na tabela content')
        }
      } else {
        console.log('contentUuid não disponível ou episódios já encontrados na legada')
      }
     console.log('Episódios carregados para temporada', selectedSeason?.numero_temporada, ':', episodesData.length)
     setEpisodes(episodesData || [])
    }

    loadEpisodes()
  }, [selectedSeason, loading, contentUuid])

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
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent" />
      </div>

      {/* Conteúdo - Ajustado padding para visibilidade imediata das temporadas */}
      <div className="relative pt-[40vh] sm:pt-[50vh] md:pt-[60vh] lg:pt-[82vh] px-4 sm:px-6 md:px-16 z-10">
        <div className="max-w-6xl">
        <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-4 drop-shadow-2xl">
          {title}
        </h1>
        {series.tagline && (
          <p className="text-brand-cyan font-bold tracking-widest uppercase text-sm mb-4 drop-shadow-md">{series.tagline}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-6 sm:mb-8 text-xs sm:text-sm md:text-base font-bold">
          {countryCode && countryCode.length === 2 && (
            <img 
              src={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`} 
              alt={countryCode}
              className="h-4 sm:h-7 w-auto object-contain rounded-sm shadow-sm"
              title={countryCode}
            />
          )}
          <span className="bg-brand-cyan text-black px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs">TMDB {series.vote_average?.toFixed(1) || series.rating}</span>
          <span className="text-neutral-400 text-xs sm:text-sm">{series.first_air_date?.slice(0, 4) || series.ano}</span>
          {series.number_of_seasons && (
            <span className="text-neutral-400 font-bold uppercase tracking-widest text-xs sm:text-sm">{series.number_of_seasons} Temporadas</span>
          )}
        </div>

        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-neutral-300 leading-relaxed mb-6 sm:mb-8 max-w-3xl drop-shadow px-2">
          {description}
        </p>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 max-w-2xl mb-8 sm:mb-12">
          {/* Botão Assistir Agora (Cor do Logo) */}
          <button
            onClick={() => episodes[0] && handleEpisodeClick(episodes[0])}
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

          {/* Botão Trailer */}
          {series.trailer && (
            <button
              onClick={() => setShowTrailerModal(true)}
              className="flex-1 min-w-[80px] sm:flex-none px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-[#FF0000] text-white font-montserrat font-black uppercase tracking-wider sm:tracking-widest rounded-[12px] sm:rounded-[16px] md:rounded-[20px] hover:brightness-110 transition-all transform hover:scale-105 focus:ring-4 focus:ring-red-600 outline-none border border-transparent text-xs sm:text-sm md:text-base"
            >
              🎬 Trailer
            </button>
          )}

          {/* Botão Favoritos (Apenas ícone) */}
          <button 
            onClick={toggleFavorite}
            className={`p-2 sm:p-3 md:p-4 rounded-[12px] sm:rounded-[16px] md:rounded-[20px] transition-all border border-white/10 focus:ring-4 outline-none ${isFavorite ? 'bg-red-600/20 border-red-600 text-red-600 focus:ring-red-600' : 'bg-white/5 text-white hover:bg-white/10 focus:ring-white'}`}
            title={isFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
          >
            <Heart className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 ${isFavorite ? 'fill-red-600 text-red-600' : 'fill-none'}`} />
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
                onClick={() => handleEpisodeClick(ep)}
                className="group flex flex-col gap-4 text-left p-4 rounded-2xl hover:bg-white/5 transition-all focus:ring-4 focus:ring-brand-cyan outline-none border border-transparent hover:border-white/10"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-neutral-800 border border-white/5">
                  {imageUrl ? (
                    <Image 
                      src={imageUrl} 
                      alt={ep.titulo || ''} 
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
          contentId={contentUuid ? `${contentUuid}-ep-${activeEpisode?.id_n || activeEpisode?.id || episodes[0]?.id_n || episodes[0]?.id}` : String(series.id_n || series.id)}
          userId={user?.id}
          startOffset={savedProgress}
          onClose={() => { setShowPlayer(false); setActiveEpisode(null); setActiveRoomId(null); setGuestName(''); setAutoPlayNext(false); setSavedProgress(0); }}
          partyRoomId={activeRoomId}
          isGuest={isGuestMode}
          guestName={guestName}
          backdrop={series.backdrop_path || series.banner}
          onNext={handleNextEpisode}
          nextEpisode={getNextEpisodeInfo()}
        />
      )}

      {/* Modal de Trailer */}
      {series.trailer && (
        <TrailerModal
          isOpen={showTrailerModal}
          onClose={() => setShowTrailerModal(false)}
          trailerUrl={series.trailer}
        />
      )}

      {/* Modal de Continuar/Reiniciar */}
      {showResumeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 rounded-2xl p-6 sm:p-8 max-w-md w-full border border-white/10 shadow-2xl">
            <div className="flex items-start gap-4 mb-6">
              {series?.poster && (
                <div className="w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-800">
                  <Image
                    src={series.poster.startsWith('http') ? series.poster : `https://image.tmdb.org/t/p/w500${series.poster}`}
                    alt={series.titulo}
                    width={96}
                    height={144}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-black uppercase text-white mb-2">Continuar Assistindo?</h3>
                <p className="text-neutral-300 text-sm">
                  Você parou em {Math.floor(savedProgress / 60)}:{(savedProgress % 60).toString().padStart(2, '0')} do episódio.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold uppercase rounded-xl transition-all border border-white/20"
              >
                Reiniciar
              </button>
              <button
                onClick={handleResume}
                className="flex-1 px-4 py-3 bg-brand-cyan hover:brightness-110 text-white font-bold uppercase rounded-xl transition-all"
              >
                Continuar
              </button>
            </div>
            <button
              onClick={() => setShowResumeModal(false)}
              className="mt-4 w-full text-neutral-400 hover:text-white text-sm font-bold uppercase transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </main>
  )
}