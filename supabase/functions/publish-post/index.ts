import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const cors = { 'Access-Control-Allow-Origin': Deno.env.get('ADMIN_ORIGIN') ?? '', 'Access-Control-Allow-Headers': 'authorization, content-type', 'Content-Type': 'application/json' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: cors })
const safeSlug = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
const yaml = (value: string) => JSON.stringify(value.replace(/[\r\n]/g, ' ').trim())

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { global: { headers: { Authorization: authorization } } })
  const { data: { user }, error: userError } = await supabase.auth.getUser(authorization.slice(7))
  if (userError || !user?.email) return json({ error: 'Unauthorized' }, 401)
  if (user.email.toLowerCase() !== Deno.env.get('ADMIN_EMAIL')?.toLowerCase()) return json({ error: 'Forbidden' }, 403)

  const input = await request.json().catch(() => null)
  const title = typeof input?.title === 'string' ? input.title.trim().slice(0, 200) : ''
  const slug = safeSlug(typeof input?.slug === 'string' ? input.slug : title)
  const content = typeof input?.content === 'string' ? input.content.slice(0, 200_000) : ''
  const action = input?.action === 'publish' ? 'publish' : 'draft'
  if (!title || !slug || !content) return json({ error: 'Title, slug, and content are required' }, 400)

  const now = new Date().toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' +0000')
  const path = `_posts/${now.slice(0, 10)}-${slug}.md`
  const markdown = `---\nlayout: post\ntitle: ${yaml(title)}\ndate: ${now}\ndescription: ${yaml(content.replace(/[#*_`]/g, '').slice(0, 160))}\ncategories: []\ntags: []\n---\n\n${content}\n`
  const { data: draft, error: draftError } = await supabase.from('drafts').upsert({ user_id: user.id, slug, title, content, status: action === 'publish' ? 'PUBLISHED' : 'DRAFT', github_path: action === 'publish' ? path : null, updated_at: new Date().toISOString() }, { onConflict: 'user_id,slug' }).select('id').single()
  if (draftError) return json({ error: 'Draft save failed' }, 500)
  if (action !== 'publish') return json({ message: 'Draft saved', draft_id: draft.id })

  const owner = Deno.env.get('REPO_OWNER')!, repo = Deno.env.get('REPO_NAME')!, branch = Deno.env.get('REPO_BRANCH') ?? 'main', token = Deno.env.get('GH_PAT')!
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Publish post: ${title}`, content: btoa(unescape(encodeURIComponent(markdown))), branch }) })
  if (!response.ok) return json({ error: 'GitHub publish failed. Draft retained for retry.' }, response.status === 409 ? 409 : 502)
  const result = await response.json()
  await supabase.from('drafts').update({ github_sha: result.content?.sha, published_at: new Date().toISOString() }).eq('id', draft.id).eq('user_id', user.id)
  await supabase.from('posts_metadata').upsert({ user_id: user.id, slug, title, excerpt: content.replace(/[#*_`]/g, '').slice(0, 160), status: 'PUBLISHED', github_path: path, github_sha: result.content?.sha, published_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'slug' })
  return json({ message: 'Published to GitHub', path, sha: result.content?.sha })
})
