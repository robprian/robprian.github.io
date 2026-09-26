# Portfolio data import

The initial CV and Jekyll import is repeatable. Apply `supabase/migrations/20260926055220_portfolio_cms.sql` first, then execute `supabase/seed/import-portfolio.sql` in Supabase SQL Editor while authenticated as project owner.

The import upserts on stable `source_key` values. It imports the CV facts supplied in the project requirements and the sole tracked Jekyll article, `2025-04-10-deploy-linux-app-di-flyio.md`. Existing repository source remains preserved. No CV document exists in the repository; imported CV facts come only from the user-provided text.

Verification queries:

```sql
select count(*) from profiles where source_key = 'cv:profile:robby-aprianto';
select category, count(*) from skills group by category order by category;
select count(*) from experiences where source_key like 'cv:experience:%';
select count(*) from education where source_key like 'cv:education:%';
select count(*) from interests where source_key like 'cv:interest:%';
select count(*) from posts_metadata where source_key like 'jekyll:%';
```

Expected source row counts: profile 1, skills 18, experience 5, education 2, interests 5, Jekyll post 1. Run verification only after migration/import succeeds. No missing source records are deleted by import.
