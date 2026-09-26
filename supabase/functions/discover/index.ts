// Public curated discovery endpoint. Keep provider keys in Supabase secrets;
// never add them to browser environment variables.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const apiKey = request.headers.get('apikey')
  const expectedApiKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!apiKey || !expectedApiKey || apiKey !== expectedApiKey) return json({ error: 'Unauthorized' }, 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  if (!supabaseUrl || !expectedApiKey) return json({ error: 'Server configuration is incomplete' }, 500)

  let input: { latitude?: unknown; longitude?: unknown; radiusMeters?: unknown; category?: unknown }
  try {
    input = await request.json()
  } catch {
    return json({ error: 'Request body must be valid JSON' }, 400)
  }

  const { latitude, longitude } = input
  const radiusMeters = typeof input.radiusMeters === 'number' ? Math.floor(input.radiusMeters) : 5000
  const categories = ['Food', 'Cafe', 'Place', 'Event']
  const category = typeof input.category === 'string' && categories.includes(input.category) ? input.category : null
  if (typeof latitude !== 'number' || latitude < -90 || latitude > 90 || typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
    return json({ error: 'Valid latitude and longitude are required' }, 400)
  }

  const supabase = createClient(supabaseUrl, expectedApiKey)
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

  return json({ items: data ?? [], origin: { latitude, longitude }, radiusMeters })
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
