// Supabase Edge Function (Deno): lets a trainer invite a client by email.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const siteUrl = (Deno.env.get('SITE_URL') ?? '').replace(/\/$/, '')
  if (!siteUrl) return json({ error: 'SITE_URL secret is not configured' }, 500)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)

  // Verify the caller's JWT.
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) return json({ error: 'Invalid token' }, 401)
  const caller = userData.user

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Caller must be a trainer.
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single()
  if (profileError || profile?.role !== 'trainer') return json({ error: 'Forbidden' }, 403)

  let payload: { email?: string; full_name?: string }
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }
  const email = payload.email?.trim().toLowerCase()
  const fullName = payload.full_name?.trim() ?? ''
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Invalid email' }, 400)
  }

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName, trainer_id: caller.id },
    redirectTo: `${siteUrl}/set-password`,
  })
  if (error) return json({ error: error.message }, 400)

  return json({ user_id: data.user?.id ?? null })
})
