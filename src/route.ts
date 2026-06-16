import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { query, result_count, region } = await req.json()
    const supabase = createClient()

    if (!query) return NextResponse.json({ error: 'Query is required' }, { status: 400 })

    // Upsert anônimo no analytics
    const { error } = await supabase.rpc('track_search_analytics', {
      p_query: query.toLowerCase().trim(),
      p_result_count: result_count || 0,
      p_region: region || 'BR'
    })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Analytics API Error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  const supabase = createClient()
  const { data } = await supabase.from('search_analytics').select('*').order('count', { ascending: false }).limit(10)
  return NextResponse.json(data)
}