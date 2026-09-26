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
  <p class="project-status" id="repo-status" aria-live="polite">Loading public repositories...</p>
  <section class="repo-grid" id="repo-grid" aria-label="Public GitHub repositories"></section>
</section>
<script>
  const grid = document.querySelector('#repo-grid');
  const status = document.querySelector('#repo-status');
  let repositories = [];
  const escapeText = value => String(value || '').replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]));
  function renderRepositories() {
    const query = document.querySelector('#repo-search').value.trim().toLowerCase();
    const matches = repositories.filter(repo => `${repo.name} ${repo.description || ''} ${repo.language || ''}`.toLowerCase().includes(query));
    grid.innerHTML = matches.map(repo => `<article class="repo-card"><div class="repo-card-head"><p class="eyebrow">PUBLIC REPOSITORY</p><span class="repo-language">${escapeText(repo.language || 'Repository')}</span></div><h2><a href="${escapeText(repo.html_url)}" target="_blank" rel="noopener noreferrer">${escapeText(repo.name)}</a></h2><p class="repo-description">${escapeText(repo.description || 'Public repository by Robby Aprianto.')}</p><div class="repo-card-footer"><span>Updated ${new Date(repo.updated_at).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}</span><a href="${escapeText(repo.html_url)}" target="_blank" rel="noopener noreferrer" aria-label="View ${escapeText(repo.name)} repository">View repository</a></div></article>`).join('');
    status.textContent = matches.length ? `${matches.length} public ${matches.length === 1 ? 'repository' : 'repositories'}` : repositories.length ? 'No repositories match this search.' : 'No public repositories found.';
    status.hidden = false;
  }
  document.querySelector('#repo-search').addEventListener('input', renderRepositories);
  fetch('https://api.github.com/users/{{ site.github_username }}/repos?per_page=100&sort=updated')
    .then(response => { if (!response.ok) throw new Error('Could not load public repositories.'); return response.json(); })
    .then(data => { repositories = data.filter(repo => !repo.private); renderRepositories(); })
    .catch(() => { status.textContent = 'Unable to load repositories. Open GitHub profile instead.'; });
</script>
