
interface OllamaModel {
  name: string
  size: number
  modified_at: string
}

export async function GET() {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) throw new Error(`${res.status}`)
    const data = (await res.json()) as { models?: OllamaModel[] }
    const models = (data.models ?? []).map((m) => ({
      name: m.name,
      sizeGB: +(m.size / 1e9).toFixed(1),
    }))
    return Response.json({ models, running: true })
  } catch {
    return Response.json({ models: [], running: false })
  }
}
