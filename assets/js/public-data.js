---
---
const api = '{{ site.supabase_url }}/rest/v1';
const key = '{{ site.supabase_anon_key }}';
const headers = { apikey: key, Authorization: `Bearer ${key}` };
const esc = value => String(value || '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

async function load(table, node, render, filters = {}, order = 'sort_order.asc') {
  if (!node) return;
  try {
    const query = new URLSearchParams({ select:'*', order, ...filters });
    const response = await fetch(`${api}/${table}?${query}`, { headers });
    if (!response.ok) throw new Error();
    const rows = await response.json();
    node.innerHTML = rows.length ? render(rows) : '<p class="data-state">No published entries yet.</p>';
  } catch {
    node.innerHTML = '<p class="data-state">Content is temporarily unavailable.</p>';
  }
}

load('skills', document.querySelector('#public-skills'), rows => {
  const groups = Map.groupBy(rows, item => item.category);
  return Array.from(groups, ([category, items]) => `<section class="skill-group"><h3>${esc(category)}</h3><div class="skill-grid">${items.map(skill => `<article class="skill-item"><span class="skill-mark" aria-hidden="true">${esc((skill.name || '').slice(0,2))}</span><span>${esc(skill.name)}</span></article>`).join('')}</div></section>`).join('');
}, { is_active:'eq.true' });

load('profiles', document.querySelector('#about-copy'), rows => rows.slice(0,1).map(profile => `<p>${esc(profile.summary)}</p><p>${esc(profile.location)}</p><p><a href="mailto:${esc(profile.email)}">${esc(profile.email)}</a></p>`).join(''), { is_public:'eq.true' }, 'updated_at.desc');
load('experiences', document.querySelector('#public-experience'), rows => rows.map(item => `<article class="experience-item"><p>${esc(item.start_date || '')} ${item.end_date ? `to ${esc(item.end_date)}` : 'to Present'}</p><h3>${esc(item.role)}</h3><p>${esc(item.organization)}</p><p>${esc(item.description)}</p></article>`).join(''), { is_public:'eq.true' });
load('education', document.querySelector('#public-education'), rows => rows.map(item => `<article><h3>${esc(item.credential)}</h3><p>${esc(item.institution)}</p><p>${esc(item.description)}</p></article>`).join(''), { is_public:'eq.true' });
load('interests', document.querySelector('#public-interests'), rows => rows.map(item => `<span>${esc(item.name)}</span>`).join(''), { is_public:'eq.true' });
load('public_posts', document.querySelector('#public-posts'), rows => rows.slice(0,3).map(post => `<article class="post-card"><p class="post-meta">${post.published_at ? new Date(post.published_at).toLocaleDateString() : ''}</p><h3><a href="/blog/?post=${encodeURIComponent(post.slug)}">${esc(post.title)}</a></h3><p>${esc(post.excerpt)}</p><a class="text-link" href="/blog/?post=${encodeURIComponent(post.slug)}">Read article</a></article>`).join(''), {}, 'published_at.desc');
