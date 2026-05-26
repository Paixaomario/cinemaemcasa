'use client'

interface StatisticsSectionProps {
  statistics?: {
    total_watch_time?: number
    movies_watched?: number
    series_watched?: number
    episodes_watched?: number
    last_watch_date?: string
    most_watched_genre?: string
  }
}

export function StatisticsSection({ statistics }: StatisticsSectionProps) {
  const formatWatchTime = (seconds?: number) => {
    if (!seconds) return '0h'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}min`
    }
    return `${minutes}min`
  }

  const formatDate = (date?: string | null) => {
    if (!date) return 'Nunca'
    const d = new Date(date)
    return d.toLocaleDateString('pt-BR')
  }

  const stats = statistics || {
    total_watch_time: 0,
    movies_watched: 0,
    series_watched: 0,
    episodes_watched: 0,
    last_watch_date: null,
    most_watched_genre: null,
  }

  return (
    <section className="animate-in fade-in slide-in-from-left-4 duration-1000">
      <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 flex items-center gap-4 text-[var(--gold-primary)]">
        <span className="w-2 h-10 rounded-full bg-[var(--gold-primary)]"></span>
        Estatísticas do Perfil
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tempo Total Assistido */}
        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-all">
          <div className="text-4xl mb-2">⏱️</div>
          <h3 className="text-sm text-gray-400 uppercase font-bold mb-1">Tempo Total</h3>
          <p className="text-3xl font-black text-white">{formatWatchTime(stats.total_watch_time)}</p>
        </div>

        {/* Filmes Assistidos */}
        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-all">
          <div className="text-4xl mb-2">🎬</div>
          <h3 className="text-sm text-gray-400 uppercase font-bold mb-1">Filmes</h3>
          <p className="text-3xl font-black text-white">{stats.movies_watched}</p>
        </div>

        {/* Séries Assistidas */}
        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-all">
          <div className="text-4xl mb-2">📺</div>
          <h3 className="text-sm text-gray-400 uppercase font-bold mb-1">Séries</h3>
          <p className="text-3xl font-black text-white">{stats.series_watched}</p>
        </div>

        {/* Episódios Assistidos */}
        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-all">
          <div className="text-4xl mb-2">🎥</div>
          <h3 className="text-sm text-gray-400 uppercase font-bold mb-1">Episódios</h3>
          <p className="text-3xl font-black text-white">{stats.episodes_watched}</p>
        </div>
      </div>

      {/* Informações Adicionais */}
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
          <h3 className="text-sm text-gray-400 uppercase font-bold mb-2">Última Visualização</h3>
          <p className="text-xl font-bold text-white">{formatDate(stats.last_watch_date)}</p>
        </div>

        <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
          <h3 className="text-sm text-gray-400 uppercase font-bold mb-2">Gênero Favorito</h3>
          <p className="text-xl font-bold text-white">{stats.most_watched_genre || 'N/A'}</p>
        </div>
      </div>
    </section>
  )
}
