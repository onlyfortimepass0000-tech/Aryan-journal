# Weekly Ruthless Check-In

A single-user, mobile-first journaling app for tracking 7 life categories through the week
(Health, Relationships, Love, Work, Money, Fun, Personal Growth). Log entries as they happen;
a separate AI assistant fetches the week's data via a read-only JSON API and grades you on it.
This app only handles capture and read-out — no grading logic lives here.

## Stack

- Next.js 16 (App Router) on Vercel
- Storage: a dedicated Supabase Postgres project (separate from any other project/database),
  accessed directly over its REST API — no client SDK, no dependency
- Tailwind CSS
- No accounts, no login, no access token — nothing to configure before it works

## Local development

```bash
npm install
npm run dev
```

No `.env` file is required — the app has working Supabase connection details built in for
its own dedicated project. `.env.example` documents the two variables you'd set only if you
ever wanted to point it at a different database.

## Deploying to Vercel

Push to `main` and deploy — that's it. There's nothing to configure: no environment
variables, no tokens, no database setup. The one thing to watch for is Vercel's own
"Project Name" field on the New Project screen, which must be lowercase with no `---`
(e.g. `aryan-journal`) — unrelated to this app, just Vercel's naming rule.

## The read API

```
GET https://<app>.vercel.app/api/week-summary
```

Fetchable by URL alone, returns:

```json
{
  "weekStart": "2026-09-07",
  "weekEnd": "2026-09-13",
  "entries": { "health": ["..."], "relationships": [], "...": [] },
  "entryCounts": { "health": 2, "relationships": 0, "...": 0 }
}
```

Pass `?start=YYYY-MM-DD` to fetch a specific week; omit it for the most recent 7 days.

## Using the app

- **Log** tab — pick a category, type a free-text entry, save. Auto-timestamped.
- **Week** tab — this week's entries grouped by category, most recent first, with Prev/Next
  navigation to browse history and inline edit/delete.

## A note on privacy

There's no login and no access token, by design — the app is open to anyone who has the
deployed URL. If that ever becomes a concern (e.g. the URL gets shared or indexed), the
right fix is Vercel's own deployment protection (password or Vercel Authentication) on the
project, rather than reintroducing an app-level login.
