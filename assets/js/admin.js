const cms = document.querySelector('#cms');
const config = { url: cms?.dataset.supabaseUrl || '', key: cms?.dataset.supabaseKey || '' };
const nodes = Object.fromEntries(['auth-screen','auth-loading','access-denied','cms-shell','auth-error','view-root','crumb-current','connection-state','account-email','account-name','account-avatar','toast-region','cms-sidebar','sidebar-backdrop'].map(id => [id, document.getElementById(id)]));
const icons = { github:'<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>',layout:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M9 9h12"/>',folder:'<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.8Z"/>',external:'<path d="M15 3h6v6M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m17.07 7.07-1.42-1.42M6.35 6.35 4.93 4.93m14.14 0-1.42 1.42M6.35 17.65l-1.42 1.42"/>',moon:'<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>',search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',plus:'<path d="M12 5v14M5 12h14"/>',edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/>',trash:'<path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/>',globe:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',calendar:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',close:'<path d="m18 6-12 12M6 6l12 12"/>',arrow:'<path d="M7 17 17 7M7 7h10v10"/>',refresh:'<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2"/>',pin:'<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1z"/>',archive:'<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>'};
const icon = name => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.file}</svg>`;
document.querySelectorAll('[data-icon]').forEach(element => { element.innerHTML = icon(element.dataset.icon); });
const html = (value = '') => String(value).replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]));
const formatDate = value => value ? new Date(value).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' }) : 'Not published';
const toast = (message, kind = 'success') => { const item = document.createElement('div'); item.className = `toast toast-${kind}`; item.textContent = message; nodes['toast-region'].append(item); setTimeout(() => item.remove(), 3600); };
const skeleton = (count = 4) => `<div class="skeleton-grid">${Array.from({length:count}, () => '<div class="skeleton-card"><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line short"></div><div class="skeleton skeleton-foot"></div></div>').join('')}</div>`;
const panel = (title, content, action = '') => `<section class="ui-card"><header class="card-heading"><h2>${title}</h2>${action}</header>${content}</section>`;
const emptyState = (title, description, action = '') => `<div class="empty-state"><span class="empty-icon">${icon('file')}</span><h3>${title}</h3><p>${description}</p>${action}</div>`;
const dialog = (title, message, confirmLabel, onConfirm) => { const modal = document.createElement('dialog'); modal.className = 'cms-dialog'; modal.innerHTML = `<form method="dialog"><button class="icon-button dialog-close" aria-label="Close">${icon('close')}</button></form><h2>${title}</h2><p>${message}</p><div class="dialog-actions"><button class="ui-button ui-button-secondary" data-cancel>Cancel</button><button class="ui-button ui-button-danger" data-confirm>${confirmLabel}</button></div>`; document.body.append(modal); modal.showModal(); modal.querySelector('[data-cancel]').onclick = () => modal.close(); modal.querySelector('[data-confirm]').onclick = async () => { await onConfirm(); modal.close(); }; modal.addEventListener('close', () => modal.remove()); };
function confirmButton(text, event) { return `<button class="ui-button ui-button-secondary" type="button" data-action="${event}">${text}</button>`; }

let supabase, session, profile, currentView = 'dashboard', repoData = [], postsData = [], notesData = [], currentDraft = null, saveTimer, renderNotes = null, systemTheme, isSaving = false, selectedPosts = new Set();
const themeKey = 'ra-theme';
function applyTheme(mode) { const actual = mode === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : mode; document.documentElement.dataset.theme = actual; document.documentElement.dataset.themeMode = mode; document.documentElement.style.colorScheme = actual; document.querySelectorAll('.theme-button').forEach(button => { button.innerHTML = `${icon(actual === 'dark' ? 'sun' : 'moon')}<span>${mode === 'system' ? 'System' : actual === 'dark' ? 'Dark' : 'Light'}</span>`; }); }
function cycleTheme() { const order = ['light','dark','system']; const next = order[(order.indexOf(localStorage.getItem(themeKey) || 'system') + 1) % order.length]; localStorage.setItem(themeKey,next); applyTheme(next); }
applyTheme(localStorage.getItem(themeKey) || 'system');
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if ((localStorage.getItem(themeKey) || 'system') === 'system') applyTheme('system'); });
document.querySelectorAll('.theme-button').forEach(button => button.addEventListener('click',cycleTheme));
function showAuthError(message) { document.querySelector('#auth-error').textContent = message; document.querySelector('#auth-error').hidden = false; }
function authorizedScreen(kind) { nodes['auth-loading'].hidden = true; nodes['auth-screen'].hidden = kind !== 'login'; nodes['access-denied'].hidden = kind !== 'denied'; nodes['cms-shell'].hidden = kind !== 'cms'; }
async function setSession(nextSession) {
  session = nextSession;
  if (!session) { authorizedScreen('login'); return; }
  const { data, error } = await supabase.from('admin_profiles').select('user_id,email').eq('user_id', session.user.id).maybeSingle();
  if (error) { showAuthError('Unable to verify admin access. Database setup is incomplete.'); authorizedScreen('login'); return; }
  if (!data) { profile = null; authorizedScreen('denied'); return; }
  profile = data; nodes['account-email'].textContent = data.email || session.user.email || ''; nodes['account-name'].textContent = session.user.user_metadata?.user_name || session.user.user_metadata?.name || 'Robby Aprianto'; nodes['account-avatar'].textContent = (nodes['account-name'].textContent.match(/\b\w/g) || ['R','A']).join('').slice(0,2).toUpperCase();
  authorizedScreen('cms'); await loadView(currentView);
}
async function requestRepos() { const {data,error}=await supabase.from('projects').select('id,name,description,is_private,public_url,language,github_updated_at').order('github_updated_at',{ascending:false});if(error)throw error;return (data||[]).map(item=>({id:item.id,title:item.name,description:item.description||'',url:item.is_private?null:item.public_url,language:item.language,visibility:item.is_private?'private':'public',updated:item.github_updated_at})); }
async function fetchPosts() { const { data, error } = await supabase.from('posts_metadata').select('*').order('updated_at', { ascending:false }); if (error) throw error; postsData = data || []; }
async function fetchNotes() { const { data, error } = await supabase.from('notes').select('id,title,content,category,tags,is_pinned,is_archived,created_at,updated_at').order('is_pinned', { ascending:false }).order('updated_at', { ascending:false }); if (error) throw error; notesData = data || []; }
const pageHeader = (eyebrow, title, description, actions = '') => `<div class="page-header"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p>${description}</p></div><div class="page-actions">${actions}</div></div>`;
const statCard = (label, value, note, glyph) => `<article class="stat-card"><div class="stat-heading"><span>${label}</span><span class="stat-glyph">${icon(glyph)}</span></div><strong>${value}</strong><small>${note}</small></article>`;
async function dashboardView() {
  nodes['view-root'].innerHTML = skeleton();
  try { const [repos] = await Promise.all([requestRepos(), fetchPosts()]); repoData = repos; }
  catch (error) { nodes['connection-state'].classList.add('is-error'); nodes['connection-state'].innerHTML = `<i></i>Connection issue`; }
  const draftCount = postsData.filter(post => post.status === 'DRAFT').length, publishedCount = postsData.filter(post => post.status === 'PUBLISHED').length;
  const recent = [...postsData].sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0,5);
  nodes['view-root'].innerHTML = `${pageHeader('OVERVIEW','Dashboard','Overview of your portfolio content.')}<div class="stat-grid">${statCard('Total projects',repoData.length,'Public repositories','folder')}${statCard('Public projects',repoData.length,'Listed on GitHub','globe')}${statCard('Published posts',publishedCount,'Live on the website','file')}${statCard('Draft posts',draftCount,'Private in Supabase','edit')}</div><div class="dashboard-grid">${panel('Recent posts',recent.length ? `<div class="content-list">${recent.map(post => `<div class="content-row"><div class="row-mark">${icon('file')}</div><div class="row-copy"><strong>${html(post.title)}</strong><span>Updated ${formatDate(post.updated_at)}</span></div><span class="status-badge ${post.status === 'PUBLISHED' ? 'status-public' : 'status-draft'}">${html(post.status)}</span></div>`).join('')}</div>` : emptyState('No posts yet','Create your first article.','<button class="ui-button ui-button-primary" data-action="new-post">Create post</button>'),confirmButton('View blog','view-blog'))}${panel('Projects from GitHub',repoData.length ? `<div class="content-list">${repoData.slice(0,5).map(project => `<div class="content-row"><div class="row-mark">${icon('folder')}</div><div class="row-copy"><strong>${html(project.title)}</strong><span>${html(project.language || 'Repository')}</span></div><span class="status-badge status-public">Public</span></div>`).join('')}</div>` : emptyState('No public projects','No public repositories found.'),confirmButton('View projects','view-projects'))}</div><p class="private-callout"><span>${icon('lock')}</span> Notes and drafts stay in Supabase. They are not published to GitHub Pages.</p>`;
  bindViewActions();
}
const projectLink = project => project.visibility === 'public' && project.url ? `<a class="project-title-link" href="${html(project.url)}" target="_blank" rel="noopener noreferrer">${html(project.title)} <span>${icon('arrow')}</span></a>` : `<span class="project-title-private">${icon('lock')}${html(project.title)}</span>`;
function projectsView() {
  nodes['view-root'].innerHTML = `${pageHeader('PORTFOLIO','Projects','Public repositories from your GitHub account.',`<button class="ui-button ui-button-secondary" data-action="refresh-projects">${icon('refresh')}Refresh list</button>`)}<div class="toolbar"><label class="search-field">${icon('search')}<input id="project-search" type="search" placeholder="Search projects" aria-label="Search projects"></label><div class="segmented" role="group" aria-label="Project visibility"><button class="is-selected" data-project-filter="all">All</button><button data-project-filter="public">Public</button><button data-project-filter="private">Private</button></div><span class="toolbar-count" id="project-count"></span></div><div class="project-grid" id="project-grid">${repoData.length ? '' : emptyState('No public projects','Repositories marked public on GitHub appear here.')}</div><p class="private-callout"><span>${icon('lock')}</span> Private repository names and URLs are not requested or rendered here.</p>`;
  const render = () => { const query = document.querySelector('#project-search').value.toLowerCase(); const filter = document.querySelector('[data-project-filter].is-selected').dataset.projectFilter; const filtered = repoData.filter(item => (filter === 'all' || item.visibility === filter) && `${item.title} ${item.description} ${item.language || ''}`.toLowerCase().includes(query)); document.querySelector('#project-count').textContent = `${filtered.length} projects`; document.querySelector('#project-grid').innerHTML = filtered.length ? filtered.map(project => `<article class="project-card">${projectLink(project)}<p>${html(project.description)}</p><div class="project-card-foot"><span class="status-badge ${project.visibility==='private'?'status-private':'status-public'}">${project.visibility==='private'?`${icon('lock')}Private`:'Public'}</span><span>${html(project.language || 'Repository')}</span>${project.visibility==='public'?`<a href="${html(project.url)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${html(project.title)} on GitHub">${icon('arrow')}</a>`:''}</div></article>`).join('') : emptyState('No matching projects','Change your search or visibility filter.'); };
  document.querySelector('#project-search').addEventListener('input', render); document.querySelectorAll('[data-project-filter]').forEach(button => button.onclick = () => { document.querySelectorAll('[data-project-filter]').forEach(item => item.classList.remove('is-selected')); button.classList.add('is-selected'); render(); }); render(); bindViewActions();
}
function blogView() {
  selectedPosts = new Set();
  nodes['view-root'].innerHTML = `${pageHeader('PUBLISHING','Blog','Manage drafts and published articles.',`<button class="ui-button ui-button-primary" data-action="new-post">${icon('plus')}New post</button>`)}<div class="toolbar"><label class="search-field">${icon('search')}<input id="post-search" type="search" placeholder="Search posts" aria-label="Search posts"></label><div class="segmented" role="group" aria-label="Post status"><button class="is-selected" data-post-filter="all">All</button><button data-post-filter="PUBLISHED">Published</button><button data-post-filter="DRAFT">Drafts</button></div><button class="ui-button ui-button-primary" id="batch-publish" type="button" disabled>Publish selected (0)</button></div><section class="ui-card table-card"><div class="table-scroll"><table><thead><tr><th class="select-col"><input type="checkbox" id="post-select-all" aria-label="Select all drafts"></th><th class="select-col" aria-label="Cover"></th><th>Article</th><th>Status</th><th>Last updated</th><th>GitHub sync</th><th></th></tr></thead><tbody id="post-table"></tbody></table></div><div id="post-empty"></div></section><p class="private-callout"><span>${icon('lock')}</span> Draft posts remain private in Supabase until publish succeeds.</p>`;
  const currentFiltered = () => { const query = document.querySelector('#post-search').value.toLowerCase(), filter = document.querySelector('[data-post-filter].is-selected').dataset.postFilter; return postsData.filter(post => (filter === 'all' || post.status === filter) && `${post.title} ${post.slug}`.toLowerCase().includes(query)); };
  const selectedDraftCount = () => [...selectedPosts].filter(slug => { const post = postsData.find(item => item.slug === slug); return post && post.status === 'DRAFT'; }).length;
  const updateBatchUI = () => { const button = document.querySelector('#batch-publish'); if (!button) return; const count = selectedDraftCount(); button.disabled = count === 0 || isSaving; button.textContent = `Publish selected (${count})`; };
  const updateSelectAll = () => { const box = document.querySelector('#post-select-all'); if (!box) return; const drafts = currentFiltered().filter(post => post.status === 'DRAFT'); const selected = drafts.filter(post => selectedPosts.has(post.slug)); box.checked = drafts.length > 0 && selected.length === drafts.length; box.indeterminate = selected.length > 0 && selected.length < drafts.length; };
  const render = () => { const filtered = currentFiltered(); document.querySelector('#post-table').innerHTML = filtered.map(post => `<tr><td class="select-col">${post.status === 'DRAFT' ? `<input type="checkbox" data-select-post="${html(post.slug)}" aria-label="Select ${html(post.title)}">` : ''}</td><td class="select-col">${post.cover_image ? `<img class="row-thumb" src="${html(post.cover_image)}" alt="" loading="lazy">` : '<span class="row-thumb row-thumb-empty" aria-hidden="true"></span>'}</td><td><strong>${html(post.title)}</strong><small>${html(post.slug)}</small></td><td><span class="status-badge ${post.status === 'PUBLISHED' ? 'status-public' : 'status-draft'}">${html(post.status)}</span></td><td>${formatDate(post.updated_at)}</td><td><span class="sync-indicator ${post.github_sha ? 'synced' : ''}"><i></i>${post.github_sha ? 'Synced' : 'Not published'}</span></td><td><button class="icon-button" data-edit-post="${html(post.slug)}" aria-label="Edit ${html(post.title)}">${icon('edit')}</button></td></tr>`).join(''); document.querySelector('#post-empty').innerHTML = filtered.length ? '' : emptyState('No posts found',postsData.length ? 'Try changing filters.' : 'Create your first article.','<button class="ui-button ui-button-primary" data-action="new-post">Create post</button>'); document.querySelectorAll('[data-select-post]').forEach(box => { box.checked = selectedPosts.has(box.dataset.selectPost); box.onchange = () => { if (box.checked) selectedPosts.add(box.dataset.selectPost); else selectedPosts.delete(box.dataset.selectPost); updateBatchUI(); updateSelectAll(); }; }); updateBatchUI(); updateSelectAll(); bindViewActions(); };
  document.querySelector('#post-search').addEventListener('input', render); document.querySelectorAll('[data-post-filter]').forEach(button => button.onclick = () => { document.querySelectorAll('[data-post-filter]').forEach(item => item.classList.remove('is-selected')); button.classList.add('is-selected'); render(); }); document.querySelector('#post-select-all').onchange = event => { const drafts = currentFiltered().filter(post => post.status === 'DRAFT'); if (event.target.checked) drafts.forEach(post => selectedPosts.add(post.slug)); else drafts.forEach(post => selectedPosts.delete(post.slug)); render(); }; document.querySelector('#batch-publish').onclick = batchPublish; render();
}
async function batchPublish() {
  const targets = [...selectedPosts].map(slug => postsData.find(post => post.slug === slug)).filter(post => post && post.status === 'DRAFT');
  if (!targets.length) { toast('Select at least one draft to publish.','error'); return; }
  if (!supabase || !session?.user) { toast('Session expired. Please sign in again.','error'); return; }
  if (isSaving) return;
  isSaving = true;
  const button = document.querySelector('#batch-publish'); if (button) button.disabled = true;
  let published = 0; const failed = [];
  for (let index = 0; index < targets.length; index++) {
    const post = targets[index];
    if (button) button.textContent = `Publishing ${index + 1}/${targets.length}…`;
    try {
      const { data:draft } = await supabase.from('drafts').select('title,content,description').eq('user_id',session.user.id).eq('slug',post.slug).maybeSingle();
      const content = draft?.content || post.content || '';
      if (!content) { failed.push(`${post.slug} (empty content)`); continue; }
      const result = await publishOne({ slug:post.slug, title:draft?.title || post.title, content, excerpt:draft?.description || post.excerpt || '', coverImage:post.cover_image || '' });
      if (result.ok) { published++; selectedPosts.delete(post.slug); } else failed.push(`${post.slug} (${result.message})`);
    } catch (error) { failed.push(`${post.slug} (${error?.message || 'unexpected error'})`); }
  }
  isSaving = false;
  try { await fetchPosts(); } catch (error) { toast('Published, but the list failed to reload. Refresh the view.','error'); await loadView('blog'); return; }
  if (failed.length) toast(`Published ${published} of ${targets.length}. Failed: ${failed.join('; ')}`,'error');
  else toast(`Published ${published} article${published === 1 ? '' : 's'} to GitHub.`);
  await loadView('blog');
}
function editorView(post = null) {
  currentDraft = post; const editing = Boolean(post); const oldSlug = post?.slug || '';
  nodes['view-root'].innerHTML = `${pageHeader('BLOG EDITOR',editing ? 'Edit article' : 'New article','Draft changes save privately in Supabase.',`<button class="ui-button ui-button-secondary" data-action="view-blog">Back to blog</button>`)}<form id="post-editor" class="editor-layout"><section class="ui-card editor-main"><label for="editor-title">Title</label><input class="ui-input editor-title" id="editor-title" value="${html(post?.title)}" placeholder="Give your article a title" required><label for="editor-content">Article content <span>Markdown</span></label><textarea class="ui-input editor-content" id="editor-content" rows="20" placeholder="Write your article in Markdown...">${html(post?.content || '')}</textarea><div class="editor-preview" id="editor-preview"><p>Preview appears here after you write content.</p></div></section><aside class="ui-card editor-settings"><h2>Publishing details</h2><label for="editor-slug">Slug</label><input class="ui-input" id="editor-slug" value="${html(post?.slug)}" placeholder="article-url-slug" required><label for="editor-description">Description</label><textarea class="ui-input" id="editor-description" rows="4" placeholder="Short summary for search and sharing">${html(post?.excerpt)}</textarea><label for="editor-cover">Cover image URL</label><input class="ui-input" id="editor-cover" value="${html(post?.cover_image || '')}" placeholder="https://… (optional)"><div class="cover-preview" id="cover-preview"></div><button class="ui-button ui-button-secondary ui-button-wide" id="cover-gallery" type="button">Choose cover from tDocs gallery</button><label for="editor-image-file">Upload image (saves to tDocs CDN)</label><input class="ui-input" id="editor-image-file" type="file" accept="image/*"><button class="ui-button ui-button-secondary ui-button-wide" id="image-upload" type="button">Upload & insert into article</button><button class="ui-button ui-button-secondary ui-button-wide" id="content-gallery" type="button">Insert from tDocs gallery</button><div class="upload-status" id="upload-status"></div><div class="editor-status" id="editor-status">${editing ? `Last saved ${formatDate(post.updated_at)}` : 'Unsaved draft'}</div><button class="ui-button ui-button-secondary ui-button-wide" id="draft-save" type="button">Save draft</button><button class="ui-button ui-button-primary ui-button-wide" id="post-publish" type="button">${post?.status === 'PUBLISHED' ? 'Update published post' : 'Publish post'}</button></aside></form>`;
  document.querySelector('#editor-title').addEventListener('input', event => { if (!document.querySelector('#editor-slug').value || !editing) document.querySelector('#editor-slug').value = event.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); scheduleSave(); });
  document.querySelector('#editor-content').addEventListener('input', () => { updatePreview(); scheduleSave(); }); updatePreview();
  document.querySelector('#editor-description').addEventListener('input', scheduleSave); document.querySelector('#editor-slug').addEventListener('input', scheduleSave);
  const renderCoverPreview = () => { const preview = document.querySelector('#cover-preview'); const value = document.querySelector('#editor-cover').value.trim(); preview.innerHTML = /^https?:\/\//.test(value) ? `<img src="${html(value)}" alt="Cover preview">` : ''; };
  document.querySelector('#editor-cover').addEventListener('input', () => { renderCoverPreview(); scheduleSave(); }); renderCoverPreview();
  document.querySelector('#cover-gallery').onclick = () => openTdocsGallery();
  document.querySelector('#content-gallery').onclick = () => openTdocsGallery();
  document.querySelector('#image-upload').onclick = async () => {
    const fileInput = document.querySelector('#editor-image-file'), status = document.querySelector('#upload-status'), button = document.querySelector('#image-upload');
    if (!supabase || !session?.user) { toast('Session expired. Please sign in again.','error'); return; }
    button.disabled = true; status.textContent = 'Uploading…';
    try {
      const file = fileInput.files[0];
      const url = await uploadBlogImage(file);
      const coverInput = document.querySelector('#editor-cover');
      if (!coverInput.value.trim()) { coverInput.value = url; renderCoverPreview(); }
      insertAtCursor(document.querySelector('#editor-content'), `\n\n![${(file.name || 'image').replace(/[\[\]()]/g,'')}](${url})\n`);
      updatePreview(); scheduleSave(); fileInput.value = '';
      status.textContent = 'Uploaded and inserted at cursor.';
      toast('Image uploaded and inserted.');
    } catch (error) { status.textContent = 'Upload failed'; toast(`Image upload failed: ${error?.message || 'unexpected error'}`,'error'); }
    finally { button.disabled = false; }
  };
  document.querySelector('#post-editor').onsubmit = event => event.preventDefault();
  document.querySelector('#draft-save').onclick = () => saveDraft('DRAFT', oldSlug);
  document.querySelector('#post-publish').onclick = () => saveDraft('PUBLISHED', oldSlug);
  bindViewActions();
}
function openTdocsGallery() {
  if (!supabase || !session?.user) { toast('Session expired. Please sign in again.','error'); return; }
  const state = { items: [], selected: '', loading: true, error: '' };
  const modal = document.createElement('dialog');
  modal.className = 'cms-dialog tdocs-dialog';
  modal.innerHTML = `<form method="dialog"><button class="icon-button dialog-close" aria-label="Close gallery">${icon('close')}</button></form><h2>tDocs image gallery</h2><p class="dialog-sub">Permanent CDN links. The chosen link never expires.</p><div class="tdocs-search"><label class="search-field">${icon('search')}<input id="tdocs-search" type="search" placeholder="Search images by name" aria-label="Search tDocs images"></label><button class="ui-button ui-button-primary" id="tdocs-search-btn" type="button">Search</button></div><div class="tdocs-status" id="tdocs-status" role="status"></div><div class="tdocs-grid" id="tdocs-grid"></div><div class="dialog-actions tdocs-actions"><span class="tdocs-hint" id="tdocs-hint">Pick an image first.</span><button class="ui-button ui-button-secondary" id="tdocs-cover" type="button" disabled>Use as cover</button><button class="ui-button ui-button-primary" id="tdocs-insert" type="button" disabled>Insert into article</button></div>`;
  document.body.append(modal);
  modal.addEventListener('close', () => modal.remove());
  const grid = modal.querySelector('#tdocs-grid'), status = modal.querySelector('#tdocs-status'), hint = modal.querySelector('#tdocs-hint');
  const coverBtn = modal.querySelector('#tdocs-cover'), insertBtn = modal.querySelector('#tdocs-insert');
  const selectedItem = () => state.items.find(item => item.id === state.selected);
  const render = () => {
    if (state.loading) { status.innerHTML = '<span class="spinner" aria-hidden="true"></span> Loading gallery'; grid.innerHTML = ''; }
    else if (state.error) { status.innerHTML = ''; grid.innerHTML = `<div class="tdocs-message"><p>Gallery failed to load: ${html(state.error)}</p><button class="ui-button ui-button-secondary" id="tdocs-retry" type="button">Retry</button></div>`; const retry = grid.querySelector('#tdocs-retry'); if (retry) retry.onclick = () => load(searchInput.value); }
    else if (!state.items.length) { status.innerHTML = ''; grid.innerHTML = '<div class="tdocs-message"><p>No images found. Upload one to tDocs first, or try another search.</p></div>'; }
    else { status.textContent = `${state.items.length} image${state.items.length === 1 ? '' : 's'} from tDocs`; grid.innerHTML = state.items.map(item => `<button class="tdocs-item${item.id === state.selected ? ' is-selected' : ''}" data-tdocs-id="${html(item.id)}" type="button" aria-pressed="${item.id === state.selected}"><img src="${html(item.stream_url)}" alt="${html(item.name)}" loading="lazy"><span class="tdocs-name">${html(item.name)}</span></button>`).join(''); grid.querySelectorAll('[data-tdocs-id]').forEach(button => button.onclick = () => { state.selected = button.dataset.tdocsId; const picked = selectedItem(); hint.textContent = picked ? picked.name : 'Pick an image first.'; coverBtn.disabled = insertBtn.disabled = !picked; render(); const again = grid.querySelector(`[data-tdocs-id="${state.selected}"]`); if (again) again.focus(); }); }
    if (state.loading || state.error || !state.items.length) { hint.textContent = 'Pick an image first.'; coverBtn.disabled = true; insertBtn.disabled = true; }
  };
  const load = async search => {
    state.loading = true; state.error = ''; state.selected = ''; render();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const params = new URLSearchParams({ limit: '60' });
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`${config.url}/functions/v1/tdocs-gallery?${params}`, { headers: { Authorization: `Bearer ${session.access_token}` }, signal: controller.signal });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Gallery request failed (HTTP ${res.status}).`);
      state.items = Array.isArray(data.files) ? data.files : [];
    } catch (error) {
      if (error?.name === 'AbortError') state.error = 'Gallery request timed out after 30 seconds. Try again.';
      else if (error instanceof TypeError || /failed to fetch|networkerror/i.test(error?.message || '')) state.error = 'Gallery unreachable. The function may be offline or this site origin is not in ADMIN_ORIGINS.';
      else state.error = error?.message || 'unexpected error';
    } finally { clearTimeout(timer); }
    state.loading = false; render();
  };
  const searchInput = modal.querySelector('#tdocs-search');
  modal.querySelector('#tdocs-search-btn').onclick = () => load(searchInput.value);
  searchInput.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); load(searchInput.value); } });
  coverBtn.onclick = () => {
    const picked = selectedItem(); if (!picked) return;
    const coverInput = document.querySelector('#editor-cover');
    if (coverInput) { coverInput.value = picked.stream_url; coverInput.dispatchEvent(new Event('input')); }
    modal.close(); toast('Cover set from tDocs gallery.');
  };
  insertBtn.onclick = () => {
    const picked = selectedItem(); if (!picked) return;
    const area = document.querySelector('#editor-content');
    if (area) { insertAtCursor(area, `\n\n![${picked.name.replace(/[\[\]()]/g,'')}](${picked.stream_url})\n`); updatePreview(); scheduleSave(); }
    modal.close(); toast('Image inserted from tDocs gallery.');
  };
  modal.showModal();
  searchInput.focus();
  load('');
}
function renderMarkdown(markdown) {
  const codeBlocks = [], inlineCodes = [];
  let text = html(markdown || '');
  text = text.replace(/```[a-zA-Z]*\n([\s\S]*?)(?:```|$)/g, (match, code) => { codeBlocks.push(`<pre><code>${code.replace(/^\n+|\n+$/g,'')}</code></pre>`); return `\u0000C${codeBlocks.length - 1}\u0000`; });
  text = text.replace(/`([^`\n]+)`/g, (match, code) => { inlineCodes.push(`<code>${code}</code>`); return `\u0000I${inlineCodes.length - 1}\u0000`; });
  const inline = value => value
    .replace(/!\[([^\]\n]*)\]\(([^)\s\n]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[([^\]\n]+)\]\(([^)\s\n]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  const blocks = text.split(/\n{2,}/).map(block => {
    const lines = block.split('\n').filter(line => line.trim() !== '');
    if (!lines.length) return '';
    const heading = lines[0].match(/^(#{1,3})\s+(.*)$/);
    if (heading && lines.length === 1) return `<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`;
    if (lines.every(line => /^[-*]\s+/.test(line))) return `<ul>${lines.map(line => `<li>${inline(line.replace(/^[-*]\s+/,''))}</li>`).join('')}</ul>`;
    if (lines.every(line => /^\d+\.\s+/.test(line))) return `<ol>${lines.map(line => `<li>${inline(line.replace(/^\d+\.\s+/,''))}</li>`).join('')}</ol>`;
    if (lines.every(line => /^&gt;\s?/.test(line))) return `<blockquote>${lines.map(line => inline(line.replace(/^&gt;\s?/,''))).join('<br>')}</blockquote>`;
    if (/^(-{3,}|\*{3,})$/.test(lines[0]) && lines.length === 1) return '<hr>';
    return `<p>${lines.map(inline).join('<br>')}</p>`;
  }).join('');
  return blocks.replace(/\u0000C(\d+)\u0000/g, (match, index) => codeBlocks[+index] || '').replace(/\u0000I(\d+)\u0000/g, (match, index) => inlineCodes[+index] || '');
}
function updatePreview() {
  try {
    const preview = document.querySelector('#editor-preview');
    if (preview) preview.innerHTML = renderMarkdown(document.querySelector('#editor-content').value) || '<p>Preview appears here after you write content.</p>';
  } catch (error) { /* preview must never break typing */ }
}
function insertAtCursor(textarea, text) { const start = textarea.selectionStart ?? textarea.value.length, end = textarea.selectionEnd ?? textarea.value.length; textarea.value = textarea.value.slice(0,start) + text + textarea.value.slice(end); textarea.selectionStart = textarea.selectionEnd = start + text.length; textarea.focus(); }
async function uploadBlogImage(file) {
  if (!file) throw new Error('Choose an image file first.');
  if (!file.type || !file.type.startsWith('image/')) throw new Error('Only image files are allowed.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Image must be 5 MB or smaller.');
  const form = new FormData();
  form.append('file', file, file.name);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);
  let res;
  try {
    res = await fetch(`${config.url}/functions/v1/tdocs-upload`, { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` }, body: form, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('Upload timed out after 2 minutes. Try a smaller image.');
    throw new Error('Upload unreachable. The function may be offline or this site origin is not in ADMIN_ORIGINS.');
  } finally { clearTimeout(timer); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Upload failed (HTTP ${res.status}).`);
  if (!data?.url) throw new Error('Upload succeeded but no URL was returned.');
  return data.url;
}
function scheduleSave() { if (isSaving || !document.querySelector('#editor-title')) return; const statusNode=document.querySelector('#editor-status'); if(statusNode)statusNode.textContent='Unsaved changes'; clearTimeout(saveTimer); saveTimer=setTimeout(()=>saveDraft('DRAFT',currentDraft?.slug||''),1500); }
async function callPublishAPI({ title, slug, content, description, coverImage }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);
  try {
    const response = await fetch(`${config.url}/functions/v1/publish-post`,{ method:'POST', signal:controller.signal, headers:{ Authorization:`Bearer ${session.access_token}`, 'Content-Type':'application/json' }, body:JSON.stringify({ action:'publish', title, slug, content, description, coverImage:coverImage || '' }) });
    let detail = '';
    try { const data = await response.json(); detail = data?.error || data?.message || ''; } catch { detail = ''; }
    if (!response.ok) return { ok:false, message:detail || `Publish request failed (HTTP ${response.status}). Draft is safe.` };
    return { ok:true, message:detail };
  } catch (error) {
    if (error?.name === 'AbortError') return { ok:false, message:'Publish timed out after 2 minutes. Draft is safe; please retry.' };
    return { ok:false, message:'Network error while publishing. Check your connection; draft is safe.' };
  } finally { clearTimeout(timer); }
}
async function publishOne({ slug, title, content, excerpt, coverImage }) {
  const api = await callPublishAPI({ title, slug, content, description:excerpt, coverImage });
  if (!api.ok) return api;
  const { data:publishedDraft, error:readError } = await supabase.from('drafts').select('github_path,github_sha,published_at').eq('user_id',session.user.id).eq('slug',slug).maybeSingle();
  if (readError) return { ok:false, message:'Published to GitHub, but the draft record could not be re-read. Reload and verify.' };
  const publishedAt = publishedDraft?.published_at || new Date().toISOString();
  const { error:updateError } = await supabase.from('posts_metadata').update({ status:'PUBLISHED', github_path:publishedDraft?.github_path ?? null, published_at:publishedAt, github_sha:publishedDraft?.github_sha ?? null, content, cover_image:coverImage || null, updated_at:new Date().toISOString() }).eq('slug',slug);
  if (updateError) return { ok:false, message:`Published to GitHub, but listing sync failed: ${updateError.message}. Retry publish to sync.` };
  return { ok:true, message:'Published' };
}
async function saveDraft(status, oldSlug = '') {
  const titleEl = document.querySelector('#editor-title'), slugEl = document.querySelector('#editor-slug'), contentEl = document.querySelector('#editor-content'), excerptEl = document.querySelector('#editor-description'), coverEl = document.querySelector('#editor-cover');
  if (!titleEl || !slugEl || !contentEl) return;
  if (!supabase || !session?.user) { toast('Session expired. Please sign in again.','error'); return; }
  const title = titleEl.value.trim(), slug = slugEl.value.trim().toLowerCase().replace(/[^a-z0-9-]/g,'-'), content = contentEl.value, excerpt = (excerptEl?.value || '').trim(), coverImage = (coverEl?.value || '').trim();
  if (!title || !slug) { toast('Add a title and valid slug before saving.','error'); return; }
  if (!content) { toast('Article content is empty. Write something before saving.','error'); return; }
  if (coverImage && !/^(https?:\/\/|\/)/.test(coverImage)) { toast('Cover image must be an https:// URL or a site-relative path.','error'); return; }
  if (isSaving) return;
  isSaving = true;
  const saveButton = document.querySelector('#draft-save'), publishButton = document.querySelector('#post-publish');
  if (saveButton) saveButton.disabled = true;
  if (publishButton) publishButton.disabled = true;
  const statusNode = document.querySelector('#editor-status');
  try {
    if (statusNode) statusNode.textContent = status === 'PUBLISHED' ? 'Publishing…' : 'Saving…';
    const updatedAt = new Date().toISOString();
    const draft = { user_id:session.user.id, slug, title, description:excerpt, content, status:'DRAFT', github_path:currentDraft?.github_path || null, github_sha:currentDraft?.github_sha || null, published_at:currentDraft?.published_at || null, updated_at:updatedAt };
    const { error:draftError } = await supabase.from('drafts').upsert(draft,{onConflict:'user_id,slug'});
    if (draftError) throw new Error(`Draft save rejected: ${draftError.message}`);
    const metadata = { user_id:session.user.id, slug, title, excerpt, status:'DRAFT', github_path:draft.github_path, github_sha:draft.github_sha, published_at:draft.published_at, cover_image:coverImage || null, updated_at:updatedAt };
    const { error:metadataError } = await supabase.from('posts_metadata').upsert(metadata,{onConflict:'slug'});
    if (metadataError) throw new Error(`Listing sync rejected: ${metadataError.message}`);
    if (status === 'PUBLISHED') {
      if (statusNode) statusNode.textContent = 'Publishing…';
      const result = await publishOne({ slug, title, content, excerpt, coverImage });
      if (!result.ok) { if (statusNode) statusNode.textContent = 'Publish failed'; toast(result.message,'error'); return; }
      if (statusNode) statusNode.textContent = 'Published'; toast('Article published to GitHub.');
    } else { if (statusNode) statusNode.textContent = 'Saved'; toast('Draft saved.'); }
    if (oldSlug && oldSlug !== slug) {
      const { error:deleteError } = await supabase.from('drafts').delete().eq('user_id',session.user.id).eq('slug',oldSlug);
      if (deleteError) toast(`Saved under the new slug, but the old draft (“${oldSlug}”) could not be removed.`,'error');
    }
    await fetchPosts(); currentDraft = { ...draft, excerpt }; if (status === 'PUBLISHED') await loadView('blog');
  } catch (error) {
    if (statusNode) statusNode.textContent = 'Save failed';
    toast(`Save failed: ${error?.message || 'unexpected error'}. Content remains in editor.`,'error');
  } finally {
    isSaving = false;
    const saveBtn = document.querySelector('#draft-save'), pubBtn = document.querySelector('#post-publish');
    if (saveBtn) saveBtn.disabled = false;
    if (pubBtn) pubBtn.disabled = false;
  }
}
async function flipNoteFlag(id, field, value) {
  const target = notesData.find(item => item.id === id);
  if (!target) return;
  const previous = target[field];
  target[field] = value; target.updated_at = new Date().toISOString();
  if (typeof renderNotes === 'function') renderNotes();
  const { error } = await supabase.from('notes').update({ [field]: value, updated_at: target.updated_at }).eq('id', id).eq('user_id', session.user.id);
  if (error) { target[field] = previous; toast(`Unable to update note: ${error.message}`, 'error'); }
  try { await fetchNotes(); } catch { /* keep optimistic state when reload fails */ }
  if (typeof renderNotes === 'function') renderNotes();
}
function bindNoteCards() {
  document.querySelectorAll('[data-pin-note]').forEach(button => button.onclick = () => { const note = notesData.find(item => item.id === button.dataset.pinNote); if (note) flipNoteFlag(note.id, 'is_pinned', !note.is_pinned); });
  document.querySelectorAll('[data-archive-note]').forEach(button => button.onclick = () => { const note = notesData.find(item => item.id === button.dataset.archiveNote); if (note) flipNoteFlag(note.id, 'is_archived', !note.is_archived); });
}
function notesView() {
  nodes['view-root'].innerHTML = `${pageHeader('PRIVATE STORAGE','Private notes','Your personal notes stay in protected Supabase storage.','<button class="ui-button ui-button-primary" data-action="new-note">'+icon('plus')+'New note</button>')}<div class="toolbar"><label class="search-field notes-search">${icon('search')}<input id="note-search" type="search" placeholder="Search notes" aria-label="Search private notes"></label><div class="segmented" role="group" aria-label="Note filter"><button class="is-selected" data-note-filter="active">Active</button><button data-note-filter="pinned">Pinned</button><button data-note-filter="archived">Archived</button></div><span class="toolbar-count" id="note-count"></span></div><div class="notes-grid" id="notes-grid"></div><p class="private-callout"><span>${icon('lock')}</span> Private notes are never published to the website or written to the public repository.</p>`;
  const noteFilter = () => document.querySelector('[data-note-filter].is-selected').dataset.noteFilter;
  const noteEmpty = (filter, query) => query ? emptyState('No matching notes','Try another search or filter.') : filter === 'pinned' ? emptyState('No pinned notes yet','Pin one from any active note.') : filter === 'archived' ? emptyState('Archive is empty','Archived notes land here when you archive them.') : emptyState('No private notes yet','Create a note to keep an idea or technical detail safely.','<button class="ui-button ui-button-primary" data-action="new-note">Create a note</button>');
  const render = () => { const query = document.querySelector('#note-search').value.toLowerCase(), filter = noteFilter(); const filtered = notesData.filter(note => { const archived = Boolean(note.is_archived); if (filter === 'active' && archived) return false; if (filter === 'pinned' && (!note.is_pinned || archived)) return false; if (filter === 'archived' && !archived) return false; return `${note.title} ${note.content} ${note.category} ${(note.tags || []).join(' ')}`.toLowerCase().includes(query); }).sort((a,b) => ((b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0)) || (new Date(b.updated_at) - new Date(a.updated_at))); const counter = document.querySelector('#note-count'); if (counter) counter.textContent = `${filtered.length} note${filtered.length === 1 ? '' : 's'}`; document.querySelector('#notes-grid').innerHTML = filtered.length ? filtered.map(note => `<article class="note-card${note.is_pinned ? ' is-pinned' : ''}"><header><span class="note-badges">${note.is_pinned ? '<span class="status-badge status-pinned">Pinned</span>' : ''}${note.is_archived ? '<span class="status-badge status-private">Archived</span>' : '<span class="status-badge status-private">' + icon('lock') + 'Private</span>'}</span><span class="note-actions"><button class="icon-button" data-pin-note="${note.id}" aria-label="${note.is_pinned ? 'Unpin' : 'Pin'} note ${html(note.title)}" aria-pressed="${Boolean(note.is_pinned)}">${icon('pin')}</button><button class="icon-button" data-archive-note="${note.id}" aria-label="${note.is_archived ? 'Unarchive' : 'Archive'} note ${html(note.title)}">${icon('archive')}</button><button class="icon-button" data-edit-note="${note.id}" aria-label="Edit note ${html(note.title)}">${icon('edit')}</button></span></header><h2>${html(note.title)}</h2>${(note.tags || []).length ? `<p class="note-tags">${(note.tags || []).map(tag => `<span>#${html(tag)}</span>`).join('')}</p>` : ''}<p class="note-body">${html(note.content)}</p><footer>${html(note.category || 'Uncategorized')} · Updated ${formatDate(note.updated_at)}</footer></article>`).join('') : noteEmpty(filter, query); bindViewActions(); bindNoteCards(); };
  document.querySelector('#note-search').addEventListener('input', render); document.querySelectorAll('[data-note-filter]').forEach(button => button.onclick = () => { document.querySelectorAll('[data-note-filter]').forEach(item => item.classList.remove('is-selected')); button.classList.add('is-selected'); render(); }); renderNotes = render; render();
}
function noteEditor(note = null) { const modal = document.createElement('dialog'); modal.className = 'cms-dialog note-dialog'; modal.innerHTML = `<form method="dialog"><button class="icon-button dialog-close" aria-label="Close">${icon('close')}</button></form><h2>${note ? 'Edit private note' : 'New private note'}</h2><p>Stored privately in Supabase, never published.</p><form id="note-form" class="form-stack"><label for="note-title">Title</label><input class="ui-input" id="note-title" required value="${html(note?.title)}" autocomplete="off"><div class="note-duo"><div><label for="note-category">Category</label><input class="ui-input" id="note-category" value="${html(note?.category)}" autocomplete="off"></div><div><label for="note-tags">Tags</label><input class="ui-input" id="note-tags" value="${html((note?.tags || []).join(', '))}" placeholder="idea, follow-up" autocomplete="off"></div></div><label for="note-content">Note</label><textarea class="ui-input note-area" id="note-content" rows="9">${html(note?.content)}</textarea><div class="note-flags"><label class="note-check"><input type="checkbox" id="note-pinned"${note?.is_pinned ? ' checked' : ''}>Pin to top</label><label class="note-check"><input type="checkbox" id="note-archived"${note?.is_archived ? ' checked' : ''}>Archive</label></div><div class="dialog-actions"><span class="note-form-hint" id="note-form-hint">${note ? `Updated ${formatDate(note.updated_at)}` : 'Saves privately.'}</span>${note ? '<button type="button" class="ui-button ui-button-danger" id="delete-note">Delete</button>' : ''}<button type="button" class="ui-button ui-button-secondary" id="note-cancel">Cancel</button><button class="ui-button ui-button-primary" type="submit" id="note-save">Save note</button></div></form>`; document.body.append(modal); modal.showModal(); modal.addEventListener('close', () => modal.remove()); modal.querySelector('#note-cancel').onclick = () => modal.close(); const noteTitleInput = modal.querySelector('#note-title'); noteTitleInput.focus(); modal.querySelector('#note-form').onsubmit = async event => { event.preventDefault(); const saveBtn = modal.querySelector('#note-save'); if (saveBtn.disabled) return; const title = noteTitleInput.value.trim(); if (!title) { toast('Add a title before saving.','error'); noteTitleInput.focus(); return; } const tags = modal.querySelector('#note-tags').value.split(',').map(tag => tag.trim().slice(0,30)).filter(Boolean).slice(0,12); const data = { user_id:session.user.id, title, category:modal.querySelector('#note-category').value.trim().slice(0,60), content:modal.querySelector('#note-content').value, tags, is_pinned:modal.querySelector('#note-pinned').checked, is_archived:modal.querySelector('#note-archived').checked, updated_at:new Date().toISOString() }; saveBtn.disabled = true; saveBtn.textContent = 'Saving…'; const query = note ? supabase.from('notes').update(data).eq('id',note.id).eq('user_id',session.user.id) : supabase.from('notes').insert(data); const { error } = await query; saveBtn.disabled = false; saveBtn.textContent = 'Save note'; if (error) { toast('Unable to save private note.','error'); return; } modal.close(); toast(note ? 'Note updated.' : 'Note saved privately.'); try { await fetchNotes(); } catch { toast('Saved, but the list failed to reload. Reopen notes to refresh.','error'); return; } if (typeof renderNotes === 'function' && document.querySelector('#notes-grid')) renderNotes(); else notesView(); }; if (note) modal.querySelector('#delete-note').onclick = () => dialog('Delete private note?','This note will be permanently removed.','Delete',async () => { const { error } = await supabase.from('notes').delete().eq('id',note.id).eq('user_id',session.user.id); if (error) toast('Unable to delete note.','error'); else { toast('Note deleted.'); await fetchNotes(); notesView(); } }); }
async function settingsView() { const user = session.user; nodes['view-root'].innerHTML = `${pageHeader('PREFERENCES','Settings','Manage account access and appearance.')}<div class="settings-grid">${panel('Account',`<dl class="settings-list"><div><dt>Email</dt><dd>${html(user.email)}</dd></div><div><dt>Identity provider</dt><dd>${html(user.app_metadata?.provider || 'Email')}</dd></div><div><dt>Session</dt><dd>Authenticated</dd></div></dl>`)}${panel('Appearance',`<p class="settings-description">Choose your preferred appearance. System follows device setting.</p><div class="theme-options"><button class="theme-option" data-set-theme="light">${icon('sun')}Light</button><button class="theme-option" data-set-theme="dark">${icon('moon')}Dark</button><button class="theme-option" data-set-theme="system">${icon('settings')}System</button></div>`)}${panel('Security',`<p class="settings-description">Sign out of this CMS on this device.</p><button class="ui-button ui-button-secondary" id="settings-signout">${icon('logout')}Sign out</button>`)}</div>`;
  document.querySelectorAll('[data-set-theme]').forEach(button => button.onclick = () => { localStorage.setItem(themeKey,button.dataset.setTheme); applyTheme(button.dataset.setTheme); toast(`Theme set to ${button.dataset.setTheme}.`); }); document.querySelector('#settings-signout').onclick = signOut;
}
async function loadView(view) { currentView = view; document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('is-active',item.dataset.view === view)); nodes['crumb-current'].textContent = view === 'notes' ? 'Private notes' : view[0].toUpperCase()+view.slice(1); if (view === 'dashboard') await dashboardView(); else if (view === 'projects') { nodes['view-root'].innerHTML = skeleton(6); try { repoData = await requestRepos(); projectsView(); } catch { nodes['view-root'].innerHTML = `${pageHeader('PORTFOLIO','Projects','Unable to load GitHub repositories.')}<div class="error-panel"><p>Check your connection and retry.</p><button class="ui-button ui-button-secondary" data-action="refresh-projects">Retry</button></div>`; bindViewActions(); } } else if (view === 'blog') { nodes['view-root'].innerHTML = skeleton(4); try { await fetchPosts(); blogView(); } catch { nodes['view-root'].innerHTML = `${pageHeader('PUBLISHING','Blog','Unable to load posts.')}<div class="error-panel"><p>Check your connection and retry.</p><button class="ui-button ui-button-secondary" data-action="reload-view">Retry</button></div>`; bindViewActions(); } } else if (view === 'notes') { nodes['view-root'].innerHTML = skeleton(4); try { await fetchNotes(); notesView(); } catch { nodes['view-root'].innerHTML = `${pageHeader('PRIVATE STORAGE','Private notes','Unable to load notes.')}<div class="error-panel"><p>Check your connection and retry.</p><button class="ui-button ui-button-secondary" data-action="reload-view">Retry</button></div>`; bindViewActions(); } } else await settingsView(); closeMobileNav(); }
async function signOut() { await supabase.auth.signOut(); authorizedScreen('login'); toast('Signed out.'); }
function bindViewActions() { document.querySelectorAll('[data-action]').forEach(button => button.onclick = async () => { const action = button.dataset.action; if(action==='sync-projects'){button.disabled=true;button.textContent='Syncing…';const result=await fetch(`${config.url}/functions/v1/sync-github-projects`,{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},body:'{}'});button.disabled=false;button.innerHTML=`${icon('refresh')}Sync GitHub`;if(!result.ok){toast('GitHub sync failed. Check server configuration.','error');return;}const counts=await result.json();toast(`Synced ${counts.synced} repositories (${counts.public} public, ${counts.private} private).`);await loadView('projects');}else if (action === 'view-blog') loadView('blog'); else if (action === 'view-projects') loadView('projects'); else if (action === 'new-post') editorView(); else if (action === 'new-note') noteEditor(); else if (action === 'refresh-projects') loadView('projects'); else if (action === 'reload-view') loadView(currentView); }); document.querySelectorAll('[data-edit-post]').forEach(button => button.onclick = async () => { const post = postsData.find(item => item.slug === button.dataset.editPost); if (!post) return; const { data } = await supabase.from('drafts').select('*').eq('user_id',session.user.id).eq('slug',post.slug).maybeSingle(); editorView({ ...post, content:data?.content || post.content || '' }); }); document.querySelectorAll('[data-edit-note]').forEach(button => button.onclick = () => noteEditor(notesData.find(item => item.id === button.dataset.editNote))); }
document.querySelectorAll('.nav-item[data-view]').forEach(button => button.onclick = () => loadView(button.dataset.view));
document.querySelector('#github-login').onclick = async () => { const { error } = await supabase.auth.signInWithOAuth({ provider:'github', options:{ redirectTo:'https://robprian.github.io/admin/' } }); if (error) showAuthError('Unable to sign in. Please try again.'); };
document.querySelector('#password-form').onsubmit = async event => { event.preventDefault(); const button = document.querySelector('#password-login'); button.disabled = true; button.textContent = 'Signing in…'; const { error } = await supabase.auth.signInWithPassword({ email:document.querySelector('#email').value.trim(), password:document.querySelector('#password').value }); button.disabled = false; button.textContent = 'Sign in'; if (error) showAuthError('Unable to sign in. Check your credentials and try again.'); };
document.querySelector('#denied-signout').onclick = signOut; document.querySelector('#sidebar-signout').onclick = signOut; document.querySelector('#mobile-menu').onclick = () => { nodes['cms-sidebar'].classList.add('is-open'); nodes['sidebar-backdrop'].hidden = false; }; nodes['sidebar-backdrop'].onclick = closeMobileNav;
function closeMobileNav() { nodes['cms-sidebar'].classList.remove('is-open'); nodes['sidebar-backdrop'].hidden = true; }

if (!config.url || !config.key || config.url.includes('{{')) { authorizedScreen('login'); showAuthError('Admin sign-in is not configured.'); }
else {
  try { const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.49.1'); supabase = createClient(config.url,config.key,{ auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } }); const { data:{session:initial} } = await supabase.auth.getSession(); await setSession(initial); supabase.auth.onAuthStateChange((event,next) => { if (event === 'SIGNED_OUT') { session = null; profile = null; authorizedScreen('login'); return; } if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') { session = next; return; } if (next?.user?.id && next.user.id === session?.user?.id) return; setTimeout(() => setSession(next),0); }); }
  catch { authorizedScreen('login'); showAuthError('Unable to connect. Check your connection and reload.'); }
}
