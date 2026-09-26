# Roam

Roam is a phone-first installable PWA for finding nearby food, cafes, places, and events, with a “Surprise me” path for when you want someone else to choose. The interface is written in standard modern CSS; there is no Sass/SCSS build step.

## Stack

- React + Vite + TypeScript for the browser app
- Supabase Auth for accounts and sessions
- Supabase PostgreSQL for profiles and discovery data
- Supabase Edge Functions for server-side API, ranking, and AI work
- No Node/Express application server
- Installable portrait PWA with an app-style bottom navigation and a small offline app shell

The Home screen starts in Kochi and uses sample discovery data until the public anon key, migration, and Edge Functions are configured.

## Run locally

1. Install Node.js 22 or newer and the [Supabase CLI](https://supabase.com/docs/guides/cli).
2. Install app dependencies with `npm install`.
3. Set the Supabase project URL and anon key in `.env.local`. Keep this file on your machine; it is ignored by Git.
4. Start Vite with `npm run dev`.

The app still renders with sample data when Supabase values are not set. `src/lib/supabase.ts` creates the client only when both public values are present.

## Supabase setup

1. Create a Supabase project and copy its project URL and anon key to `.env.local`.
2. Enable the authentication providers you want under **Authentication → Providers**. Use Supabase Auth for passwords, sessions, and recovery; do not store password hashes in an app-owned table.
3. Apply the included discovery schema and demo records with `supabase link --project-ref <project-ref>` followed by `supabase db push`. The migration enables Row Level Security and exposes only published listings to read-only public clients.
4. Keep third-party API keys (maps, places, AI) in Supabase Function secrets, never in `VITE_*` variables:

   ```sh
   supabase secrets set OPENROUTER_API_KEY=... PLACES_API_KEY=...
   ```

5. Deploy both functions with `supabase functions deploy discover` and `supabase functions deploy recommend`.

The `discover` function validates coordinates and calls a PostGIS nearby query. It is public because browsing curated listings does not require an account; the public anon key is the only key used by the browser, and Row Level Security limits reads to published listings. The `recommend` function calls OpenRouter's [`openrouter/free` model](https://openrouter.ai/openrouter/free) only when “Surprise me” is tapped. It receives listing choices and their estimated rupee budgets, but no device coordinates. OpenRouter currently lists the model router's token price as zero; free model availability and rate limits can vary. Provider keys remain in Supabase Function secrets. Precise device location is requested only after the user taps the location control. Until the anon key is configured, the app uses local sample listings and picks randomly.

Demo budgets are approximate Indian rupee amounts per person. Replace them with verified prices before publishing real listings.

## PWA notes

The manifest launches Roam in standalone portrait mode. The production service worker caches the app shell and built assets for a basic offline launch; discovery requests and external photos still need a network connection. In development, open the Vite URL on the phone or use a secure local tunnel, then use the browser's **Add to Home Screen / Install app** action. Safari on iOS exposes this through Share → Add to Home Screen. Kochi's public city-centre coordinates are used as the starting point; precise device location is only requested after the user taps the location control.

## Project layout

```text
src/
  data/              sample Home screen discoveries
  lib/               Supabase browser client
  App.tsx            Home screen and interactions
  styles.css         editorial responsive UI
supabase/
  migrations/         PostGIS schema, public read policy, and sample listings
  functions/discover/ public read-only nearby discovery API function
  config.toml        local Supabase function settings
```

## GitHub

GitHub Pages deployment is configured in `.github/workflows/deploy-pages.yml`. Each push to `main` builds the PWA and publishes it at `https://anand-ca.github.io/roam/`.

```sh
git remote add origin https://github.com/Anand-CA/roam.git
git push -u origin main
```

In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**. The deploy workflow publishes the static app; configure `.env` values as repository Actions variables if the deployed app should call Supabase. Never put service-role or provider secrets in frontend variables.
