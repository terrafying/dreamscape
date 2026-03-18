import Anthropic from '@anthropic-ai/sdk'

export type LLMProvider = 'anthropic' | 'ollama'

export interface LLMOptions {
  provider?: LLMProvider
  model?: string
  maxTokens?: number
  json?: boolean // request JSON-mode output (Ollama format:'json', Anthropic via prompt)
}

// Lazy singleton so tests can mock the module before instantiation
let _client: Anthropic | null = null
function anthropicClient() {
  if (!_client) _client = new Anthropic()
  return _client
}

export async function callLLM(prompt: string, opts: LLMOptions = {}): Promise<string> {
  const { provider = 'anthropic', model, maxTokens = 2000, json = false } = opts

  if (provider === 'ollama') {
    const m = model || process.env.OLLAMA_MODEL || 'qwen2.5:32b'
    return callOllama(prompt, m, maxTokens, json)
  }

  const response = await anthropicClient().messages.create({
    model: model || 'claude-3-haiku-20240307',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })
  return response.content[0].type === 'text' ? response.content[0].text : ''
}

async function callOllama(
  prompt: string,
  model: string,
  maxTokens: number,
  json: boolean
): Promise<string> {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

  const body: Record<string, unknown> = {
    model,
    messages: [{ role: 'user', content: prompt }],
    stream: false,
    options: { num_predict: maxTokens },
  }
  if (json) body.format = 'json'

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(180_000), // 3 min — large models are slow on first run
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`Ollama error (${res.status}): ${err || 'is Ollama running? brew install ollama && ollama serve'}`)
  }

  const data = (await res.json()) as { message?: { content?: string } }
  return data.message?.content ?? ''
}
