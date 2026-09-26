# Portfolio CMS and deployment

## Architecture

- Public site and published article pages remain static Jekyll/GitHub Pages.
- Public profile, skills, experience, education, interests, projects, and article listing read from Supabase public RLS views/tables.
- `/admin/` uses a separate Jekyll shell branch and does not include the public header or footer.
- Authenticated GitHub repository sync reads owned repos server-side, including private repo names. Public `public_projects` view omits private `public_url` and `homepage`. User chose to expose private repo names publicly, which reveals that private repositories exist.
- Published article bodies are still Jekyll Markdown in `_posts/`. Supabase draft/body metadata is saved before publishing; GitHub Contents API commit triggers Pages build. Private notes remain Supabase-only.

## Database deploy and CV import

1. Apply `supabase/migrations/20260926055220_portfolio_cms.sql` after existing `001_cms.sql` using Supabase SQL Editor or CLI.
2. Run `supabase/seed/import-portfolio.sql` in Supabase SQL Editor. Stable `source_key` values make imports repeatable.
3. Verify row counts using `docs/data-migration.md` queries.
4. Private/admin row reads and writes are authorized through `admin_profiles`-checked RLS policies.

The repo contains no CV document. Import uses CV details included in user instructions and preserves the one tracked Jekyll post.

## GitHub repository sync

Deploy `supabase/functions/sync-github-projects` with server secrets `GH_PAT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_ORIGIN`. `.github/workflows/sync-projects.yml` runs `scripts/sync_projects.py` on manual dispatch or daily; configure matching repository secrets. Current authenticated GitHub inventory was checked: 160 owned repositories, 90 public, 70 private.

Public view includes private names and descriptions as user explicitly requested, but omits private repository URL and homepage. Never make the source `projects` table public.

## Authentication

Supabase Auth GitHub OAuth returns to `https://robprian.github.io/admin/`. Allow this redirect in Supabase Auth URL settings. Password sign-in stays available. Only Auth users present in `admin_profiles` may enter CMS. Do not store passwords in repository files.

## Server secrets

Edge Function only:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
GH_PAT
REPO_OWNER=robprian
REPO_NAME=robprian.github.io
REPO_BRANCH=main
ADMIN_EMAIL
ADMIN_ORIGIN=https://robprian.github.io
```

Never place these values in Jekyll source or browser JavaScript. Browser configuration may include only Supabase URL and publishable key.

## Local checks

```sh
node --check assets/js/admin.js
node --check assets/js/public-data.js
python3 -m py_compile scripts/sync_projects.py
bundle exec jekyll build --strict-front-matter
```
