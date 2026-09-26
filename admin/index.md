---
layout: default
title: Admin
permalink: /admin/
robots: noindex, nofollow
---
<div id="cms" class="cms" data-supabase-url="{{ site.supabase_url }}" data-supabase-key="{{ site.supabase_anon_key }}" aria-live="polite">
  <section class="auth-screen" id="auth-screen" hidden>
    <div class="auth-card">
      <a class="cms-brand" href="{{ '/' | relative_url }}"><img class="logo-light" src="{{ '/assets/img/ra-b.png' | relative_url }}" alt="Robby Aprianto"><img class="logo-dark" src="{{ '/assets/img/ra-w.png' | relative_url }}" alt=""></a>
      <span class="status-label">Private CMS</span>
      <h1>Welcome back</h1>
      <p>Sign in to manage your portfolio and content.</p>
      <p class="notice" id="auth-error" role="alert" hidden></p>
      <button class="ui-button ui-button-primary ui-button-wide" id="github-login" type="button"><span class="icon" data-icon="github"></span>Continue with GitHub</button>
      <div class="auth-divider"><span>or continue with email</span></div>
      <form id="password-form" class="form-stack">
        <label for="email">Email</label><input class="ui-input" id="email" name="email" type="email" autocomplete="username" required>
        <label for="password">Password</label><input class="ui-input" id="password" name="password" type="password" autocomplete="current-password" required>
        <button class="ui-button ui-button-primary ui-button-wide" id="password-login" type="submit">Sign in</button>
      </form>
      <button class="theme-button auth-theme" id="theme-auth" type="button" aria-label="Change theme"></button>
    </div>
  </section>

  <section class="auth-screen" id="auth-loading"><div class="loading-card"><span class="spinner" aria-hidden="true"></span><p>Checking your session</p></div></section>
  <section class="auth-screen" id="access-denied" hidden><div class="auth-card"><span class="status-label">Access denied</span><h1>CMS access unavailable</h1><p>This account is not allowed to manage this site.</p><div class="auth-actions"><a class="ui-button ui-button-secondary" href="{{ '/' | relative_url }}">Back to website</a><button class="ui-button ui-button-primary" id="denied-signout" type="button">Sign out</button></div></div></section>

  <div class="cms-shell" id="cms-shell" hidden>
    <aside class="cms-sidebar" id="cms-sidebar" aria-label="Admin navigation">
      <a class="cms-brand" href="{{ '/' | relative_url }}"><img class="logo-light" src="{{ '/assets/img/ra-b.png' | relative_url }}" alt="Robby Aprianto"><img class="logo-dark" src="{{ '/assets/img/ra-w.png' | relative_url }}" alt=""><span class="brand-caption">CONTENT STUDIO</span></a>
      <nav class="side-nav" id="side-nav">
        <button class="nav-item is-active" data-view="dashboard"><span data-icon="layout"></span>Dashboard</button>
        <button class="nav-item" data-view="projects"><span data-icon="folder"></span>Projects</button>
        <button class="nav-item" data-view="blog"><span data-icon="file"></span>Blog</button>
        <button class="nav-item" data-view="notes"><span data-icon="lock"></span>Private notes</button>
        <button class="nav-item" data-view="settings"><span data-icon="settings"></span>Settings</button>
      </nav>
      <a class="back-link" href="{{ '/' | relative_url }}"><span data-icon="external"></span>Back to website</a>
      <div class="sidebar-account"><div class="account-avatar" id="account-avatar">RA</div><div class="account-copy"><strong id="account-name">Account</strong><span id="account-email"></span></div><button class="icon-button" id="sidebar-signout" type="button" aria-label="Sign out"><span data-icon="logout"></span></button></div>
    </aside>
    <div class="cms-main-column">
      <header class="cms-topbar"><button class="icon-button mobile-menu" id="mobile-menu" type="button" aria-label="Open navigation"><span data-icon="menu"></span></button><div class="breadcrumbs"><a href="{{ '/' | relative_url }}">Robby Aprianto</a><span>/</span><span id="crumb-current">Dashboard</span></div><div class="topbar-actions"><span class="connection-state" id="connection-state"><i></i>Connected</span><button class="theme-button" id="theme-main" type="button" aria-label="Change theme"></button></div></header>
      <main class="cms-content" id="view-root"><div class="skeleton title-skeleton"></div><div class="stat-grid"><div class="skeleton stat-skeleton"></div><div class="skeleton stat-skeleton"></div><div class="skeleton stat-skeleton"></div><div class="skeleton stat-skeleton"></div></div></main>
    </div>
    <button class="sidebar-backdrop" id="sidebar-backdrop" type="button" aria-label="Close navigation" hidden></button>
  </div>
  <div class="toast-region" id="toast-region" aria-live="polite" aria-atomic="true"></div>
</div>
<script type="module" src="{{ '/assets/js/admin.js' | relative_url }}"></script>
