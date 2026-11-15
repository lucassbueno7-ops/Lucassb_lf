// Supabase Edge Function (Deno): generates an invite (or password recovery) link for a client.
// No email is sent (there is no SMTP): the trainer shares the returned link.
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

  // Caller must be a trainer or an admin.
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single()
  if (profileError || (profile?.role !== 'trainer' && profile?.role !== 'admin')) {
    return json({ error: 'Forbidden' }, 403)
  }
  const isAdmin = profile.role === 'admin'

  let payload: { email?: string; full_name?: string; trainer_id?: string }
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }
  const email = payload.email?.trim().toLowerCase()
  const fullName = payload.full_name?.trim() ?? ''
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Email inválido' }, 400)
  }

  // Trainers invite for themselves; admins must name an existing trainer.
  let trainerId = caller.id
  if (isAdmin) {
    const requested = payload.trainer_id?.trim()
    if (!requested) return json({ error: 'Elegí un entrenador' }, 400)
    const { data: trainer } = await admin.from('profiles').select('role').eq('id', requested).maybeSingle()
    if (trainer?.role !== 'trainer') return json({ error: 'El entrenador elegido no existe' }, 400)
    trainerId = requested
  }

  const redirectTo = `${siteUrl}/set-password`

  const invite = await admin.auth.admin.generateLink({
    type: 'invite',
    email,
    options: { data: { full_name: fullName, trainer_id: trainerId }, redirectTo },
  })
  if (!invite.error && invite.data?.properties?.action_link) {
    return json({ link: invite.data.properties.action_link, email, existing: false })
  }

  const alreadyRegistered =
    invite.error?.status === 422 ||
    (invite.error as { code?: string } | null)?.code === 'email_exists' ||
    /already (been )?registered/i.test(invite.error?.message ?? '')
  if (!alreadyRegistered) {
    console.error('generateLink invite failed', invite.error?.message)
    return json({ error: 'No se pudo generar la invitación' }, 400)
  }

  // Existing user: issue a recovery link so access can be re-sent, but only for the
  // trainer's own client (or any client when the caller is an admin).
  const recovery = await admin.auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo } })
  const existingUserId = recovery.data?.user?.id
  if (recovery.error || !existingUserId || !recovery.data?.properties?.action_link) {
    console.error('generateLink recovery failed', recovery.error?.message)
    return json({ error: 'No se pudo generar el link' }, 400)
  }
  if (!isAdmin) {
    // Trainers may only re-send access to their own *clients*. Staff (admins, trainers)
    // can also have trainer_id set when they train with someone, and a trainer must
    // never obtain a password-reset link for a staff account.
    const { data: existing } = await admin
      .from('profiles')
      .select('role, trainer_id')
      .eq('id', existingUserId)
      .maybeSingle()
    if (existing?.role !== 'client' || existing?.trainer_id !== caller.id) {
      return json({ error: 'Ese email ya está registrado con otro entrenador' }, 409)
    }
  }
  return json({ link: recovery.data.properties.action_link, email, existing: true })
})
