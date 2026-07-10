import { supabase } from '@/integrations/supabase/client'

export async function getMovies() {
  const { data, error } = await supabase
    .from('cinema')
    .select('*')
    .eq('type', 'movie')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) console.error('Erro ao buscar filmes:', error)
  return data || []
}

export async function getSeries() {
  const { data, error } = await supabase
    .from('series')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) console.error('Erro ao buscar séries:', error)
  return data || []
}

export async function getSeriesDetails(seriesId: number) {
  const { data: serie, error: serieError } = await supabase
    .from('series')
    .select('*')
    .eq('id_n', seriesId)
    .single()

  if (serieError) {
    console.error('Erro ao buscar série:', serieError)
    return null
  }

  const { data: temporadas, error: tempError } = await supabase
    .from('temporadas')
    .select('*')
    .eq('serie_id', seriesId)
    .order('numero_temporada', { ascending: true })

  if (tempError) console.error('Erro ao buscar temporadas:', tempError)

  const episodiosPorTemp: { [key: number]: any[] } = {}

  if (temporadas) {
    for (const temp of temporadas) {
      const { data: eps, error: epsError } = await supabase
        .from('episodios')
        .select('*')
        .eq('temporada_id', temp.id_n)
        .order('numero_episodio', { ascending: true })

      if (epsError) {
        console.error(`Erro ao buscar episódios da temporada ${temp.id_n}:`, epsError)
      }

      episodiosPorTemp[temp.id_n] = eps || []
    }
  }

  return {
    serie,
    temporadas: temporadas || [],
    episodios: episodiosPorTemp
  }
}

export async function getMovieDetails(movieId: number) {
  const { data, error } = await supabase
    .from('cinema')
    .select('*')
    .eq('id', movieId)
    .single()

  if (error) console.error('Erro ao buscar filme:', error)
  return data
}

export function getPosterUrl(item: any): string {
  if (item.poster) return item.poster
  if (item.backdrop) return item.backdrop
  if (item.banner) return item.banner
  if (item.capa) return item.capa
  if (item.imagem_500) return item.imagem_500
  if (item.imagem_342) return item.imagem_342
  if (item.imagem_185) return item.imagem_185
  return '/placeholder-poster.png'
}

export function getStreamUrl(item: any): string {
  return item.url || item.arquivo || ''
}