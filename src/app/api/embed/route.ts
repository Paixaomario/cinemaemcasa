export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { text } = await req.json()

    const response = await fetch(
      "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: text }),
      }
    )

    const data = await response.json()

    return Response.json({
      ok: true,
      debug: data
    })

  } catch (err: any) {
    return Response.json({
      ok: false,
      error: err.message
    }, { status: 500 })
  }
}
