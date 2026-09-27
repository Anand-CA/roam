// Calls OpenRouter only after a user asks Roam to choose.
// Sends listing choices and estimated budgets, without device coordinates or account information.
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'openrouter/free'
const CATEGORIES = new Set(['Food', 'Cafe', 'Place', 'Event'])
const MAX_BODY_BYTES = 16_000

type Candidate = { id: string; category: string; title: string; detail: string; note?: string; budgetMinInr: number; budgetMaxInr: number }

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const expectedApiKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!expectedApiKey || request.headers.get('apikey') !== expectedApiKey) return json({ error: 'Unauthorized' }, 401)

  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')
  if (!openRouterKey) return json({ error: 'AI recommendations are not configured yet' }, 503)

  const contentLength = Number(request.headers.get('content-length'))
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return json({ error: 'Request body is too large' }, 413)
  }

  let body: Record<string, unknown>
  try {
    const value: unknown = await request.json()
    if (!isRecord(value)) return json({ error: 'Request body must be a JSON object' }, 400)
    body = value
  } catch {
    return json({ error: 'Request body must be valid JSON' }, 400)
  }
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 12) {
    return json({ error: 'Provide between 1 and 12 discovery choices' }, 400)
  }

  const items = body.items as Candidate[]
  const valid = items.every((item) => item && typeof item.id === 'string' && item.id.length > 0 && item.id.length <= 80 &&
    CATEGORIES.has(item.category) && typeof item.title === 'string' && item.title.length > 0 && item.title.length <= 120 &&
    typeof item.detail === 'string' && item.detail.length <= 180 &&
    (item.note === undefined || (typeof item.note === 'string' && item.note.length <= 180)) &&
    Number.isInteger(item.budgetMinInr) && item.budgetMinInr >= 0 &&
    Number.isInteger(item.budgetMaxInr) && item.budgetMaxInr >= item.budgetMinInr)
  if (!valid) return json({ error: 'Discovery choices have an invalid format' }, 400)

  let response: Response
  try {
    response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${openRouterKey}`, 'Content-Type': 'application/json', 'X-OpenRouter-Title': 'Roam' },
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        max_tokens: 140,
        messages: [
          { role: 'system', content: 'Choose exactly one nearby discovery from the supplied choices for someone who wants a pleasant surprise. Do not invent facts. Return only JSON with keys "id" and "reason". Keep reason under 18 words.' },
          { role: 'user', content: JSON.stringify(items.map(({ id, category, title, detail, note, budgetMinInr, budgetMaxInr }) => ({ id, category, title, detail, note, estimatedBudgetINR: [budgetMinInr, budgetMaxInr] }))) },
        ],
      }),
    })
  } catch (error) {
    console.error('OpenRouter recommendation request failed', error instanceof Error ? error.name : 'UnknownError')
    return json({ error: 'AI recommendation is temporarily unavailable' }, 502)
  }

  if (!response.ok) {
    console.error('OpenRouter recommendation failed with status', response.status)
    return json({ error: 'AI recommendation is temporarily unavailable' }, 502)
  }

  let result: unknown
  try {
    result = await response.json()
  } catch {
    return json({ error: 'AI returned an invalid response' }, 502)
  }
  const content = isRecord(result) && Array.isArray(result.choices) &&
    isRecord(result.choices[0]) && isRecord(result.choices[0].message)
    ? result.choices[0].message.content
    : undefined
  if (typeof content !== 'string') return json({ error: 'AI returned an invalid response' }, 502)

  const parsed = parseChoice(content)
  const selected = parsed ? items.find((item) => item.id === parsed.id) : undefined
  if (!selected) return json({ error: 'AI did not select a valid discovery' }, 502)

  return json({ itemId: selected.id, reason: parsed.reason.slice(0, 180) })
})

function parseChoice(content: string): { id: string; reason: string } | null {
  const cleaned = content.trim().replace(/^\x60{3}(?:json)?\s*/i, '').replace(/\s*\x60{3}$/, '')
  try {
    const value: unknown = JSON.parse(cleaned)
    if (isRecord(value) && typeof value.id === 'string' && typeof value.reason === 'string') {
      return { id: value.id, reason: value.reason }
    }
  } catch {
    return null
  }
  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
