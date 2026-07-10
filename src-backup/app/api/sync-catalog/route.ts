import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('[Sync Catalog] Iniciando sincronização do catálogo de busca...')

    const { data, error } = await supabase.rpc('sync_search_catalog')

    if (error) {
      console.error('[Sync Catalog] Erro ao sincronizar:', error)
      return NextResponse.json({ 
        ok: false, 
        error: error.message 
      }, { status: 500 })
    }

    console.log('[Sync Catalog] Sincronização concluída:', data)

    return NextResponse.json({ 
      ok: true, 
      data 
    })
  } catch (err: any) {
    console.error('[Sync Catalog] Erro:', err)
    return NextResponse.json({ 
      ok: false, 
      error: err.message 
    }, { status: 500 })
  }
}
