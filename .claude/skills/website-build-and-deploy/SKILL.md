---
name: website-build-and-deploy
description: >
  Environment setup, dev server, build gates, and Heroku deploy runbook for the
  personal-website repo (Next.js 16 App Router, deployed to Heroku). Load when
  setting up the project from scratch, creating or fixing .env.local, running
  the dev server, running build/typecheck/lint, deploying to Heroku, adding a
  new env var, adding a new remote image host, or debugging "works locally but
  env var is missing", empty sections caused by missing keys, or deploy/build
  failures. NOT for cache/staleness behavior (use website-caching-and-freshness)
  or in-app bugs and wrong data (use website-debugging-playbook).
---

# Website Build & Deploy Runbook

Personal website of Abhinav Prakash. Next.js 16.2.3 (App Router), React 19.2.4,
TypeScript 5.9, Tailwind v4. Live at https://apwebsite-5c4657230595.herokuapp.com.
All facts below verified against the repo on 2026-07-06.

**House rule (non-negotiable): never commit or push unless the owner explicitly
asks. Deploying IS a push (`git push heroku main`) — never deploy unprompted.**

Heads up: this repo runs a Next.js version newer than most training data. Read
`node_modules/next/dist/docs/` before writing Next-specific code (per AGENTS.md).

## 1. From-scratch setup checklist

1. **Node**: `package.json` has NO `engines` field, so no pinned version.
   Local machine runs Node v24.14.1 (2026-07-06). Anything modern that
   satisfies Next 16 should work; match v24.x to be safe.
2. **Clone** (GitHub is `origin`, Heroku is a second remote you add later):
   ```sh
   git clone https://github.com/abhinavp403/personal_website.git
   cd personal_website
   npm install
   ```
3. **Create `.env.local`** in the repo root with exactly these 10 key NAMES
   (never write values into docs, chat, or commits):
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   NEXT_PUBLIC_FIREBASE_APP_ID=
   SPOTIFY_CLIENT_ID=
   SPOTIFY_CLIENT_SECRET=
   SPOTIFY_REFRESH_TOKEN=
   CRICAPI_KEY=
   ```
   Where each value comes from:
   - **Firebase (6 keys)**: Firebase console → Project settings → your web
     app's config object. These are client-side config, consumed by
     `src/lib/firebase.ts`.
   - **SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET**: Spotify developer
     dashboard (the app registered there).
   - **SPOTIFY_REFRESH_TOKEN**: obtained via this repo's own OAuth callback
     route `src/app/api/spotify/callback/route.ts`. Its `redirect_uri` is
     hardcoded to `http://127.0.0.1:3000/api/spotify/callback`, so run the dev
     server on port 3000, complete the Spotify authorize flow against that
     redirect URI, and the callback exchanges the code for a refresh token.
   - **CRICAPI_KEY**: CricAPI dashboard (cricapi.com account).
4. `npm run dev` and open http://localhost:3000. Confirm the page renders and
   the Interests/sports sections populate (see degradation table if not).

## 2. Env-var degradation table

Derived from actual usage (grep `process.env` — only 4 files read env vars).
Missing keys do NOT crash the build; sections degrade at runtime.

| Missing var(s) | Consumer | What breaks |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_*` (any of 6) | `src/lib/firebase.ts` → `src/components/Interests.tsx` (Firestore reads of `interests/current/movies` and `.../shows`) | Movies & shows lists in the Interests section come up empty |
| `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN` | `src/app/api/spotify/route.ts` (+ callback route uses ID/secret) | Spotify top artists/tracks in Interests section empty |
| `CRICAPI_KEY` | `src/app/api/cricket/route.ts` → `src/components/UpcomingGames.tsx` | Cricket fixtures empty in Upcoming Games |
| (none needed) | `/api/fact`, `/api/wordofday`, `/api/games`, `/api/tennis`, `/api/atp-schedule` | These hit public APIs (ESPN etc.) with no keys — they work without any env vars |

## 3. Dev server

- `npm run dev` → http://localhost:3000 (Next default port; nothing custom).
- Preferred launch: `.claude/launch.json` config named **"personal-website"**
  (npm run dev, port 3000, `autoPort: false`). Ignore the `fifa-dev` and
  `tennis-vite` configs in the same file — they belong to OTHER repos.
- Hot-reload caveat: some routes keep module-level in-memory caches (e.g.
  `memCache` in `src/app/api/wordofday/route.ts`). Editing a route file
  re-evaluates the module, wiping its cache — so "it refetched after my edit"
  is expected, not a bug. See website-caching-and-freshness for full behavior.

## 4. Build & typecheck gates

Run all three before calling any change done:

```sh
npx tsc --noEmit   # typecheck (no standalone script for it in package.json)
npm run lint       # eslint
npm run build      # next build — same command Heroku runs
```

**Baseline recorded 2026-07-06:**
- `npx tsc --noEmit`: **PASS** (exit 0).
- `npm run lint`: **FAILS with pre-existing, accepted debt** — the per-file
  baseline table is recorded in `website-validation-and-qa` §2 (14 problems as
  of 2026-07-06). A lint failure alone does not mean YOUR change is broken.
  The real gate: your change must not ADD new problems beyond that baseline.
- Lint is NOT part of the Heroku build (`heroku-postbuild` runs only
  `next build`), which is why the site deploys despite lint errors.

## 5. Heroku deploy runbook

- **Always run `git remote -v` first.** Expected (verified 2026-07-06):
  ```
  heroku  https://git.heroku.com/apwebsite.git (fetch/push)
  origin  https://github.com/abhinavp403/personal_website.git (fetch/push)
  ```
  If `heroku` is missing, you are probably in the wrong directory or a stale
  copy of the repo (see Traps). Do not "fix" it by re-adding remotes blind.
- **Deploy = `git push heroku main` — ONLY on explicit owner request.**
- What happens on the dyno: Heroku runs `npm install`, then the
  `heroku-postbuild` script (`next build`), then starts via `Procfile`
  (`web: npm start` → `next start -p $PORT`, binding Heroku's assigned port).
- **New env vars: add to Heroku Config Vars BEFORE pushing code that reads
  them** (`heroku config:set KEY=... -a apwebsite`, or the dashboard) — do this
  only as part of an owner-requested deploy; setting prod config inherits the
  same owner gate as the push. Otherwise the first deployed request hits an
  undefined var. `.env.local` is local-only — Heroku never sees it.
- Every deploy (and any dyno restart) resets module-level in-memory caches in
  API routes; expect a cold refetch after deploying.
- Verify after deploy: open https://apwebsite-5c4657230595.herokuapp.com and
  spot-check the env-dependent sections (Spotify, cricket, movies/shows).
  (Note: this URL returned HTTP 503 when checked on 2026-07-06 — presumed
  transient; `curl -sI` it before treating a live-site check as meaningful.)

## 6. Static assets (public/)

`public/` holds demo videos and tennis tournament backdrops referenced by
absolute paths (e.g. `/tennis-calendar.mp4`, `/clay_1000.jpg`). Verify with
`ls -lh public/`. Notable contents (2026-07-06): surface backdrops
(`clay_*`, `grass_*`, `hard_*`, `indoor_hard_*`), demo videos
(`tennis-calendar.mp4` 1.9M, `concert-tracklist.mp4` 3.0M), `profile.jpg`.

**Size trap**: GitHub warns on files over 50MB. Incident on record:
`fifa-world-cup-26.mov` is **56MB** (over the warning line) and
`world-map.mov` is 24MB. Prefer compressed `.mp4` over `.mov` for new demo
videos — the existing mp4s are 1.9–3.0MB and look fine.

## 7. Known traps

- **Never commit `.env.local`.** `.gitignore` line 34 (`.env*`) covers it —
  verified with `git check-ignore -v .env.local`. Keep it that way; check
  again if `.gitignore` is ever touched.
- **`NEXT_PUBLIC_` prefix means shipped to the browser bundle.** Only the 6
  Firebase config keys carry it (Firebase web config is public by design).
  Never put Spotify secrets or CRICAPI_KEY behind `NEXT_PUBLIC_` — they are
  server-only and must stay that way.
- **Stale sibling-folder incident**: `~/Documents/personal-website` was an OLD
  copy of this repo that once confused deploy reasoning (edits landing in one
  copy, deploys reasoned about the other). The live repo is
  `/Users/abhinavp403/Documents/Website`. Antidote: `git remote -v` before any
  deploy thinking — the real repo has the `heroku` remote.
- **`next.config.ts` image allowlist**: `images.remotePatterns` currently
  allows only `images.unsplash.com` and `www.thesportsdb.com`. Any new remote
  host used with `next/image` must be added there or the image 500s at
  runtime. BUT several components (`AIProjects.tsx`, `Interests.tsx`,
  `UpcomingGames.tsx`, `ui/hero-1.tsx`) use plain `<img>` tags, which bypass
  the allowlist entirely — so "the image loads" does not prove the host is
  allowlisted for `next/image` use elsewhere.
- **Spotify refresh-token flow is port-pinned**: the callback route hardcodes
  `redirect_uri: "http://127.0.0.1:3000/api/spotify/callback"`. Re-minting the
  refresh token from a dev server on any other port will fail the OAuth
  exchange.

## Provenance and maintenance

Everything above was read from the repo on **2026-07-06**. Re-verify volatile
facts before trusting them:

- Scripts / engines: `cat package.json` (scripts block, check for `engines`)
- Start command: `cat Procfile`
- Env keys in use: `grep -rn "process.env" src --include="*.ts" --include="*.tsx"`
- Local env file keys (names only): `grep -oE '^[A-Z_]+' .env.local | sort`
- Gitignore coverage: `git check-ignore -v .env.local`
- Remotes: `git remote -v`
- Image allowlist: `cat next.config.ts`
- Large assets: `find public -size +10M -exec ls -lh {} \;`
- Lint baseline: `npm run lint` (compare problem count to the 14 recorded here)
- Typecheck: `npx tsc --noEmit`
