'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function SearchAnalyticsAdmin() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      const sb = createClient()
      const { data: res } = await sb
        .from('search_analytics')
        .select('*')
        .order('count', { ascending: false })
        .limit(20)
      
      if (res) setData(res)
      setLoading(false)
    }
    fetchAnalytics()
  }, [])

  if (loading) return <div className="p-8 text-white">Carregando Analytics...</div>

  return (
    <div className="p-8 bg-black min-h-screen text-white pt-32">
      <h1 className="text-3xl font-black uppercase tracking-tighter mb-8 border-l-4 border-brand-cyan pl-4">
        Search Analytics Dashboard
      </h1>
      
      <div className="bg-neutral-900 rounded-3xl overflow-hidden border border-white/5">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-neutral-400 uppercase text-xs font-bold">
            <tr>
              <th className="p-4">Termo de Busca</th>
              <th className="p-4 text-center">Volume</th>
              <th className="p-4 text-center">Média Resultados</th>
              <th className="p-4">Região</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 font-bold">{row.query}</td>
                <td className="p-4 text-center text-brand-cyan font-black">{row.count}</td>
                <td className="p-4 text-center">{row.result_count}</td>
                <td className="p-4 text-neutral-400">{row.region}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}