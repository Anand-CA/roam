// Uses OpenRouter's free-model router only after a user asks Roam to choose.
// Listing data is sent without device coordinates or account information.
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'openrouter/free'
const CATEGORIES = new Set(['Food', 'Cafe', 'Place', 'Event'])

type Candidate = { id: string; category: string; title: string; detail: string; note?: string; budgetMinInr: number; budgetMaxInr: number }

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return json({ ok: true })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const expectedApiKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!expectedApiKey || request.headers.get('apikey') !== expectedApiKey) return json({ error: 'Unauthorized' }, 401)

  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')
  if (!openRouterKey) return json({ error: 'AI recommendations are not configured yet' }, 503)

  let body: { items?: unknown }
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Request body must be valid JSON' }, 400)
  }
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 12) {
    return json({ error: 'Provide between 1 and 12 discovery choices' }, 400)
  }

  const items = body.items as Candidate[]
  const valid = items.every((item) => item && typeof item.id === 'string' && item.id.length <= 80 &&
    typeof item.title === 'string' && item.title.length <= 120 && typeof item.detail === 'string' && item.detail.length <= 180 &&
    CATEGORIES.has(item.category) && Number.isInteger(item.budgetMinInr) && item.budgetMinInr >= 0 &&
    Number.isInteger(item.budgetMaxInr) && item.budgetMaxInr >= item.budgetMinInr)
  if (!valid) return json({ error: 'Discovery choices have an invalid format' }, 400)

  const response = await fetch(OPENROUTER_URL, {
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

  if (!response.ok) {
    console.error('OpenRouter recommendation failed with status', response.status)
    return json({ error: 'AI recommendation is temporarily unavailable' }, 502)
  }

  const result = await response.json()
  const content = result?.choices?.[0]?.message?.content
  if (typeof content !== 'string') return json({ error: 'AI returned an invalid response' }, 502)

  const parsed = parseChoice(content)
  const selected = parsed ? items.find((item) => item.id === parsed.id) : undefined
  if (!selected) return json({ error: 'AI did not select a valid discovery' }, 502)

  return json({ itemId: selected.id, reason: parsed.reason.slice(0, 180) })
})

function parseChoice(content: string): { id: string; reason: string } | null {
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  try {
    const value = JSON.parse(cleaned)
    if (typeof value.id === 'string' && typeof value.reason === 'string') return value
  } catch {
    return null
  }
  return null
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
