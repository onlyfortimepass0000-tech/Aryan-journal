# Weekly Ruthless Check-In

A single-user, mobile-first journaling app for tracking 7 life categories through the week
(Health, Relationships, Love, Work, Money, Fun, Personal Growth). Log entries as they happen;
a separate AI assistant fetches the week's data via a read-only JSON API and grades you on it.
This app only handles capture and read-out — no grading logic lives here.

## Stack

- Next.js 16 (App Router) on Vercel
- Storage: Supabase Postgres, accessed directly over its REST API (no client SDK, no
  extra dependency)
- Tailwind CSS
- No user accounts — the whole app (UI + API) is gated by one shared secret

## Local development

```bash
npm install
cp .env.example .env
# fill in ACCESS_TOKEN, SUPABASE_URL, SUPABASE_ANON_KEY
npm run dev
```

## Deploying to Vercel

1. Create a new Vercel project from this repo. On the "Project Name" field, it must be
   lowercase and can't contain `---` — e.g. `aryan-journal`.
2. In Project Settings → Environment Variables, set:
   - `ACCESS_TOKEN` — any secret string of your choosing; this is your app password
   - `SUPABASE_URL` and `SUPABASE_ANON_KEY` — connection details for the `entries` table
3. Deploy.

No account creation or token generation is needed for storage — the Supabase project and
its `entries` table already exist; you only need to paste the two connection values above
into Vercel once.

After deploy you have two things to hand to the grading AI assistant: the deployed URL and
the `ACCESS_TOKEN`, combined into:

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
