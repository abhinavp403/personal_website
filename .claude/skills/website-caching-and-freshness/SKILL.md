---
name: website-caching-and-freshness
description: >-
  Complete catalog of every cache-POLICY decision in the personal-website repo
  (Next.js 16 App Router on Heroku) — what each API route caches, for how long,
  why, and how to verify freshness after a caching change. Load when adding or
  changing ANY fetch call or API route, choosing a revalidate value for a new
  data source, understanding WHY a route caches the way it does, or touching
  `export const revalidate`, `next:{revalidate}`, `force-dynamic`, or
  `cache:"no-store"`. When NOT to use — for stale-data SYMPTOMS ("still shows
  old data", "not updating") and any symptom-first triage of a broken/empty
  section, load website-debugging-playbook FIRST (it points back here once
  caching is implicated); for design rationale and architectural contracts,
  load website-architecture-contract.
---

# Website Caching and Freshness

Caching IS the configuration axis of this codebase. Every one of the seven API routes has a deliberate caching strategy, and caching staleness is the #1 historical bug class here (see Incidents). All facts below verified against source on 2026-07-06 (Next.js 16.2.3).

## 1. Caching semantics in THIS Next.js version (16.2.3)

**Do not trust training-data Next.js knowledge.** This repo pins Next 16.2.3, and AGENTS.md requires reading `node_modules/next/dist/docs/` first. This section is distilled from these doc files (read them again if anything below seems off):

- `node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md` — the model this repo uses
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/fetch.md` — fetch `cache` / `next.revalidate` options
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` — Route Handler caching
- `node_modules/next/dist/docs/01-app/02-guides/how-revalidation-works.md` — stale-while-revalidate internals
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/index.md` — segment config version history

**Which caching model applies:** Next 16 introduced Cache Components (`use cache`, `cacheLife`, `cacheTag`) behind a `cacheComponents` flag — and when that flag is on, `export const dynamic` and `export const revalidate` are REMOVED. This repo's `next.config.ts` does NOT enable `cacheComponents` (verified 2026-07-06), so the **"previous model"** (`caching-without-cache-components.md`) is authoritative here. If someone enables `cacheComponents`, every directive in this file breaks and this skill must be rewritten.

Key semantics under the previous model:

- **Route Handlers are NOT cached by default** (v15+ behavior change). A plain `GET` handler with no config runs on every request. Only `GET` can opt into caching; other methods never cache.
- **`fetch` is NOT cached by default** ("auto no cache"). Caching is opt-in per fetch via `cache: 'force-cache'` or `next: { revalidate: N }`.
- **`export const revalidate = N` (route-level)** — makes the route's *response* cacheable ISR-style, regenerated at most every N seconds. It sets the *default* for fetches in the route but does NOT override a fetch's own `revalidate`. The lowest revalidate across the route wins for the whole route's regeneration interval.
- **`next: { revalidate: N }` (fetch-level)** — caches that single upstream response in Next's data cache for N seconds, keyed by URL + options. If lower than the route default, it *lowers the whole route's* revalidation interval.
- **`export const dynamic = "force-dynamic"`** — route output is never cached; handler runs on every request. Equivalent to setting every fetch to `{ cache: 'no-store', next: { revalidate: 0 } }` — so any fetch inside that you DO want cached must be handled another way (this repo uses a module-level in-memory cache, see wordofday).
- **`cache: "no-store"` (fetch-level)** — that fetch hits the origin every time. Note: `{ revalidate: 3600, cache: 'no-store' }` together is invalid — BOTH are ignored (dev prints a warning).
- **Dev mode never caches route output** — pages/handlers are always rendered on demand in `next dev`, and a browser hard-refresh (`cache-control: no-cache`) makes Next ignore fetch cache options entirely. **Caching bugs are invisible locally; they only reproduce in `next build && next start` or on Heroku.**

### Stale-while-revalidate — read this before choosing ISR

Time-based revalidation is **stale-while-revalidate** (`how-revalidation-works.md`): when a cached entry's age exceeds `revalidate`, the next request is served the STALE content immediately while regeneration runs in the background. Fresh content arrives only on a *subsequent* request. On a low-traffic personal site, "the request after expiry" may be hours later — so worst-case staleness is roughly `revalidate` + the gap until the second visitor.

**This exact behavior caused the word-of-day bug (e4cdb11):** `revalidate = 21600` meant the first visitor after midnight got *yesterday's word* (stale response served while regeneration ran). ISR can never guarantee "correct at a calendar boundary." See §5.

## 2. THE CATALOG — every route's caching decision

All routes live under `src/app/api/`. Client components call them with plain `fetch("/api/...")` (§3).

| Route (path) | Directive(s) | Effective behavior | Why this value | Staleness worst-case |
|---|---|---|---|---|
| **atp-schedule** `src/app/api/atp-schedule/route.ts` | No route config; 2 ESPN fetches (ATP + WTA full-2026 scoreboards) each `next:{revalidate:86400}` | Handler runs every request; upstream ESPN data cached 24h in fetch data cache | Tournament calendar changes ~never mid-season; ESPN is rate-limit-shy. Handler-per-request means `getStatus()` (past/live/upcoming via `Date.now()`) is always computed fresh even on day-old data — deliberate | Tournament list ≤24h + SWR gap; status labels always current |
| **cricket** `src/app/api/cricket/route.ts` | `export const revalidate = 1800` + 2 CricAPI fetches `next:{revalidate:1800}` | Route response cached 30 min ISR; upstream cached 30 min | CricAPI has a hard daily call quota on the free tier; 30 min balances quota vs. fixture freshness | ~30 min + one stale SWR hit; a just-started match may show "Upcoming" ≤~35 min |
| **fact** `src/app/api/fact/route.ts` | `export const revalidate = 604800` + fetch `next:{revalidate:604800}` | Route + upstream cached 1 week | It's "Fact of the WEEK" by design — staleness is the feature | 1 week + SWR gap, by design |
| **games** `src/app/api/games/route.ts` | `export const revalidate = 3600`; all fetches live in `src/lib/sports.ts` with `next:{revalidate:3600}` (ESPN soccer/NBA/NFL/national scoreboards + jolpi.ca F1) | Route response cached 1h; each upstream cached 1h | Fixtures shift rarely intra-day; ESPN scoreboard URLs embed a `dateRange()` that rolls the cache key forward daily anyway | ≤1h + SWR; a game that just ended can appear "upcoming" up to ~1h (completed-event *filtering* is a logic concern — see 86bf9fe in §7) |
| **spotify** `src/app/api/spotify/route.ts` | `export const revalidate = 3600`; token POST `cache:"no-store"`; top-artists/tracks GETs `next:{revalidate:3600}` | Route cached 1h; **token request NEVER cached** | Top artists/tracks drift slowly; Spotify API is rate-limited. Tokens must never cache — a cached expired `access_token` = silent empty section. (POSTs aren't cached anyway; the explicit `no-store` is belt-and-braces and MUST stay) | Listening data ≤1h + SWR — fine |
| **spotify/callback** `src/app/api/spotify/callback/route.ts` | No route config; token-exchange POST `cache:"no-store"` | Runs per request | One-time local OAuth helper to mint a refresh token; caching would be a bug | N/A (dev-only utility) |
| **tennis** `src/app/api/tennis/route.ts` | No route config; ESPN fetch `next:{revalidate:3600}` | Handler per request; upstream cached 1h — and the URL embeds `dateRange()` (today → +90d), so the cache key rolls over at UTC midnight | Match schedules within a tournament change hourly-ish (rain delays); completed-match filtering (`state === "post"`) runs in the handler every request | ≤1h + SWR for match data; date window always correct |
| **wordofday** `src/app/api/wordofday/route.ts` | `export const dynamic = "force-dynamic"` + **module-level in-memory cache keyed on date string** + upstream fetch `cache:"no-store"` | Handler runs EVERY request. It checks `memCache` (`let memCache: { date, data } \| null` at module scope): if `memCache.date === todayUTC()` serve from memory, else scrape dictionary.com fresh (no-store) and overwrite `memCache` | ISR failed here (e4cdb11): SWR served yesterday's word to the first visitor after midnight. The date-keyed check makes "is this today's word?" an explicit comparison, not a TTL guess. `force-dynamic` is required so the route *output* is never cached and the date check actually executes | Zero across midnight (UTC). Cache is per-process: each Heroku dyno fetches once/day; dyno restart just re-fetches — harmless |

**Invariants:** never re-add ISR (`export const revalidate`) to wordofday; never cache the Spotify token request; keep route-level and fetch-level revalidate values equal where both exist (cricket 1800/1800, fact 604800/604800, spotify+games 3600/3600) — a mismatched lower fetch value silently drags the whole route down to it.

## 3. Client-side layer

Every consumer is a `"use client"` component fetching in `useEffect` with **plain `fetch("/api/...")` — no cache options anywhere** (verified in all five):

- `src/components/UpcomingGames.tsx` → `/api/games`, `/api/cricket`, `/api/tennis` (Promise.all, ~line 450)
- `src/components/Interests.tsx` → `/api/spotify` (~line 215)
- `src/components/WordOfDay.tsx` → `/api/wordofday`
- `src/components/ATPSchedule.tsx` → `/api/atp-schedule`
- `src/components/FactOfWeek.tsx` → `/api/fact`

Implications for "I still see old data" reports:

- Data loads once per page load; there is no polling. A tab left open overnight shows last night's data until refreshed — that is not a caching bug.
- Plain client `fetch` obeys the browser HTTP cache, which is governed by whatever `Cache-Control` header the route responds with. ISR routes advertise `s-maxage`-style directives aimed at shared caches, not the browser — but don't argue from memory: check with `curl -sI` (§6) and reproduce in an incognito window before blaming the server.
- If incognito/hard-refresh shows fresh data but a normal tab doesn't → browser layer. If curl to the deployed route shows stale JSON → server layer (§4).

## 4. Layered-cache mental model

Data passes through up to four caches. Diagnose stale data by finding WHICH layer is serving old bytes:

```
third-party API  →  Next fetch data cache  →  route response cache (ISR)  →  browser
   (ESPN etc.)      (next:{revalidate:N})     (export const revalidate)      (HTTP cache / open tab)
```

Discriminating test per layer, outermost first:

1. **Browser:** hard-refresh / incognito, or `curl` the route with a cache-buster: `curl -s "https://<app>.herokuapp.com/api/games?cb=$(date +%s)" | head -c 400`. Fresh via curl but stale in the tab → browser/tab layer.
2. **Route response cache:** compare local `npm run dev` (never caches route output) against Heroku. Fresh locally, stale on Heroku → route-level ISR or fetch cache on the deployed build.
3. **Next fetch data cache:** persists in `.next/` per build. Locally: `rm -rf .next && npm run build && npm start`, re-curl. On Heroku a redeploy rebuilds it — but a redeploy is `git push heroku main`, an **owner-gated action** (`website-change-control`); diagnose locally, don't redeploy to test.
4. **In-memory caches (wordofday `memCache`):** per-process, so restart clears it — locally kill/restart the server. On Heroku that's `heroku restart`, which is **prod-affecting (drops in-flight requests, wipes every dyno's caches) — ask the owner first**; usually you can just wait, since Heroku dynos restart daily on their own (and each dyno has its OWN copy).
5. **Third-party API itself stale:** curl the upstream URL directly (ESPN/CricAPI/dictionary.com URLs are in the route files). If upstream is stale, no cache setting will help — and remember "stale-looking" data can be a logic bug, not caching at all (86bf9fe, §7).

## 5. Decision guide for NEW data sources

Pick by how the data changes:

- **Yearly/monthly schedule data** (tournament calendars, season fixtures) → `next:{revalidate:86400}` on the fetch, no route config, compute time-sensitive labels (live/past/upcoming) in the handler per request. Model: atp-schedule.
- **Hourly-ish data** (scores, fixtures, listening history) → route `export const revalidate = 3600` + matching fetch `next:{revalidate:3600}`. Model: games/spotify. Rate-limited APIs with quotas: pick the largest interval the UX tolerates (cricket uses 1800 against a daily quota).
- **Must be correct at a calendar boundary** (daily word, "today's" fixtures) → `export const dynamic = "force-dynamic"` + module-level cache keyed on the date string + upstream `cache:"no-store"`. **NEVER plain ISR** — stale-while-revalidate structurally serves yesterday's data to the first visitor after the boundary (the word-of-day lesson, e4cdb11). Model: wordofday.
- **Secrets/tokens/OAuth exchanges** → `cache:"no-store"`, always, even on POSTs where it's technically redundant. Model: spotify token fetch.
- **In-memory caches**: fine on Heroku for "re-fetch is cheap and idempotent" cases, but they are per-process and vanish on deploy, daily dyno cycling, and dev hot-reload. Never assume persistence; never use one for anything that must survive a restart or be consistent across dynos.
- If both route-level and fetch-level values are used, **keep them equal** — the lowest value silently wins for the whole route.

## 6. Freshness verification runbook

Prove a route serves fresh data — run after any caching change:

```bash
# 1. Production-mode local build (dev mode never caches — it proves nothing)
rm -rf .next && npm run build && npm start &

# 2. Hit the route twice; compare bodies and headers
curl -s  http://localhost:3000/api/wordofday | head -c 300; echo
curl -sI http://localhost:3000/api/wordofday | grep -i 'cache-control\|x-nextjs'

# 3. For ISR routes: confirm the response updates after the window
#    (or just confirm Cache-Control matches the intended revalidate)
curl -sI http://localhost:3000/api/cricket | grep -i cache-control

# 4. For wordofday specifically: restart the server (clears memCache),
#    curl again, confirm word matches https://www.dictionary.com/word-of-the-day

# 5. On Heroku — cache-busted read, then compare against upstream truth.
#    PROD-AFFECTING / OWNER-GATED: `heroku restart` drops in-flight requests and
#    wipes prod caches — only run it if the owner has explicitly approved.
curl -s "https://<app>.herokuapp.com/api/games?cb=$(date +%s)" | head -c 400
# [owner-approved only] heroku restart && sleep 20 && curl -s "https://<app>.herokuapp.com/api/wordofday"

# 6. Confirm upstream itself is fresh before blaming any cache
curl -s "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard" | head -c 300
```

Steps 1–4 (local production build) are the default verification path. Note: the live
site returned HTTP 503 on 2026-07-06 (presumed transient) — `curl -sI` the base URL
before relying on any live-Heroku check.

## 7. Incidents (verified commit hashes; authoritative records in `website-failure-archaeology`, entries 1–2)

- **e4cdb11** — "Fix Word of the Day showing stale word after midnight" (2026-05-15). Was `export const revalidate = 21600` + fetch `next:{revalidate:3600}`. SWR served yesterday's word to the first post-midnight visitor while regeneration ran in the background. Fix: `force-dynamic` + date-keyed `memCache` + upstream `no-store`. Lesson: ISR cannot express "correct at a calendar boundary."
- **86bf9fe** — "Fix completed games showing as upcoming in sports section" (2026-05-10). Looked exactly like staleness, but was a **LOGIC bug**: data was perfectly fresh; `findNextGame`/`findNextNFLGame` in `src/lib/sports.ts` just didn't skip events with `status.type.completed === true`. Fix was a 4-line filter, zero caching changes. Lesson: "stale-looking" ≠ always caching — before touching any revalidate value, curl the route and check whether the raw response already contains the wrong item.

## Provenance and maintenance

Written 2026-07-06 by reading every file it cites: all seven route files under `src/app/api/`, `src/lib/sports.ts`, the five client components in §3, `next.config.ts`, the five Next 16.2.3 doc files listed in §1, and `git show` of both incident commits. No value in the catalog is from memory.

Re-verify the entire catalog with one grep (run from repo root; every caching directive in the codebase should appear, and §2 must match):

```bash
grep -rnE 'export const (revalidate|dynamic)|revalidate: *[0-9]+|cache: *"no-store"' src/app/api src/lib/sports.ts
```

Also re-check on any Next.js upgrade: `ls node_modules/next/dist/docs/01-app/02-guides/ | grep cach` and confirm `cacheComponents` is still absent from `next.config.ts` — if it appears, this skill's semantics section is obsolete.
