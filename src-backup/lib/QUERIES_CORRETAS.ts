// src/lib/queries.ts
// Queries corretas que usam os campos certos das tabelas

import { supabase } from '@/integrations/supabase/client'

// ✅ BUSCAR FILMES COM POSTER CORRETO
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

// ✅ BUSCAR SÉRIE COM CAPA CORRETA (não poster!)
export async function getSeries() {
  const { data, error } = await supabase
    .from('series')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) console.error('Erro ao buscar séries:', error)
  return data || []
}

// ✅ BUSCAR DETALHES DA SÉRIE COM TEMPORADAS E EPISÓDIOS
export async function getSeriesDetails(seriesId: number) {
  // Buscar série
  const { data: serie, error: serieError } = await supabase
    .from('series')
    .select('*')
    .eq('id_n', seriesId)
    .single()

  if (serieError) {
    console.error('Erro ao buscar série:', serieError)
    return null
  }

  // Buscar temporadas
  const { data: temporadas, error: tempError } = await supabase
    .from('temporadas')
    .select('*')
    .eq('serie_id', seriesId)
    .order('numero_temporada', { ascending: true })

  if (tempError) console.error('Erro ao buscar temporadas:', tempError)

  // Buscar episódios para cada temporada
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

// ✅ BUSCAR FILME COM DETALHE COMPLETO
export async function getMovieDetails(movieId: number) {
  const { data, error } = await supabase
    .from('cinema')
    .select('*')
    .eq('id', movieId)
    .single()

  if (error) console.error('Erro ao buscar filme:', error)
  return data
}

// ✅ BUSCAR POR CATEGORIA
export async function getMoviesByCategory(category: string) {
  const { data, error } = await supabase
    .from('cinema')
    .select('*')
    .eq('type', 'movie')
    .ilike('category', `%${category}%`)
    .limit(20)

  if (error) console.error('Erro ao buscar por categoria:', error)
  return data || []
}

// ✅ BUSCAR POR GÊNERO
export async function getMoviesByGenre(genre: string) {
  const { data, error } = await supabase
    .from('cinema')
    .select('*')
    .eq('type', 'movie')
    .ilike('genre', `%${genre}%`)
    .limit(20)

  if (error) console.error('Erro ao buscar por gênero:', error)
  return data || []
}

// ✅ BUSCAR COM FILTRO COMPLETO
export async function searchContent(query: string) {
  // Procura em filmes
  const { data: movies } = await supabase
    .from('cinema')
    .select('*')
    .ilike('titulo', `%${query}%`)
    .limit(10)

  // Procura em séries
  const { data: series } = await supabase
    .from('series')
    .select('*')
    .ilike('titulo', `%${query}%`)
    .limit(10)

  return {
    movies: movies || [],
    series: series || []
  }
}

// ✅ HELPER: Obter URL da capa (que podem estar em diferentes campos)
export function getPosterUrl(item: any): string {
  // Para filmes (cinema)
  if (item.poster) return item.poster
  if (item.backdrop) return item.backdrop
  if (item.banner) return item.banner
  
  // Para séries (series)
  if (item.capa) return item.capa
  
  // Para episódios (episodios)
  if (item.imagem_500) return item.imagem_500
  if (item.imagem_342) return item.imagem_342
  if (item.imagem_185) return item.imagem_185
  
  // Fallback
  return '/placeholder-poster.png'
}

// ✅ HELPER: Obter URL de streaming
export function getStreamUrl(item: any): string {
  return item.url || item.arquivo || ''
}
