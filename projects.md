---
layout: default
title: Projects
description: Public repositories and project work by Robby Aprianto.
permalink: /projects/
---
<section class="projects-page">
  <header class="projects-intro">
    <p class="eyebrow">SELECTED WORK</p>
    <h1>Projects</h1>
    <p>Public repositories and experiments from my engineering work.</p>
    <a class="text-link" href="https://github.com/{{ site.github_username }}" rel="noopener noreferrer">Browse GitHub profile</a>
  </header>
  <div class="projects-toolbar"><label for="repo-search">Find a project</label><input id="repo-search" type="search" placeholder="Search repositories" aria-describedby="repo-status"></div>
  <div class="projects-filters" role="group" aria-label="Filter by visibility"><button type="button" class="is-active" data-visibility="all">All</button><button type="button" data-visibility="public">Public</button><button type="button" data-visibility="private">Private</button></div>
  <p class="project-status" id="repo-status" aria-live="polite">Loading repositories...</p>
  <section class="repo-grid" id="repo-grid" aria-label="GitHub repositories"></section>
</section>
<script>
  const grid=document.querySelector('#repo-grid');const status=document.querySelector('#repo-status');let projects=[];
  const esc=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function render(){const query=document.querySelector('#repo-search').value.trim().toLowerCase();const filter=document.querySelector('[data-visibility].is-active').dataset.visibility;const rows=projects.filter(p=>(filter==='all'||(filter==='private')===p.is_private)&&`${p.name} ${p.description||''} ${p.language||''}`.toLowerCase().includes(query));grid.innerHTML=rows.map(p=>`<article class="repo-card ${p.is_private?'repo-private':''}"><div class="repo-card-head"><p class="eyebrow">${p.is_private?'PRIVATE REPOSITORY':'PUBLIC REPOSITORY'}</p><span class="repo-language">${esc(p.language||'Repository')}</span></div><h2>${p.is_private?`<span class="private-project-title"><span aria-hidden="true">🔒</span>${esc(p.name)}</span>`:`<a href="${esc(p.public_url)}" target="_blank" rel="noopener noreferrer">${esc(p.name)}</a>`}</h2><p class="repo-description">${esc(p.description||'')}</p><div class="repo-card-footer"><span>${p.is_private?'Private':'Public'}</span>${p.is_private?'':`<a href="${esc(p.public_url)}" target="_blank" rel="noopener noreferrer">View repository</a>`}</div></article>`).join('');status.textContent=rows.length?`${rows.length} repositories`:'No matching repositories.';}
  document.querySelector('#repo-search').addEventListener('input',render);document.querySelectorAll('[data-visibility]').forEach(button=>button.onclick=()=>{document.querySelectorAll('[data-visibility]').forEach(item=>item.classList.remove('is-active'));button.classList.add('is-active');render();});
  fetch('{{ site.supabase_url }}/rest/v1/public_projects?select=id,name,description,is_private,public_url,language,github_updated_at&order=github_updated_at.desc',{headers:{apikey:'{{ site.supabase_anon_key }}',Authorization:'Bearer {{ site.supabase_anon_key }}'}}).then(response=>{if(!response.ok)throw new Error();return response.json();}).then(data=>{projects=data;render();}).catch(()=>{status.textContent='Unable to load repositories. Please retry.';});
</script>
