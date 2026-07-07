---
name: website-architecture-contract
description: >-
  The load-bearing design decisions of the personal website (Next.js 16 App
  Router, single-page, Heroku) and WHY the system is shaped this way. Load
  BEFORE any structural change: adding/removing/reordering page sections,
  adding or refactoring an API route, changing how a component fetches data,
  touching src/lib/sports.ts, changing caching, or moving code between
  lib/route/component layers. Also load when asking "why is this code weird?",
  "why is there a route for this?", "can I fetch this from the client?", or
  "can I delete this keyword list?". Triggers: "restructure", "refactor",
  "new API route", "why is it built like this", "server components", "move
  this logic". (For the end-to-end process of adding a new section, load
  website-new-section-campaign — this skill only supplies the structural rules.)
---

# Website Architecture Contract

The invariants and load-bearing decisions of this repo. Violating anything
here has broken the site before or will break it in a way nobody notices
(there are no tests, no CI, no monitoring — see "Known weak points").

**When NOT to use this skill — go to a sibling instead:**

| You need | Load instead |
|---|---|
| Visual idioms, colors, spacing, animation patterns | `website-design-system` |
| Cache/revalidate specifics per route, stale-data debugging | `website-caching-and-freshness` |
| Step-by-step process to add a new page section | `website-new-section-campaign` |
| Commit/push/approval rules, "is this done?" gating | `website-change-control` |

## 1. System shape (verified 2026-07-06)

One Next.js **16.2.3** App Router app (React 19.2.4, TS 5.9, Tailwind v4,
Framer Motion 12), deployed to **Heroku** (`Procfile`: `web: npm start`,
which runs `next start -p $PORT`). Per `AGENTS.md`: this Next.js version
differs from training data — read `node_modules/next/dist/docs/` before
writing framework code.

It is a **single page**: `src/app/page.tsx`. Section components stack
vertically, separated by a `Divider`, all sharing one `FallingPattern`
background below the hero. **Actual render order in page.tsx (2026-07-06):**

1. `SiteNav`
2. `Hero1` (from `ui/hero-1`)
3. `AIProjects` — projects carousel
4. `Interests` — movies/shows (Firestore) + Spotify top artists/tracks
5. `UpcomingGames` — sports fixtures (games + cricket + tennis APIs)
6. `ATPSchedule` — tennis tournament calendar
7. `WordOfDay`
8. `LinkWebsites`
9. Footer (inline in page.tsx)

**Orphans:** `src/components/GeoGame.tsx` and `src/components/FactOfWeek.tsx`
exist but are NOT imported by page.tsx (verified 2026-07-06 via grep — they
appear only in their own files). `src/app/api/fact/route.ts` exists to serve
FactOfWeek and is currently unreferenced by any rendered component. Do not
assume they are dead forever; do not silently delete without owner approval.

**Data flow:** every section is a `"use client"` component that fetches on
mount (`useEffect`) from a same-origin `/api/*` route. The seven routes under
`src/app/api/` — `atp-schedule`, `cricket`, `fact`, `games`, `spotify` (+
`spotify/callback`), `tennis`, `wordofday` — exist for three reasons:

1. **Hide API keys** — `SPOTIFY_CLIENT_ID/SECRET/REFRESH_TOKEN`,
   `CRICAPI_KEY` are read only inside route handlers, never shipped to the
   browser.
2. **Centralize caching** — each route makes the conscious freshness
   decision for its data source (details: `website-caching-and-freshness`).
3. **Normalize third-party shapes** — routes translate ESPN/CricAPI/Spotify
   payloads into small UI-friendly interfaces (`GameEvent`, `ATPTournament`,
   `CricketMatch`, `SpotifyArtist/Track`, `WordOfDay`) so components never
   parse vendor JSON.

**One exception to "everything goes through /api":** `Interests.tsx` reads
Firestore directly from the client via `src/lib/firebase.ts`. That is
deliberate — Firebase web config is public by design (all env vars are
`NEXT_PUBLIC_FIREBASE_*`) and access control lives in Firestore security
rules, which are managed in the Firebase console, NOT in this repo.

## 2. Load-bearing decisions

Each entry: Decision / Why / What breaks if violated.

### 2a. Route-per-data-source, with per-route caching tuned to real change frequency

- **Decision:** every external data source gets its own route, and each
  route's cache lifetime matches how often the data actually changes — from
  `wordofday`'s `force-dynamic` + in-memory date cache at one extreme to
  `fact`'s weekly revalidate at the other, with the sports feeds in between.
  The per-route values and their rationale are cataloged in
  `website-caching-and-freshness` §2 (the source of truth — don't restate
  numbers from memory).
- **Why:** ISR served stale Words of the Day (a daily-changing scrape of
  dictionary.com); the fix was to bypass ISR entirely and cache by calendar
  date in memory. Conversely, a random fact only needs to change weekly, and
  fixtures shift hourly at most. One-size-fits-all caching was tried and
  failed.
- **What breaks:** set a blanket revalidate and WordOfDay shows yesterday's
  word again; remove caching and you burn CricAPI's request quota and hammer
  unofficial ESPN endpoints. Full detail: `website-caching-and-freshness`.

### 2b. Keyword-list classification for tennis surface and tier

- **Decision:** `src/app/api/atp-schedule/route.ts` classifies each
  tournament's surface (`CLAY_KEYWORDS`, `GRASS_KEYWORDS`,
  `INDOOR_HARD_KEYWORDS`, default hard) and tier (`ATP_TIER_1000/500`,
  `WTA_TIER_1000/500`, `TIER_FINALS_KEYWORDS`, default atp-250) by substring
  match against the tournament NAME, plus exclusion lists (`WTA_125_KEYWORDS`,
  `ATP_EXCLUDE_KEYWORDS`).
- **Why:** the ESPN scoreboard endpoint provides **no surface or tier
  fields** (verified 2026-07-06 — the route parses only `name`, `date`,
  `endDate`, `major`, `venue`, `id` from each event). Keyword lists are THE
  mechanism, not a hack awaiting a proper API. The lists are full of branded
  sponsor names ("bnp paribas open", "mutua madrid", "nexo dallas") because
  ESPN names events by sponsor.
- **What breaks:** these lists are **append-only archaeology**. "Cleaning
  up" a weird-looking entry (e.g. "hsbc", "porsche", "femminili") silently
  misclassifies a tournament months later when that event comes around.
  Never prune or dedupe without auditing against the current ATP/WTA
  calendar. See `website-failure-archaeology` before touching them.

### 2c. findNextGame pattern in src/lib/sports.ts

- **Decision:** to find a favourite team's next fixture, fetch a **wide
  date-range scoreboard** from ESPN (default 75 days ahead; 270 for NFL to
  span the off-season; 120 for national teams across four competitions),
  sort events by date ascending, and take the **first non-completed** event
  whose competitors include the team keyword. `getUpcomingGames()` runs all
  team lookups under `Promise.allSettled`, and every helper is wrapped in
  try/catch returning `null`.
- **Why:** ESPN has no "next game for team X" endpoint worth relying on;
  scoreboard-by-date-range is the stable primitive. `allSettled` + null
  filtering means one dead league feed (or ESPN quietly changing one slug)
  drops one card instead of emptying the whole section.
- **What breaks:** replace `allSettled` with `Promise.all` and a single
  failed source kills every fixture. Skip the `completed === true` check and
  finished games render as upcoming (a real past bug class — see
  `website-debugging-playbook`). Narrow the date range and off-season teams
  vanish.

### 2d. Fallback data — the fixtures section must never render blank

- **Decision:** `UpcomingGames.tsx` calls `buildFallbackGames()` (hardcoded
  fixtures, line ~217) when `/api/games` returns an empty `games` array.
  Note: the fallback covers only the games feed; cricket and tennis feeds
  simply contribute nothing when empty.
- **Why:** the section sits mid-page; a blank hole looks broken and there is
  no monitoring to catch it — the owner would find it by looking.
- **What breaks:** remove the fallback and any full ESPN outage (or slug
  change) leaves a visibly dead section in production. Caveat stated
  plainly: the hardcoded fixtures go stale, so fallback mode shows
  plausible-but-wrong data — it is a "never blank" guarantee, not a
  correctness guarantee.

### 2e. Client components + /api, not server-component fetching

- **Decision:** every section component starts with `"use client"` and
  fetches in `useEffect` (verified 2026-07-06 across all of
  `src/components/*.tsx`). `page.tsx` itself is a server component that
  renders no data.
- **Why:** sections are heavy on Framer Motion (client-only anyway), each
  section loads and fails independently, and the page shell renders
  instantly while data streams in per-section. This predates and deliberately
  ignores newer server-fetching idioms.
- **What breaks:** converting a section to server-side fetching couples the
  page render to that source's latency and failure, and changes caching
  semantics (route-level revalidate no longer applies the same way). If you
  believe server fetching is right for a new section, that is an owner
  approval question — see `website-change-control`.

### 2f. Projects carousel: all cards in one grid cell, opacity-only animation

- **Decision:** `AIProjects.tsx` renders **every** project card in the same
  CSS grid cell (`display: grid` container, each card `gridArea: "1 / 1"`)
  and animates only `opacity` between them (commit `6b67764` "Fix project
  carousel layout shift by using CSS grid overlap" — verified 2026-07-06).
- **Why:** mount/unmount transitions collapsed the container height between
  cards, causing the whole page below to jump. Overlapping all cards means
  the container is always as tall as the tallest card.
- **What breaks:** switching to `AnimatePresence` mount/unmount, absolute
  positioning, or per-card conditional rendering reintroduces the layout
  shift. If you must change the animation, keep all cards mounted in one
  grid cell.

### 2g. TeamCircle logo-with-fallback

- **Decision:** `TeamCircle` in `UpcomingGames.tsx` (line ~265) wraps every
  external team logo with `onError={() => setImgErr(true)}` and falls back
  to rendering team initials in a styled circle.
- **Why:** third-party logo URLs (ESPN CDN) rot without notice.
- **What breaks:** rendering a bare `<img>`/`<Image>` for any external image
  eventually shows broken-image icons in production. Any new external image
  in any section needs the same onError fallback pattern. Also note
  `next.config.ts` only whitelists `images.unsplash.com` and
  `www.thesportsdb.com` for `next/image` remote patterns — ESPN logos are
  plain `<img>` tags on purpose.

## 3. Invariants — must hold after every change

- [ ] **Every API route returns valid JSON with an empty-shape fallback on
      error.** Verified 2026-07-06: `atp-schedule` → `{tournaments: []}`,
      `games` → `{games: []}`, `cricket` → `{matches: [], configured}`,
      `tennis` → `{matches: []}`, `spotify` → `{configured, artists: [],
      tracks: []}`, `fact` → hardcoded fallback fact. **Known exception:**
      `wordofday` returns HTTP 500 with `{error}` on parse failure — the
      WordOfDay component must (and does) tolerate that. Don't add a second
      exception.
- [ ] **No secret is imported into client code.** Only `NEXT_PUBLIC_FIREBASE_*`
      appears client-side (in `src/lib/firebase.ts`, which is intentional).
      `SPOTIFY_*` and `CRICAPI_KEY` live exclusively in route handlers.
- [ ] **Every section is independently failable.** A section may show its
      empty/fallback state; it may never throw and take the page down, and
      no section's fetch may block another's.
- [ ] **Every external fetch has a conscious caching decision** — either a
      route-level `revalidate` export, a fetch-level `next.revalidate`,
      `cache: "no-store"`, or the wordofday in-memory pattern. No default
      accidental caching.
- [ ] **`npx tsc --noEmit` passes.** This is the only automated check the
      repo has; run it before declaring any change done.

## 4. Known weak points — stated plainly

- **No tests, no CI, no monitoring.** Breakage is found by the owner
  looking at the site. This raises the bar for every change: verify manually.
- **Unofficial ESPN endpoints** (`site.api.espn.com`) are undocumented and
  can change shape or slugs silently. Same for the Jolpica/Ergast F1 API and
  the dictionary.com HTML scrape in `wordofday` (regex-parsing class names —
  brittle by construction).
- **Keyword lists drift seasonally.** Sponsors change tournament names every
  year; the atp-schedule lists are hardcoded to the 2026 calendar (dates
  `20260101-20261231` are literally in the fetch URLs) and need an annual
  audit.
- **In-memory caches reset on dyno restart.** Heroku cycles dynos roughly
  daily; the wordofday memCache (and any future module-level cache) is
  best-effort, not durable. Never build correctness on it.
- **Firestore security rules live outside the repo** (Firebase console).
  Nothing here versions or reviews them; changing them requires owner
  involvement (see `website-change-control`).
- **Large media in public/ bloats the repo:** `fifa-world-cup-26.mov` is
  56MB and `world-map.mov` 24MB (verified 2026-07-06). Every clone and
  Heroku deploy carries them. Don't add more large binaries.

## 5. Boundaries — where code goes

| Layer | Lives in | Contains | Never contains |
|---|---|---|---|
| Shared data logic | `src/lib/` (`sports.ts`, `firebase.ts`, `utils.ts`) | Reusable fetch/parse helpers, shared TS interfaces, Firebase init | React, JSX, route handlers |
| API route | `src/app/api/<source>/route.ts` | Secrets, caching decisions, third-party fetch + normalization, try/catch → empty shape | UI concerns, imports from components |
| Section component | `src/components/*.tsx` | `"use client"`, useEffect fetch of `/api/*` (or Firestore for Interests), rendering, animation, per-image fallbacks | Secrets, direct third-party API calls |

**Rule: a new external data source always gets a new API route.** Never
fetch a third-party API from the client — it leaks keys, bypasses caching,
hits CORS, and breaks the normalization contract. The only sanctioned
client-side external calls are Firestore (public-by-design config) and
loading image/logo URLs.

## Provenance and maintenance

All facts verified 2026-07-06 by reading the files directly. Before relying
on a volatile fact, re-verify:

- Section order: read `src/app/page.tsx` (the JSX inside `<div className="relative z-10">`).
- Cache values: `grep -rn "revalidate\|force-dynamic\|no-store" src/app/api src/lib`.
- Client-fetch pattern: `grep -l '"use client"' src/components/*.tsx` and `grep -n "fetch(\"/api" src/components/*.tsx`.
- Orphaned components: `grep -rn "GeoGame\|FactOfWeek" src/app src/components`.
- Secrets stay server-side: `grep -rn "process.env" src/components src/lib` (expect only `NEXT_PUBLIC_FIREBASE_*` in firebase.ts).
- Carousel overlap: `grep -n "gridArea" src/components/AIProjects.tsx`; commit `git show 6b67764 --stat`.
- Keyword lists / no-surface-field claim: read `src/app/api/atp-schedule/route.ts` top-to-bottom.
- Media bloat: `ls -lhS public | head`.

If a re-verification contradicts this file, update this file in the same
change — a wrong contract is worse than none.
