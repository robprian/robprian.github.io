---
layout: default
title: Home
description: Robby Aprianto, System Engineer focused on Linux, infrastructure, automation, and DevOps.
permalink: /
---

<section class="hero" aria-labelledby="hero-title">
  <div class="hero-copy">
    <p class="eyebrow">SYSTEM ENGINEER / JAKARTA, INDONESIA</p>
    <h1 id="hero-title">Reliable systems.<br><span>Useful automation.</span></h1>
    <p class="hero-lede">I build and document practical infrastructure with Linux, cloud platforms, and automation tools. This site is where engineering work meets clear field notes.</p>
    <div class="hero-actions">
      <a class="button button-primary" href="{{ '/projects/' | relative_url }}">View projects</a>
      <a class="button button-secondary" href="{{ '/blog/' | relative_url }}">Read field notes</a>
    </div>
  </div>
  <aside class="hero-panel" aria-label="Engineering focus">
    <div class="panel-marker">/ focus</div>
    <ul class="focus-list">
      <li><span>01</span> Linux systems</li>
      <li><span>02</span> Infrastructure</li>
      <li><span>03</span> Automation</li>
      <li><span>04</span> Cloud operations</li>
    </ul>
    <div class="panel-foot">Build carefully. Operate calmly.</div>
  </aside>
</section>

<section class="split-section" id="about" aria-labelledby="about-title">
  <div class="section-intro"><p class="eyebrow">01 / ABOUT</p><h2 id="about-title">Engineering with a bias for clarity.</h2></div>
  <div class="section-body"><p>I am Robby Aprianto, a System Engineer interested in reliable Linux systems, infrastructure automation, and DevOps practices.</p><p>I use this space to share what I learn, explain the work behind deployments, and keep technical decisions understandable.</p><a class="text-link" href="mailto:{{ site.email }}">Start a conversation</a></div>
</section>

<section class="skills-section" id="skills" aria-labelledby="skills-title">
  <div class="section-heading"><p class="eyebrow">02 / TOOLKIT</p><h2 id="skills-title">Tools I use to move work forward.</h2></div>
  <div class="skill-list" aria-label="Skills"><span>Linux</span><span>Docker</span><span>Cloud infrastructure</span><span>Git</span><span>CI/CD</span><span>Bash</span><span>Python</span><span>Networking</span><span>Monitoring</span></div>
</section>

<section class="latest-section" id="latest" aria-labelledby="latest-title">
  <div class="section-heading"><p class="eyebrow">03 / LATEST</p><h2 id="latest-title">Recent field notes.</h2><a class="text-link" href="{{ '/blog/' | relative_url }}">All notes</a></div>
  <div class="post-grid">{% for post in site.posts limit:3 %}<article class="post-card"><p class="post-meta">{{ post.date | date: "%d %b %Y" }}{% if post.categories.size > 0 %} · {{ post.categories | first }}{% endif %}</p><h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3><p>{{ post.excerpt | strip_html | truncate: 150 }}</p><a class="text-link" href="{{ post.url | relative_url }}">Read article</a></article>{% else %}<p class="empty-state">No published notes yet.</p>{% endfor %}</div>
</section>

<section class="contact-section" id="contact" aria-labelledby="contact-title"><p class="eyebrow">04 / CONTACT</p><h2 id="contact-title">Have a system worth making clearer?</h2><a class="button button-primary" href="mailto:{{ site.email }}">Email Robby</a></section>
