# Edge Function secrets

Supabase reserves environment names starting with `SUPABASE_`. Use these custom names for Edge Functions:

```text
PROJECT_URL
SERVICE_ROLE_KEY
GH_PAT
REPO_OWNER
REPO_NAME
REPO_BRANCH
ADMIN_EMAIL
ADMIN_ORIGIN
ADMIN_ORIGINS
TDOCS_BASE_URL
TDOCS_API_TOKEN
```

Set `PROJECT_URL` to `https://icwjscdlcuplbogcbuyi.supabase.co`. `SERVICE_ROLE_KEY` and `GH_PAT` are server-only.

Set `ADMIN_ORIGINS` to every origin the CMS is served from, comma-separated, for example:

```text
https://robprian.github.io,http://gh.robrion.net,https://gh.robrion.net
```

Browsers block Edge Function responses (including error responses) when the page
origin is not allowlisted, which surfaces in the CMS as a generic network error.
Legacy single-origin `ADMIN_ORIGIN` is still accepted as a fallback.

## tdocs-gallery (CMS image picker)

The blog editor loads its cover/content gallery through the
`tdocs-gallery` function so the tDocs API token never appears in public
`admin.js`. Deploy it, then set its secrets:

```bash
supabase functions deploy tdocs-gallery
supabase secrets set TDOCS_BASE_URL="https://docs.ghazi.biz.id"
supabase secrets set TDOCS_API_TOKEN="tdocs_..."
```

Returned `stream_url` values are permanent `/cdn/{id}/stream` links
(never expired), safe to store as post covers or inline images.
