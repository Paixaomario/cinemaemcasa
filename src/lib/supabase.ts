import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ebbuobnltsrvqxayrulk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViYnVvYm5sdHNydnF4YXlydWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMDI0NjQsImV4cCI6MjA5Mzg3ODQ2NH0.9QAf6l69lPn48MhAD2Xgf3adNzEpf6LkBCk3jfqqGXI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos baseados no banco de dados
export interface Cinema {
  id: number
  titulo: string
  poster?: string | null
  banner?: string | null
  backdrop?: string | null
  url?: string | null
  trailer?: string | null
  year?: number
  category?: string
  rating?: number
  duration?: string
  description?: string
}

export interface Series {
  id_n: number
  titulo: string
  poster?: string | null
  capa?: string | null
  banner?: string | null
  ano?: number
  genero?: string
  classificacao?: string
  rating?: number
  trailer?: string | null
  descricao?: string
}

export interface HomeSection {
  id: string
  titulo: string
  categorias: string[]
  fonte: 'cinema' | 'series'
  layout: 'row' | 'grid'
  limite: number
  ordenacao: string
  posicao: number
  ativo: boolean
}
