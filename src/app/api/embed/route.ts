export async function POST(req: Request) {
  const { text } = await req.json()

  const vector = text
    .toLowerCase()
    .split("")
    .map(c => c.charCodeAt(0))
    .slice(0, 128)

  // normaliza para 1536 (pgvector size)
  while (vector.length < 1536) {
    vector.push(0)
  }

  return Response.json({
    ok: true,
    vector
  })
}
