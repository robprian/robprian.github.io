---
layout: default
title: Blog
permalink: /blog/
description: Practical field notes about Linux, infrastructure, automation, and DevOps.
---
<section class="page-intro"><p class="eyebrow">FIELD NOTES</p><h1>Notes from operating systems.</h1><p>{{ site.blog_description }}</p></section>
<section class="blog-tools" aria-label="Blog filters"><label for="post-search">Search notes</label><input id="post-search" type="search" placeholder="Search title or topic"><div class="filter-list"><button class="filter-button is-active" type="button" data-filter="all">All</button>{% assign categories = site.posts | map: 'categories' | join: ',' | split: ',' | uniq | sort %}{% for category in categories %}{% if category != '' %}<button class="filter-button" type="button" data-filter="{{ category | slugify }}">{{ category }}</button>{% endif %}{% endfor %}</div></section>
<div class="blog-list" id="blog-list">{% for post in site.posts %}<article class="blog-row" data-category="{% if post.categories.size > 0 %}{{ post.categories | first | slugify }}{% endif %}" data-search="{{ post.title | downcase }} {{ post.excerpt | strip_html | downcase }} {{ post.categories | join: ' ' | downcase }}"><div><p class="post-meta">{{ post.date | date: "%d %b %Y" }}{% for category in post.categories %} · {{ category }}{% endfor %}</p><h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2><p>{{ post.excerpt | strip_html | truncate: 180 }}</p></div><a class="text-link" href="{{ post.url | relative_url }}">Read article</a></article>{% else %}<p class="empty-state">No published notes yet.</p>{% endfor %}</div><p class="empty-state" id="no-results" hidden>No notes match this search.</p>
<script>
  const search = document.querySelector('#post-search'); const rows = [...document.querySelectorAll('.blog-row')]; const empty = document.querySelector('#no-results'); let filter = 'all';
  function update() { const query = search.value.toLowerCase().trim(); let shown = 0; rows.forEach(row => { const visible = (filter === 'all' || row.dataset.category === filter) && row.dataset.search.includes(query); row.hidden = !visible; if (visible) shown++; }); empty.hidden = shown !== 0; }
  search?.addEventListener('input', update); document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => { filter = button.dataset.filter; document.querySelectorAll('[data-filter]').forEach(item => item.classList.toggle('is-active', item === button)); update(); }));
</script>
