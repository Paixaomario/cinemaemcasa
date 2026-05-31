export async function POST(req: Request) {
  const { text } = await req.json()

  const vector = text
    .toLowerCase()
    .split("")
    .map((c: string) => c.charCodeAt(0))
    .slice(0, 128)

  // completa até 1536 (pgvector)
  while (vector.length < 1536) {
    vector.push(0)
  }

  return Response.json({
    ok: true,
    vector
  })
}
