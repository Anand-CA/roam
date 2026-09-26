# Roam

Roam is a local discovery PWA foundation: a considered shortlist of nearby food, cafes, places, and events, with a “Surprise me” path for when you want someone else to choose.

## Stack

- React + Vite + TypeScript for the browser app
- Supabase Auth for accounts and sessions
- Supabase PostgreSQL for profiles and discovery data
- Supabase Edge Functions for protected API, ranking, and AI work
- No Node/Express application server

The current Home screen uses sample discovery data so the interface works before a Supabase project or data source is configured.

## Run locally

1. Install Node.js 22 or newer and the [Supabase CLI](https://supabase.com/docs/guides/cli).
2. Install app dependencies with `npm install`.
3. Copy `.env.example` to `.env.local` and set the Supabase project URL and anon key.
4. Start Vite with `npm run dev`.

The app still renders with sample data when Supabase values are not set. `src/lib/supabase.ts` creates the client only when both public values are present.

## Supabase setup

1. Create a Supabase project and copy its project URL and anon key to `.env.local`.
2. Enable the authentication providers you want under **Authentication → Providers**. Use Supabase Auth for passwords, sessions, and recovery; do not store password hashes in an app-owned table.
3. Add tables for profiles and discovery records when the data model is ready. Enable Row Level Security and add policies before exposing rows to the browser.
4. Keep third-party API keys (maps, places, AI) in Supabase Function secrets, never in `VITE_*` variables:

   ```sh
   supabase secrets set PLACES_API_KEY=... AI_API_KEY=...
   ```

5. Serve the included function locally with `supabase start` and `supabase functions serve discover --env-file supabase/.env.local`; deploy with `supabase functions deploy discover`.

The `discover` function verifies the caller’s Supabase Auth session and is the backend seam for a PostGIS nearby query and future ranking/AI logic. Its current response is intentionally empty until a schema and data provider are chosen.

## Project layout

```text
src/
  data/              sample Home screen discoveries
  lib/               Supabase browser client
  App.tsx            Home screen and interactions
  styles.css         editorial responsive UI
supabase/
  functions/discover/ authenticated discovery API function
  config.toml        local Supabase function settings
```

## GitHub

This workspace is initialized as a local Git repository. Create a GitHub repository named `roam`, add it as `origin`, then push the current branch:

```sh
git remote add origin https://github.com/<your-user>/roam.git
git push -u origin main
```
