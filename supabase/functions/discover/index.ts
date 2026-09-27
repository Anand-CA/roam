// Public curated discovery endpoint. Keep provider keys in Supabase secrets;
// never add them to browser environment variables.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CATEGORIES = new Set(['Food', 'Cafe', 'Place', 'Event'])

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const apiKey = request.headers.get('apikey')
  const expectedApiKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!apiKey || !expectedApiKey || apiKey !== expectedApiKey) return json({ error: 'Unauthorized' }, 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  if (!supabaseUrl || !expectedApiKey) return json({ error: 'Server configuration is incomplete' }, 500)

  let input: Record<string, unknown>
  try {
    const body: unknown = await request.json()
    if (!isRecord(body)) return json({ error: 'Request body must be a JSON object' }, 400)
    input = body
  } catch {
    return json({ error: 'Request body must be valid JSON' }, 400)
  }

  const { latitude, longitude } = input
  if (typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return json({ error: 'Valid latitude and longitude are required' }, 400)
  }

  const radiusInput = input.radiusMeters
  if (radiusInput !== undefined && (typeof radiusInput !== 'number' || !Number.isFinite(radiusInput))) {
    return json({ error: 'radiusMeters must be a number' }, 400)
  }
  const radiusMeters = typeof radiusInput === 'number' ? Math.floor(radiusInput) : 5000

  const categoryInput = input.category
  if (categoryInput !== undefined && categoryInput !== null &&
      (typeof categoryInput !== 'string' || !CATEGORIES.has(categoryInput))) {
    return json({ error: 'category must be Food, Cafe, Place, or Event' }, 400)
  }
  const category = typeof categoryInput === 'string' ? categoryInput : null

  const supabase = createClient(supabaseUrl, expectedApiKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await supabase.rpc('nearby_discoveries', {
    user_latitude: latitude,
    user_longitude: longitude,
    radius_meters: Math.min(Math.max(radiusMeters, 100), 25000),
    category_filter: category,
    result_limit: 20,
  })
  if (error) {
    console.error('nearby_discoveries failed', error.message)
    return json({ error: 'Could not load nearby discoveries' }, 500)
  }

  return json({ items: data ?? [], origin: { latitude, longitude }, radiusMeters: Math.min(Math.max(radiusMeters, 100), 25000) })
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
