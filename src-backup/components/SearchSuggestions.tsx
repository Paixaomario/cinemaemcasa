'use client'

import React, { useState, useEffect, useRef } from 'react'
import type { SuggestionItem } from '@/lib/searchSuggestions'
import { generateSuggestions } from '@/lib/searchSuggestions'
import { getLocationBasedSuggestions, getLocationWithFallback } from '@/lib/geolocation'

interface SearchSuggestionsProps {
  input: string
  searchHistory: string[]
  onSuggestionSelect: (suggestion: string) => void
  onSuggestionHighlight?: (suggestion: CombinedSuggestion | null) => void
  isWebOS?: boolean
  maxVisible?: number
}

interface CombinedSuggestion {
  id: string
  text: string
  type: 'history' | 'category' | 'popular' | 'prediction' | 'regional' | 'trending-in-region' | 'local-premiere'
  icon?: string
  metadata?: {
    resultCount?: number
    trending?: boolean
  }
  isLocationBased?: boolean
  locationRegion?: string
}

/**
 * Componente de Sugestões em Tempo Real com Autocomplete
 * 
 * Features:
 * - Sugestões IIFE (história + categorias + previsões)
 * - Sugestões baseadas em localização (opcional)
 * - Navegação por teclado (Enter, ArrowUp, ArrowDown)
 * - Navegação por WebOS D-Pad (simula teclado)
 * - Destaque visual com foco
 * - Debounce automático para performance
 */
export function SearchSuggestions({
  input,
  searchHistory,
  onSuggestionSelect,
  onSuggestionHighlight,
  isWebOS = false,
  maxVisible = 8
}: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<CombinedSuggestion[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [locationRegion, setLocationRegion] = useState<string>('BR')
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const highlightedElementRef = useRef<HTMLDivElement>(null)

  // Carregar sugestões de localização uma vez
  useEffect(() => {
    const loadLocationData = async () => {
      try {
        const locationData = await getLocationWithFallback()
        setLocationRegion(locationData.region)
      } catch (error) {
        console.error('Error loading location:', error)
      }
    }

    loadLocationData()
  }, [])

  // Gerar sugestões quando input muda (com debounce)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!input.trim()) {
      setSuggestions([])
      setHighlightedIndex(-1)
      return
    }

    setIsLoading(true)

    debounceTimerRef.current = setTimeout(async () => {
      try {
        // Gerar sugestões normais
        const suggestions = await generateSuggestions(
          input,
          searchHistory
        )

        // Adicionar sugestões de localização se der
        let allSuggestions: CombinedSuggestion[] = suggestions

        if (showLocationSuggestions) {
          try {
            const locationSuggestions = await getLocationBasedSuggestions(locationRegion)
            allSuggestions = [
              ...suggestions.slice(0, 3), // Primeiros 3 normais
              ...locationSuggestions.map(s => ({
                id: s.id,
                text: s.title,
                type: s.type as 'regional' | 'trending-in-region' | 'local-premiere',
                icon: s.icon,
                isLocationBased: true,
                locationRegion: s.region
              })),
              ...suggestions.slice(3) // Rest normais
            ]
          } catch {
            // Se location suggestions falharem, usar apenas normais
          }
        }

        setSuggestions(allSuggestions.slice(0, maxVisible))
        setHighlightedIndex(-1)
      } finally {
        setIsLoading(false)
      }
    }, 300) // 300ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [input, searchHistory, showLocationSuggestions, maxVisible, locationRegion])

  // Navegação por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (input.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1))
          break
        case 'Enter':
          e.preventDefault()
          if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
            onSuggestionSelect(suggestions[highlightedIndex].text)
          } else if (input.trim()) {
            onSuggestionSelect(input.trim())
          }
          break
        case 'Escape':
          e.preventDefault()
          setSuggestions([])
          setHighlightedIndex(-1)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [input, suggestions, highlightedIndex, onSuggestionSelect])

  // Scroll para elemento destacado
  useEffect(() => {
    if (highlightedElementRef.current && containerRef.current) {
      highlightedElementRef.current.scrollIntoView({
        block: 'nearest'
      })
    }

    if (onSuggestionHighlight && highlightedIndex >= 0) {
      onSuggestionHighlight(suggestions[highlightedIndex])
    }
  }, [highlightedIndex, suggestions, onSuggestionHighlight])

  if (!input.trim() || suggestions.length === 0) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1f] border-2 border-brand-cyan/30 rounded-xl overflow-hidden shadow-2xl max-h-[400px] overflow-y-auto z-50"
      role="listbox"
    >
      {isLoading && (
        <div className="px-4 py-3 border-b border-white/10 text-white/60 text-sm">
          Carregando sugestões...
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="divide-y divide-white/5">
          {suggestions.map((suggestion, index) => (
            <SuggestionItem
              key={suggestion.id}
              suggestion={suggestion}
              isHighlighted={index === highlightedIndex}
              ref={index === highlightedIndex ? highlightedElementRef : null}
              onClick={() => {
                onSuggestionSelect(suggestion.text)
                setSuggestions([])
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              isWebOS={isWebOS}
            />
          ))}
        </div>
      )}

      {suggestions.length === 0 && !isLoading && (
        <div className="px-4 py-8 text-center text-white/40 text-sm">
          Nenhuma sugestão encontrada
        </div>
      )}

      {/* Rótulo do rodapé */}
      <div className="sticky bottom-0 bg-black/50 border-t border-white/5 px-4 py-2 text-[10px] text-white/40 uppercase tracking-wider">
        {isWebOS ? '↑↓ Navegar • ⊙ Selecionar' : '↑↓ Navegar • Enter Selecionar • Esc Cancelar'}
      </div>
    </div>
  )
}

/**
 * Componente individual de sugestão (memoizado para performance)
 */
interface SuggestionItemProps {
  suggestion: CombinedSuggestion
  isHighlighted: boolean
  onClick: () => void
  onMouseEnter: () => void
  isWebOS?: boolean
}

const SuggestionItem = React.forwardRef<HTMLDivElement, SuggestionItemProps>(
  ({ suggestion, isHighlighted, onClick, onMouseEnter, isWebOS }, ref) => {
    return (
      <div
        ref={ref}
        role="option"
        aria-selected={isHighlighted}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        className={`px-4 py-3 cursor-pointer transition-all duration-200 ${
          isHighlighted
            ? 'bg-brand-cyan/20 border-l-2 border-brand-cyan'
            : 'hover:bg-white/5'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Ícone do tipo de sugestão */}
          <span className="text-lg flex-shrink-0">
            {suggestion.isLocationBased ? '📍' : suggestion.icon}
          </span>

          {/* Texto principal */}
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm truncate ${
              isHighlighted ? 'text-brand-cyan' : 'text-white'
            }`}>
              {suggestion.text}
            </p>

            {/* Subtexto/contexto */}
            {(suggestion.type !== 'history' || suggestion.isLocationBased) && (
              <p className="text-xs text-white/40 truncate">
                {suggestion.isLocationBased
                  ? `Tendência em ${suggestion.locationRegion}`
                  : suggestion.type === 'category'
                    ? 'Categoria'
                    : suggestion.type === 'popular'
                      ? 'Populares'
                      : 'Conteúdo'}
              </p>
            )}
          </div>

          {/* Metadados extra */}
          {suggestion.metadata?.resultCount && (
            <span className="text-xs text-white/40 flex-shrink-0 px-2 py-1 bg-white/5 rounded">
              {suggestion.metadata.resultCount}
            </span>
          )}

          {isHighlighted && (
            <span className="text-brand-cyan flex-shrink-0">
              {isWebOS ? '→' : '→'}
            </span>
          )}
        </div>
      </div>
    )
  }
)

SuggestionItem.displayName = 'SuggestionItem'

export default SearchSuggestions
