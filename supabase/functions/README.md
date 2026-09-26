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
```

Set `PROJECT_URL` to `https://icwjscdlcuplbogcbuyi.supabase.co`. `SERVICE_ROLE_KEY` and `GH_PAT` are server-only.

Set `ADMIN_ORIGINS` to every origin the CMS is served from, comma-separated, for example:

```text
https://robprian.github.io,http://gh.robrion.net,https://gh.robrion.net
```

Browsers block Edge Function responses (including error responses) when the page
origin is not allowlisted, which surfaces in the CMS as a generic network error.
Legacy single-origin `ADMIN_ORIGIN` is still accepted as a fallback.
