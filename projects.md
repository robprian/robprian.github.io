---
layout: default
title: Projects
description: Selected infrastructure and engineering work by Robby Aprianto.
permalink: /projects/
---
<section class="page-intro"><p class="eyebrow">PROJECTS</p><h1>Public repositories.</h1><p>Live list of public repositories from <a class="text-link" href="https://github.com/{{ site.github_username }}">github.com/{{ site.github_username }}</a>.</p></section>
<section class="project-list" aria-label="Public repositories"><p class="empty-state" id="project-status" aria-live="polite">Loading public repositories...</p><div class="repo-grid" id="repo-grid"></div></section>
<script>
  const repoGrid = document.querySelector('#repo-grid'); const repoStatus = document.querySelector('#project-status');
  fetch('https://api.github.com/users/{{ site.github_username }}/repos?per_page=100&sort=updated')
    .then(response => { if (!response.ok) throw new Error('GitHub repository list unavailable'); return response.json(); })
    .then(repositories => { repoStatus.hidden = true; repoGrid.innerHTML = repositories.filter(repo => !repo.private).map(repo => `<article class="project-card"><div><p class="eyebrow">PUBLIC REPOSITORY</p><h2>${escapeHtml(repo.name)}</h2><p>${escapeHtml(repo.description || 'Public repository by Robby Aprianto.')}</p><p class="post-meta">${escapeHtml(repo.language || 'Repository')}</p></div><a class="text-link" href="${repo.html_url}" rel="noopener">View repository</a></article>`).join(''); if (!repositories.length) { repoStatus.hidden = false; repoStatus.textContent = 'No public repositories found.'; } })
    .catch(() => { repoStatus.hidden = false; repoStatus.textContent = 'Could not load repositories. Open GitHub profile instead.'; });
  function escapeHtml(value) { return value.replace(/[&<>'"]/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[character])); }
</script>
