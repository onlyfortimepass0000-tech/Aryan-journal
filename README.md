# Weekly Ruthless Check-In

A single-user, mobile-first journaling app for tracking 7 life categories through the week
(Health, Relationships, Love, Work, Money, Fun, Personal Growth). Log entries as they happen;
a separate AI assistant fetches the week's data via a read-only JSON API and grades you on it.
This app only handles capture and read-out — no grading logic lives here.

## Stack

- Next.js 14 (App Router) on Vercel
- Vercel Postgres for storage (table is created automatically on first request)
- Tailwind CSS
- No user accounts — the whole app (UI + API) is gated by one shared secret

## Local development

```bash
npm install
cp .env.example .env
# set ACCESS_TOKEN, and POSTGRES_URL if you want to hit a real database locally
npm run dev
```

Without `POSTGRES_URL` set, database calls will fail — either link a local dev database
(`vercel env pull` after linking the project) or point `POSTGRES_URL` at any Postgres instance.

## Deploying to Vercel

1. Create a new Vercel project from this repo.
2. Add **Vercel Postgres** storage to the project (Storage tab → Postgres). This wires up
   `POSTGRES_URL` and friends automatically.
3. Set the `ACCESS_TOKEN` environment variable in Project Settings → Environment Variables.
4. Deploy.

After deploy you have two things to hand to the grading AI assistant: the deployed URL and the
token, combined into:

```
https://<app>.vercel.app/api/week-summary?token=XXXX
```

That endpoint is fetchable by URL alone — no login flow — and returns:

```json
{
  "weekStart": "2026-09-07",
  "weekEnd": "2026-09-13",
  "entries": { "health": ["..."], "relationships": [], "...": [] },
  "entryCounts": { "health": 2, "relationships": 0, "...": 0 }
}
```

Pass `start=YYYY-MM-DD` to fetch a specific week; omit it to get the most recent 7 days.

## Using the app

- **Log** tab — pick a category, type a free-text entry, save. Auto-timestamped.
- **Week** tab — this week's entries grouped by category, most recent first, with Prev/Next
  navigation to browse history and inline edit/delete.
- First visit prompts for the access token, which is then stored in an httpOnly cookie.
