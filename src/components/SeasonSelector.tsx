'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Episode {
  id_n: string | number
  titulo: string
  numero_episodio: number
  descricao?: string
  banner?: string
  imagem_500?: string
  imagem_342?: string
  imagem_185?: string
  duracao?: string
}

interface Season {
  id_n: string | number
  numero_temporada: number
}

interface SeasonSelectorProps {
  seasons: Season[]
  episodesBySeason: Record<string, Episode[]>
}

export function SeasonSelector({ seasons, episodesBySeason }: SeasonSelectorProps) {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | number | null>(
    seasons.length > 0 ? seasons[0].id_n : null
  )

  const selectedEpisodes = selectedSeasonId ? episodesBySeason[String(selectedSeasonId)] || [] : []

  return (
    <div className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 sm:p-8 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-3xl font-bold text-white">Episódios</h2>
        {seasons.length > 1 && (
          <div className="relative">
            <select
              value={selectedSeasonId ?? ''}
              onChange={(e) => setSelectedSeasonId(e.target.value)}
              className="w-full sm:w-auto appearance-none rounded-full border border-white/10 bg-slate-900 px-5 py-3 pr-10 text-lg font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Selecionar temporada"
            >
              {seasons.map((season) => (
                <option key={season.id_n} value={season.id_n}>
                  Temporada {season.numero_temporada}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {selectedEpisodes.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {selectedEpisodes.map((episode) => (
            <Link
              key={episode.id_n}
              href={`/assistir/${episode.id_n}`}
              className="group space-y-3 rounded-lg p-2 transition-colors hover:bg-white/5"
            >
              <div className="relative aspect-video w-full overflow-hidden rounded-md bg-slate-800">
                {(episode.banner || episode.imagem_500 || episode.imagem_342) && (
                  <img
                    src={episode.banner || episode.imagem_500 || episode.imagem_342}
                    alt={episode.titulo || `Episódio ${episode.numero_episodio}`}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <svg className="h-12 w-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
              </div>
              <div className="flex items-start justify-between gap-4">
                <p className="flex-1 font-bold text-slate-100 line-clamp-2 text-xs">
                  {episode.numero_episodio}. {episode.titulo || `Episódio ${episode.numero_episodio}`}
                </p>
                {episode.duracao && (
                  <p className="text-xs text-slate-400">{episode.duracao}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-slate-400">Nenhum episódio encontrado para esta temporada.</p>
      )}
    </div>
  )
}