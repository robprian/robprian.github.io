import json
import os
import urllib.error
import urllib.parse
import urllib.request

owner = "robprian"
token = os.environ["GH_PAT"]
supabase_url = os.environ["SUPABASE_URL"].rstrip("/")
service_key = os.environ["SUPABASE_SECRET_KEY"]
repositories = []
for page in range(1, 11):
    query = urllib.parse.urlencode({"per_page": 100, "page": page, "visibility": "all", "affiliation": "owner", "sort": "updated"})
    request = urllib.request.Request(
        f"https://api.github.com/user/repos?{query}",
        headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        batch = json.load(response)
    repositories.extend(batch)
    if len(batch) < 100:
        break

rows = []
for repo in repositories:
    private = bool(repo["private"])
    rows.append({
        "github_repo_id": repo["id"],
        "source_key": f"github:{repo['id']}",
        "name": repo["name"],
        "description": repo.get("description"),
        "is_private": private,
        "public_url": None if private else repo.get("html_url"),
        "homepage": None if private else repo.get("homepage"),
        "language": repo.get("language"),
        "topics": repo.get("topics", []),
        "is_fork": bool(repo.get("fork")),
        "is_archived": bool(repo.get("archived")),
        "stars": repo.get("stargazers_count", 0),
        "default_branch": repo.get("default_branch"),
        "github_created_at": repo.get("created_at"),
        "github_updated_at": repo.get("updated_at"),
        "is_public": True,
        "updated_at": repo.get("updated_at"),
    })

for offset in range(0, len(rows), 100):
    body = json.dumps(rows[offset:offset + 100]).encode()
    request = urllib.request.Request(
        f"{supabase_url}/rest/v1/projects?on_conflict=github_repo_id",
        data=body,
        method="POST",
        headers={"apikey": service_key, "Authorization": f"Bearer {service_key}", "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=minimal"},
    )
    with urllib.request.urlopen(request, timeout=30):
        pass

print(json.dumps({"total": len(rows), "public": sum(not row["is_private"] for row in rows), "private": sum(row["is_private"] for row in rows), "synced": len(rows), "failed": 0}))
