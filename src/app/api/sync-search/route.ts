import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase.rpc('sync_search_catalog')

  if (error) {
    return Response.json({ ok: false, error: error.message })
  }

  return Response.json({ ok: true })
}
