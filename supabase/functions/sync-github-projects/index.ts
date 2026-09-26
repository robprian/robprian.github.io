import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const allowedOrigin = Deno.env.get('ADMIN_ORIGIN') ?? ''
const headers = { 'Access-Control-Allow-Origin': allowedOrigin, 'Access-Control-Allow-Headers': 'authorization, content-type', 'Content-Type': 'application/json' }
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers })

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers })
  if (request.method !== 'POST') return respond({ error:'Method not allowed' },405)
  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return respond({ error:'Unauthorized' },401)
  const db=createClient(Deno.env.get('PROJECT_URL')!,Deno.env.get('SERVICE_ROLE_KEY')!)
  const { data:{user},error } = await db.auth.getUser(authorization.slice(7))
  if (error || !user) return respond({ error:'Unauthorized' },401)
  const { data:admin } = await db.from('admin_profiles').select('user_id').eq('user_id',user.id).maybeSingle()
  if (!admin) return respond({ error:'Forbidden' },403)
  const token = Deno.env.get('GH_PAT')
  if (!token) return respond({ error:'GitHub sync is not configured' },503)
  const repos: Array<Record<string,unknown>> = []
  for (let page=1;page<=10;page++) {
    const response=await fetch(`https://api.github.com/user/repos?per_page=100&page=${page}&visibility=all&affiliation=owner&sort=updated`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}})
    if (!response.ok) return respond({error:'Unable to synchronize repositories'},502)
    const batch=await response.json()
    repos.push(...batch)
    if (batch.length<100) break
  }
  const rows=repos.map(repo=>({github_repo_id:repo.id,source_key:`github:${repo.id}`,name:repo.name,description:repo.description, is_private:repo.private,public_url:repo.private?null:repo.html_url,homepage:repo.private?null:repo.homepage,language:repo.language,topics:repo.topics||[],is_fork:repo.fork,is_archived:repo.archived,stars:repo.stargazers_count,default_branch:repo.default_branch,github_created_at:repo.created_at,github_updated_at:repo.updated_at,is_public:true,updated_at:new Date().toISOString()}))
  for(let offset=0;offset<rows.length;offset+=100){const {error:upsertError}=await db.from('projects').upsert(rows.slice(offset,offset+100),{onConflict:'github_repo_id'});if(upsertError)return respond({error:'Repository sync failed; previous data may be partially refreshed'},500)}
  return respond({total:rows.length,public:rows.filter(row=>!row.is_private).length,private:rows.filter(row=>row.is_private).length,synced:rows.length,failed:0})
})
