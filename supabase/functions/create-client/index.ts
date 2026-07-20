import { createClient } from 'npm:@supabase/supabase-js@2'

const allowedOrigin = 'https://modoturistagem.github.io'
const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders })

const normalizeUsername = (value: string) => value
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9._-]/g, '')
  .replace(/^[._-]+|[._-]+$/g, '')

const sixMonthsFrom = (source = new Date()) => {
  const result = new Date(source)
  const originalDay = result.getUTCDate()

  result.setUTCDate(1)
  result.setUTCMonth(result.getUTCMonth() + 6)

  const lastDay = new Date(Date.UTC(
    result.getUTCFullYear(),
    result.getUTCMonth() + 1,
    0,
  )).getUTCDate()

  result.setUTCDate(Math.min(originalDay, lastDay))
  result.setUTCHours(23, 59, 59, 999)
  return result
}

const readNamedKey = (raw: string | undefined, preferredName = 'default') => {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return parsed[preferredName] || Object.values(parsed)[0] || null
  } catch {
    return raw
  }
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ ok: false, error: 'Método não permitido.' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const publishableKey =
      Deno.env.get('SUPABASE_ANON_KEY') ||
      readNamedKey(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS'))
    const secretKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
      readNamedKey(Deno.env.get('SUPABASE_SECRET_KEYS'))

    if (!supabaseUrl || !publishableKey || !secretKey) {
      return json({ ok: false, error: 'As chaves do Supabase não estão disponíveis para a função.' }, 500)
    }

    const authorization = request.headers.get('Authorization')
    if (!authorization) return json({ ok: false, error: 'Sessão administrativa não encontrada.' }, 401)

    const userClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const adminClient = createClient(supabaseUrl, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) return json({ ok: false, error: 'Sessão inválida.' }, 401)

    const { data: adminProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('is_admin')
      .eq('id', userData.user.id)
      .single()

    if (profileError || !adminProfile?.is_admin) {
      return json({ ok: false, error: 'Somente a administradora pode criar acessos.' }, 403)
    }

    const payload = await request.json()
    const username = normalizeUsername(String(payload.username || ''))
    const password = String(payload.password || '')
    const fullName = String(payload.full_name || '').trim()
    const itinerarySlug = String(payload.itinerary_slug || '').trim()
    const accessExpiresAt = sixMonthsFrom().toISOString()

    if (username.length < 3 || username.length > 32) {
      return json({ ok: false, error: 'O usuário deve ter entre 3 e 32 caracteres.' }, 400)
    }
    if (password.length < 8) {
      return json({ ok: false, error: 'A senha deve ter pelo menos 8 caracteres.' }, 400)
    }
    if (!fullName) return json({ ok: false, error: 'Informe o nome do cliente.' }, 400)
    if (!itinerarySlug) return json({ ok: false, error: 'Escolha um roteiro.' }, 400)

    const { data: itinerary, error: itineraryError } = await adminClient
      .from('itineraries')
      .select('id,title')
      .eq('slug', itinerarySlug)
      .eq('status', 'published')
      .single()

    if (itineraryError || !itinerary) {
      return json({ ok: false, error: 'O roteiro publicado não foi encontrado.' }, 404)
    }

    const internalEmail = `${username}@clientes.modoturistagem.local`

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email: internalEmail,
      password,
      email_confirm: true,
      user_metadata: { username, full_name: fullName },
    })

    if (createError || !created.user) {
      const duplicate = createError?.message?.toLowerCase().includes('already')
      return json({
        ok: false,
        error: duplicate ? 'Esse nome de usuário já existe.' : (createError?.message || 'Não consegui criar o usuário.'),
      }, 400)
    }

    const userId = created.user.id

    const { error: profileUpsertError } = await adminClient.from('profiles').upsert({
      id: userId,
      email: internalEmail,
      username,
      full_name: fullName,
      is_admin: false,
    }, { onConflict: 'id' })

    if (profileUpsertError) {
      await adminClient.auth.admin.deleteUser(userId)
      return json({ ok: false, error: 'Não consegui salvar o perfil do cliente.' }, 500)
    }

    const { error: accessError } = await adminClient.from('itinerary_access').insert({
      user_id: userId,
      itinerary_id: itinerary.id,
      access_expires_at: accessExpiresAt,
    })

    if (accessError) {
      await adminClient.auth.admin.deleteUser(userId)
      return json({ ok: false, error: 'Não consegui liberar o roteiro para o cliente.' }, 500)
    }

    return json({
      ok: true,
      username,
      full_name: fullName,
      itinerary_title: itinerary.title,
      access_expires_at: accessExpiresAt,
    })
  } catch (error) {
    console.error(error)
    return json({ ok: false, error: 'Erro inesperado ao criar o acesso.' }, 500)
  }
})
