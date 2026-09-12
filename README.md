# Weekly Ruthless Check-In

A single-user, mobile-first journaling app for tracking 7 life categories through the week
(Health, Relationships, Love, Work, Money, Fun, Personal Growth). Log entries as they happen;
a separate AI assistant fetches the week's data via a read-only JSON API and grades you on it.
This app only handles capture and read-out — no grading logic lives here.

## Stack

- Next.js 16 (App Router) on Vercel
- **Storage: this GitHub repo itself.** Entries are kept as a single JSON file
  (`data/entries.json`) on a dedicated `data` branch, updated with a commit through the
  GitHub API on every save/edit/delete. No hosted database, nothing to provision — git
  history is the datastore.
- Tailwind CSS
- No user accounts — the whole app (UI + API) is gated by one shared secret

## Why git instead of a database

Vercel Postgres/KV require provisioning a separate storage resource, which was causing
friction. This app is single-user and low-volume (a few short entries a day), so a JSON
file committed to git is plenty — and it comes with free versioning and no external
service to sign up for.

Writes go to a `data` branch rather than `main` so that saving a journal entry doesn't
trigger a Vercel rebuild of the production deployment every time (`vercel.json` explicitly
disables deployments for the `data` branch).

## Local development

```bash
npm install
cp .env.example .env
# fill in ACCESS_TOKEN, GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO
npm run dev
```

## Deploying to Vercel

1. Create a new Vercel project from this repo. When Vercel's "New Project" screen asks for
   a **Project Name**, it must be lowercase and can't contain `---` — e.g. `aryan-journal`.
2. Create a GitHub **personal access token** the app will use to commit entries:
   - GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
   - Repository access: **Only select repositories** → this repo
   - Permissions → Repository permissions → **Contents: Read and write**
   - Generate, copy the token
3. In Vercel Project Settings → Environment Variables, set:
   - `ACCESS_TOKEN` — any secret string, this is your app password
   - `GITHUB_TOKEN` — the token from step 2
   - `GITHUB_OWNER` — your GitHub username/org (e.g. `onlyfortimepass0000-tech`)
   - `GITHUB_REPO` — this repo's name (e.g. `Aryan-journal`)
4. Deploy. The `data` branch and `data/entries.json` are created automatically on first
   save if they don't already exist.

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
