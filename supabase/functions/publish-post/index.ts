import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const allowedOrigins = (Deno.env.get('ADMIN_ORIGINS') ?? Deno.env.get('ADMIN_ORIGIN') ?? '').split(',').map(value => value.trim()).filter(Boolean)
const baseHeaders = { 'Access-Control-Allow-Headers': 'authorization, content-type', 'Content-Type': 'application/json' }
const headersFor = (request: Request) => {
  const origin = request.headers.get('Origin') ?? ''
  return { ...baseHeaders, 'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : (allowedOrigins[0] ?? '') }
}
const response = (request: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: headersFor(request) })
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80)
const yaml = (value: string) => JSON.stringify(value.replace(/[\r\n]/g,' ').trim())

Deno.serve(async request => {
  if(request.method==='OPTIONS') return new Response('ok',{headers:headersFor(request)})
  if(request.method!=='POST') return response(request, {error:'Method not allowed'},405)
  const authorization=request.headers.get('Authorization')
  if(!authorization?.startsWith('Bearer ')) return response(request, {error:'Unauthorized'},401)
  const token=authorization.slice(7)
  const db=createClient(Deno.env.get('PROJECT_URL')!,Deno.env.get('SERVICE_ROLE_KEY')!)
  const {data:{user},error:userError}=await db.auth.getUser(token)
  if(userError||!user) return response(request, {error:'Unauthorized'},401)
  const {data:admin}=await db.from('admin_profiles').select('user_id').eq('user_id',user.id).maybeSingle()
  if(!admin) return response(request, {error:'Forbidden'},403)
  let input:Record<string,unknown>
  try { input=await request.json() } catch { return response(request, {error:'Invalid request'},400) }
  const title=typeof input.title==='string'?input.title.trim().slice(0,200):''
  const slug=slugify(typeof input.slug==='string'?input.slug:title)
  const content=typeof input.content==='string'?input.content:''
  const description=typeof input.description==='string'?input.description.trim().slice(0,300):''
  const rawCover=typeof input.coverImage==='string'?input.coverImage.trim().slice(0,500):''
  const coverImage=/^(https?:\/\/|\/)/.test(rawCover)?rawCover:''
  if(!title||!slug||!content||content.length>200000) return response(request, {error:'Title, slug, and content are required; content limit is 200 KB'},400)
  const {data:existing}=await db.from('drafts').select('github_path,github_sha').eq('user_id',user.id).eq('slug',slug).maybeSingle()
  const now=new Date()
  const date=now.toISOString().replace('T',' ').replace(/\.\d{3}Z$/,' +0000')
  const path=existing?.github_path||`_posts/${date.slice(0,10)}-${slug}.md`
  const summary=description||content.replace(/[#*_`]/g,' ').replace(/\s+/g,' ').trim().slice(0,180)
  const markdown=`---\nlayout: post\ntitle: ${yaml(title)}\ndate: ${date}\ndescription: ${yaml(summary)}\n${coverImage?`image: ${yaml(coverImage)}\n`:''}categories: []\ntags: []\n---\n\n${content}\n`
  const draftPayload={user_id:user.id,slug,title,description:summary,content,status:'DRAFT',github_path:existing?.github_path||null,github_sha:existing?.github_sha||null,updated_at:now.toISOString()}
  const {data:draft,error:draftError}=await db.from('drafts').upsert(draftPayload,{onConflict:'user_id,slug'}).select('id').single()
  if(draftError) return response(request, {error:'Draft save failed'},500)
  const owner=Deno.env.get('REPO_OWNER')!,repo=Deno.env.get('REPO_NAME')!,branch=Deno.env.get('REPO_BRANCH')||'main',githubToken=Deno.env.get('GH_PAT')
  if(!githubToken) return response(request, {error:'Publishing is not configured. Draft retained.'},503)
  let sha=existing?.github_sha
  if(existing?.github_path&&!sha){const getFile=await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`,{headers:{Authorization:`Bearer ${githubToken}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}});if(getFile.ok){const file=await getFile.json();sha=file.sha}else if(getFile.status!==404)return response(request, {error:'Unable to check existing article. Draft retained.'},502)}
  const body={message:`Publish post: ${title}`,content:btoa(unescape(encodeURIComponent(markdown))),branch,...(sha?{sha}:{})}
  const write=await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`,{method:'PUT',headers:{Authorization:`Bearer ${githubToken}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},body:JSON.stringify(body)})
  if(!write.ok) return response(request, {error:write.status===409||write.status===422?'GitHub file changed concurrently. Draft retained; retry publish.':'GitHub publishing failed. Draft retained.'},write.status===409||write.status===422?409:502)
  const result=await write.json()
  const metadata={user_id:user.id,slug,title,excerpt:summary,status:'PUBLISHED',github_path:path,github_sha:result.content?.sha||null,content,cover_image:coverImage||null,published_at:now.toISOString(),updated_at:now.toISOString()}
  const {error:metaError}=await db.from('posts_metadata').upsert(metadata,{onConflict:'slug'})
  if(metaError) return response(request, {error:'Article committed but metadata sync failed. Retry sync.'},502)
  await db.from('drafts').update({...draftPayload,status:'PUBLISHED',github_path:path,github_sha:result.content?.sha||null,published_at:now.toISOString()}).eq('id',draft.id).eq('user_id',user.id)
  return response(request, {message:'Published to GitHub Pages',path,sha:result.content?.sha||null})
})
