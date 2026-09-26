# Private CMS setup

Public Jekyll remains static. CMS data and private notes stay in Supabase. A server-side publishing endpoint must call GitHub Contents API; GitHub Pages cannot safely hold that endpoint or its credentials.

## Supabase

1. Create Supabase project.
2. Run `supabase/migrations/001_cms.sql` in SQL editor or through Supabase CLI.
3. Create the admin user in Supabase Auth.
4. Insert that user's UUID and email into `admin_profiles`.
5. Keep email allowlisting in the server-side endpoint. Never use editable `user_metadata` for authorization.
6. Configure redirect URL for `/admin/` in Supabase Auth.

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

This repository has no CMS server runtime, so no fake `/admin` client was added. A static page cannot enforce authentication or protect GitHub credentials. Deploy the server endpoint before adding admin UI actions.

## Local site

```sh
gem install bundler jekyll
bundle install
bundle exec jekyll serve
```

## GitHub Pages

Configure Pages to deploy from the repository's GitHub Actions workflow after adding the standard Jekyll build/deploy workflow in repository settings. Set `url` and `baseurl` in `_config.yml` to match Pages.
