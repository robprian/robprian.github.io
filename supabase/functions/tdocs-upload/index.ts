import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

// CMS upload proxy: stores blog images in tDocs so every cover and inline
// image is a permanent /cdn/{id}/stream URL (never expired). The tDocs API
// token stays server-only; the browser only talks to this function with its
// Supabase admin session.
//
// Flow: multipart {file} -> tDocs init -> 5 MB chunks -> complete -> url.

const allowedOrigins = (Deno.env.get('ADMIN_ORIGINS') ?? Deno.env.get('ADMIN_ORIGIN') ?? '').split(',').map(value => value.trim()).filter(Boolean)
const baseHeaders = { 'Access-Control-Allow-Headers': 'authorization, content-type', 'Content-Type': 'application/json' }
const headersFor = (request: Request) => {
  const origin = request.headers.get('Origin') ?? ''
  return { ...baseHeaders, 'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : (allowedOrigins[0] ?? '') }
}
const response = (request: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: headersFor(request) })

const CLIENT_CHUNK = 5 * 1024 * 1024
const MAX_IMAGE = 5 * 1024 * 1024
const CALL_TIMEOUT_MS = 120000

async function tdocsCall(apiToken: string, path: string, init: RequestInit, label: string): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS)
  try {
    return await fetch(path, { ...init, signal: controller.signal, headers: { ...(init.headers as Record<string, string> | undefined), Authorization: `Bearer ${apiToken}` } })
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') throw new Error(`${label} timed out. Try a smaller image.`)
    throw new Error(`${label} unreachable. Check TDOCS_BASE_URL and try again.`)
  } finally {
    clearTimeout(timer)
  }
}

const cleanName = (raw: string) => {
  const base = (raw.split('/').pop() || 'image.png').trim().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').slice(0, 100) || 'image.png'
  return `${Date.now()}-${base}`
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: headersFor(request) })
  if (request.method !== 'POST') return response(request, { error: 'Method not allowed' }, 405)
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
    return response(request, { error: 'Uploads are not configured. Set TDOCS_BASE_URL and TDOCS_API_TOKEN secrets for the tdocs-upload function.' }, 503)
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return response(request, { error: 'Upload must be multipart form data with a file field.' }, 400)
  }
  const entry = form.get('file')
  if (!(entry instanceof File)) return response(request, { error: 'Choose an image file first.' }, 400)
  if (!entry.type || !entry.type.startsWith('image/')) return response(request, { error: 'Only image files are allowed.' }, 400)
  if (entry.size <= 0 || entry.size > MAX_IMAGE) return response(request, { error: 'Image must be larger than 0 bytes and 5 MB or smaller.' }, 400)

  const name = cleanName(entry.name)
  let sessionId = ''
  try {
    const initRes = await tdocsCall(apiToken, `${baseUrl}/api/upload/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, size: entry.size, mime_type: entry.type }),
    }, 'Upload start')
    const initData = await initRes.json().catch(() => ({}))
    sessionId = typeof initData?.session_id === 'string' ? initData.session_id : (typeof initData?.id === 'string' ? initData.id : '')
    if (!initRes.ok || !sessionId) throw new Error('tDocs refused the upload session.')
  } catch (error) {
    return response(request, { error: (error as Error)?.message || 'Upload start failed.' }, 502)
  }

  try {
    const bytes = new Uint8Array(await entry.arrayBuffer())
    const totalChunks = Math.max(1, Math.ceil(bytes.length / CLIENT_CHUNK))
    for (let index = 0; index < totalChunks; index++) {
      const slice = bytes.slice(index * CLIENT_CHUNK, (index + 1) * CLIENT_CHUNK)
      const chunkForm = new FormData()
      chunkForm.set('session_id', sessionId)
      chunkForm.set('chunk_index', String(index))
      chunkForm.set('chunk', new Blob([slice as unknown as BlobPart], { type: entry.type }), name)
      const chunkRes = await tdocsCall(apiToken, `${baseUrl}/api/upload/chunk`, { method: 'POST', body: chunkForm }, `Upload part ${index + 1}/${totalChunks}`)
      if (!chunkRes.ok) {
        const detail = (await chunkRes.text().catch(() => '')).slice(0, 200)
        throw new Error(detail || `tDocs refused chunk ${index}.`)
      }
    }
    const doneRes = await tdocsCall(apiToken, `${baseUrl}/api/upload/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    }, 'Upload finish')
    const record = await doneRes.json().catch(() => ({}))
    if (!doneRes.ok || typeof record?.id !== 'string') {
      const detail = typeof record === 'object' && record !== null ? '' : String(record).slice(0, 200)
      throw new Error(detail || 'tDocs could not finish the upload.')
    }
    return response(request, { url: `${baseUrl}/cdn/${record.id}/stream`, id: record.id, name: record.name || name, size: record.size || entry.size })
  } catch (error) {
    return response(request, { error: (error as Error)?.message || 'Upload failed.' }, 502)
  }
})
