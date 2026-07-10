import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

// Tipos
export interface Cinema {
  id: string
  titulo: string
  description?: string
  tmdb_id?: number
  url?: string
  trailer?: string
  year?: number
  rating?: number
  duration?: string
  duration_seconds?: number
  category?: string
  genre?: string
  type?: string
  poster?: string
  banner?: string
  backdrop?: string
  created_at?: string
  subtitles?: any
  audio_tracks?: any
}

export interface Series {
  id_n: string
  titulo: string
  descricao?: string
  ano?: number
  tmdb_id?: number
  capa?: string
  banner?: string
  trailer?: string
  genero?: string
  classificacao?: string
  rating?: number
  poster?: string
  tmdb_runtime?: string
  created_at?: string
  updated_at?: string
}

export { createClient }
