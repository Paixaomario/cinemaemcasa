/**
 * Search Suggestions Module
 * Provides real-time search suggestions with autocomplete functionality
 * Cloud-based configuration for future AI maintenance
 * 
 * Features:
 * - Real-time autocomplete with debouncing
 * - Popular searches tracking
 * - Category-based suggestions
 * - Fuzzy matching support
 */

import { createClient } from './supabase'

export interface SuggestionItem {
  id: string
  text: string
  type: 'history' | 'category' | 'popular' | 'prediction'
  icon?: string
  poster?: string | null
  metadata?: {
    resultCount?: number
    trending?: boolean
  }
}

interface SuggestionsConfig {
  maxHistoryResults: number
  maxPopularResults: number
  maxPredictions: number
  debounceMs: number
  minCharsForSuggestions: number
}

// Configuration padrão (pode ser sobrescrita via Cloud Config)
const DEFAULT_CONFIG: SuggestionsConfig = {
  maxHistoryResults: 5,
  maxPopularResults: 3,
  maxPredictions: 5,
  debounceMs: 300,
  minCharsForSuggestions: 2
}

// Cache em memória para sugestões (até 1 hora)
const suggestionCache = new Map<string, { data: SuggestionItem[]; timestamp: number }>()
const CACHE_DURATION = 60 * 60 * 1000 // 1 hora

/**
 * Fuzzy search para encontrar correspondências próximas
 */
export function fuzzyMatch(input: string, target: string): number {
  if (!input || !target) return 0
  const inputStr = String(input)
  const targetStr = String(target)
  const inputLower = inputStr.toLowerCase()
  const targetLower = targetStr.toLowerCase()

  if (!inputLower.length) return 0
  if (targetLower.startsWith(inputLower)) return 100 // Match exato no início
  if (targetLower.includes(inputLower)) return 80 // Match exato em qualquer lugar

  // Levenshtein distance simplificado (1-2 caracteres de diferença)
  let matches = 0
  for (let char of inputLower) {
    if (targetLower.includes(char)) matches++
  }

  return (matches / inputLower.length) * 100
}

/**
 * Gera sugestões baseadas no input do usuário
 * Combina histórico, categorias populares e previsões
 */
export async function generateSuggestions(
  input: string,
  searchHistory: Array<string | { query: string; count?: number; resultCount?: number; timestamp?: number }> = [],
  categories: string[] = ['Ação', 'Comédia', 'Terror', 'Drama', 'Ficção', 'Romance', 'Animação', 'Documentário']
): Promise<SuggestionItem[]> {
  const config = DEFAULT_CONFIG

  // Retorna sugestões vazias se input for muito curto
  if (input.trim().length < config.minCharsForSuggestions) {
    return []
  }

  // Verifica cache
  const cached = suggestionCache.get(input.toLowerCase())
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  const suggestions: SuggestionItem[] = []

  try {
    // 1. Normalize e sugestões do histórico (fuzzy match)
    const normalizedHistory = (searchHistory || []).map(h => (typeof h === 'string' ? h : h.query || ''))
    const historyMatches = normalizedHistory
      .map(historyItem => ({
        item: historyItem,
        score: fuzzyMatch(input, historyItem)
      }))
      .filter(h => h.score >= 60)
      .sort((a, b) => b.score - a.score)
      .slice(0, config.maxHistoryResults)
      .map(h => ({
        id: `history-${h.item}`,
        text: h.item,
        type: 'history' as const,
        icon: '🕐'
      }))

    suggestions.push(...historyMatches)

    // 3. Buscar previsões do banco de dados (títulos populares)
    const predictions = await fetchPredictions(input, config.maxPredictions)
    suggestions.push(...predictions)

    // Cache resultado
    suggestionCache.set(input.toLowerCase(), {
      data: suggestions,
      timestamp: Date.now()
    })

    return suggestions
  } catch (error) {
    console.error('Error generating suggestions:', error)
    // Retorna sugestões vazias em caso de erro
    return []
  }
}

/**
 * Busca previsões de títulos no banco de dados
 * Usa full-text search quando disponível
 */
async function fetchPredictions(
  input: string,
  limit: number
): Promise<SuggestionItem[]> {
  try {
    const sb = createClient()
    
    // Busca unificada no catálogo de pesquisa para performance profissional
    const { data: matches } = await sb
      .from('search_catalog')
      .select('source_id, source_table, titulo, poster, banner, tipo')
      .ilike('titulo', `%${input}%`) // Busca em qualquer parte do título
      .limit(limit)

    const predictions: SuggestionItem[] = []

    if (matches) {
      return matches.map((item: any) => ({
        id: `prediction-${item.source_table}-${item.source_id}`,
        text: item.titulo,
        type: 'prediction' as const,
        poster: item.poster || item.banner,
        icon: item.tipo === 'movie' ? '🎬' : '📺',
        metadata: { resultCount: 1 }
      }))
    }

    return []
  } catch (error) {
    console.error('Error fetching predictions:', error)
    return []
  }
}

/**
 * Rastreia buscas populares (agregado anônimo)
 * Armazenado em tabela de analytics
 */
export async function trackSearch(query: string, resultCount: number, region: string = 'BR') {
  try {
    // Chama a API Next.js para rastrear a busca, que por sua vez chama a RPC do Supabase
    await fetch('/api/search/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, result_count: resultCount, region }),
    });
  } catch (error) {
    // Falha silenciosa em analytics
    console.debug('Analytics tracking failed:', error)
  }
}

/**
 * Limpa cache de sugestões (útil para testes ou atualizações)
 */
export function clearSuggestionsCache() {
  suggestionCache.clear()
}

/**
 * Obtém sugestões populares para a tela inicial da busca
 */
export async function getPopularSearches(region: string = 'BR'): Promise<SuggestionItem[]> {
  try {
    const sb = createClient()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const dateStr = sevenDaysAgo.toISOString().split('T')[0]

    // Usamos um limite menor e tratamento de erro silencioso para evitar que falhas de rede/banco travem a UI
    const { data, error } = await sb
      .from('search_analytics')
      .select('query, count')
      .eq('region', region || 'BR')
      .gte('created_at', dateStr) // Corrigido para usar 'created_at'
      .order('count', { ascending: false })
      .limit(5);

    if (error) {
      console.debug('Analytics Query Error (Non-critical):', error.message);
      return [];
    }

    return (data || [])
      .map((item: any) => ({
        id: `popular-${item.query}`,
        text: item.query,
        type: 'popular' as const,
        icon: '🔥',
        metadata: { trending: true }
      }))
  } catch (error) {
    console.error('Error fetching popular searches:', error)
    return []
  }
}

/**
 * Limpa sugestões antigas do cache (chamado periodicamente)
 */
export function cleanupCache() {
  const now = Date.now()
  for (const [key, value] of suggestionCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      suggestionCache.delete(key)
    }
  }
}
