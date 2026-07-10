import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  const { query } = await req.json()

  // 1. gerar vetor do texto
  const embedRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: query }),
  })

  const { vector } = await embedRes.json()

  // 2. buscar no Supabase (pgvector)
  const { data, error } = await supabase.rpc("match_content", {
    query_embedding: vector,
    match_threshold: 0,
    match_count: 10,
  })

  if (error) {
    return Response.json({ ok: false, error: error.message })
  }

  return Response.json({
    ok: true,
    results: data,
  })
}
