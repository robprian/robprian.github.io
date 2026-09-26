import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

// CMS gallery proxy for tDocs object storage.
//
// Why a proxy: the tDocs API token must never ship in public admin.js.
// This function verifies the Supabase session, checks admin_profiles,
// then calls tDocs with the server-only TDOCS_API_TOKEN and returns a
// sanitized image list. Returned stream_url values are permanent
// /cdn/{id}/stream URLs (never expired), safe to store as blog covers.

const allowedOrigins = (Deno.env.get('ADMIN_ORIGINS') ?? Deno.env.get('ADMIN_ORIGIN') ?? '').split(',').map(value => value.trim()).filter(Boolean)
const baseHeaders = { 'Access-Control-Allow-Headers': 'authorization, content-type', 'Content-Type': 'application/json' }
const headersFor = (request: Request) => {
  const origin = request.headers.get('Origin') ?? ''
  return { ...baseHeaders, 'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : (allowedOrigins[0] ?? '') }
}
const response = (request: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: headersFor(request) })

type GalleryFile = { id: string; name: string; size: number; mime_type: string; stream_url: string }

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: headersFor(request) })
  if (request.method !== 'GET') return response(request, { error: 'Method not allowed' }, 405)
  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return response(request, { error: 'Unauthorized' }, 401)
  const token = authorization.slice(7)
  const db = createClient(Deno.env.get('PROJECT_URL')!, Deno.env.get('SERVICE_ROLE_KEY')!)
  const { data: { user }, error: userError } = await db.auth.getUser(token)
  if (userError || !user) return response(request, { error: 'Unauthorized' }, 401)
  const { data: admin } = await db.from('admin_profiles').select('user_id').eq('user_id', user.id).maybeSingle()
  if (!admin) return response(request, { error: 'Forbidden' }, 403)

  const baseUrl = (Deno.env.get('TDOCS_BASE_URL') ?? '').replace(/\/+$/, '')
  const apiToken = Deno.env.get('TDOCS_API_TOKEN') ?? ''
  if (!baseUrl || !apiToken) {
    return response(request, { error: 'Gallery is not configured. Set TDOCS_BASE_URL and TDOCS_API_TOKEN secrets for the tdocs-gallery function.' }, 503)
  }

  const params = new URL(request.url).searchParams
  const search = (params.get('search') ?? '').slice(0, 80)
  const limit = Math.min(100, Math.max(1, Number.parseInt(params.get('limit') ?? '60', 10) || 60))

  const upstream = `${baseUrl}/api/cdn/files?mime=image/&limit=${limit}&search=${encodeURIComponent(search)}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 25000)
  let upstreamResponse: Response
  try {
    upstreamResponse = await fetch(upstream, { signal: controller.signal, headers: { Authorization: `Bearer ${apiToken}` } })
  } catch {
    return response(request, { error: 'Gallery is unreachable. Check TDOCS_BASE_URL and try again.' }, 502)
  } finally {
    clearTimeout(timer)
  }
  if (upstreamResponse.status === 401) return response(request, { error: 'Gallery rejected its API token. Rotate TDOCS_API_TOKEN.' }, 502)
  if (!upstreamResponse.ok) return response(request, { error: `Gallery request failed (HTTP ${upstreamResponse.status}).` }, 502)

  let payload: { files?: Array<Record<string, unknown>>; total?: number }
  try {
    payload = await upstreamResponse.json()
  } catch {
    return response(request, { error: 'Gallery returned an unreadable response.' }, 502)
  }
  const files: GalleryFile[] = Array.isArray(payload.files)
    ? payload.files
      .filter(file => typeof file?.id === 'string' && typeof file?.stream_url === 'string')
      .map(file => ({
        id: String(file.id),
        name: typeof file.name === 'string' ? String(file.name).slice(0, 200) : String(file.id),
        size: typeof file.size === 'number' ? file.size : 0,
        mime_type: typeof file.mime_type === 'string' ? String(file.mime_type) : 'image/*',
        stream_url: String(file.stream_url),
      }))
    : []
  return response(request, { files, total: typeof payload.total === 'number' ? payload.total : files.length })
})
