# Private CMS setup

Public Jekyll remains static. CMS data and private notes stay in Supabase. A server-side publishing endpoint must call GitHub Contents API; GitHub Pages cannot safely hold that endpoint or its credentials.

## Supabase

1. Create Supabase project.
2. Run `supabase/migrations/001_cms.sql` in SQL editor or through Supabase CLI.
3. Create the admin user in Supabase Auth.
4. Insert that user's UUID and email into `admin_profiles`.
5. Keep email allowlisting in the server-side endpoint. Never use editable `user_metadata` for authorization.
6. Configure redirect URL for `/admin/` in Supabase Auth.
7. Configure Auth URL Configuration site URL as `https://robprian.github.io` and redirect URL as `https://robprian.github.io/admin/`.
8. If enabling Supabase OAuth Server, implement its consent route at `/oauth/consent`; this site uses Supabase Auth GitHub OAuth for admin login, not an OAuth server client registry.

## Server endpoint contract

Deploy an Edge Function or separate server with these server-only variables:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
GH_PAT
REPO_OWNER=robprian
REPO_NAME=robprian.github.io
REPO_BRANCH=main
ADMIN_EMAIL
```

GitHub Actions rejects secret names beginning with `GITHUB_`, so repository secrets use `GH_PAT`, `REPO_OWNER`, `REPO_NAME`, and `REPO_BRANCH`.

The endpoint must validate the Supabase access token with `auth.getUser`, require the allowlisted email, validate slug/frontmatter, and use the GitHub Contents API. It must pass the current file SHA for updates, reject SHA conflicts, serialize writes per path, validate uploads by MIME and byte limit, and keep the draft when GitHub rejects a write.

## GitHub secret safety

The supplied PAT was stored as repository secret `GH_PAT`; its value is not written to files or commit messages. Rotate that PAT immediately because it was pasted into chat. Use a fine-grained token scoped only to this repository's Contents write permission. Do not store `.env`; only `.env.example` is tracked.

## Public client variables

Only these may enter browser code:

```text
PUBLIC_SUPABASE_URL
PUBLIC_SUPABASE_ANON_KEY
```

The publishing backend remains server-only. The public `/admin/` shell is static, while Supabase Auth, RLS, and the Edge Function enforce access and publishing authorization.
## Admin UI

`/admin/` uses Jekyll-compatible static JavaScript with component-style render functions and semantic CSS tokens. It does not add React or Tailwind because GitHub Pages serves this project as static Jekyll output. It supports responsive navigation, light/dark/system theme, password login, GitHub OAuth, admin profile authorization, dashboard, public GitHub projects, posts, private notes, settings, skeleton/loading states, empty/error states, toast feedback, dialogs, and mobile sidebar.

The project API only returns public repositories. Public project titles render as links. Private repository data is never requested by the browser, so private URLs cannot become accidental public links.

The existing `assets/img/logo.png` is reused. CSS applies a dark filter in light theme and leaves original white text in dark theme; source image is unchanged.

## Local site

```sh
gem install bundler jekyll
bundle install
bundle exec jekyll serve
```

## GitHub Pages

Configure Pages to deploy from the repository's GitHub Actions workflow after adding the standard Jekyll build/deploy workflow in repository settings. Set `url` and `baseurl` in `_config.yml` to match Pages.
