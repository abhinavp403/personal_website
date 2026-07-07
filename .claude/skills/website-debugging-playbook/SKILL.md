---
name: website-debugging-playbook
description: Symptom-to-cause triage playbook for debugging the personal website (Next.js 16 App Router on Heroku). Use when a section shows stale or wrong data, a sports section is empty, a completed game shows as upcoming, a tennis tournament has the wrong surface or tier, Spotify is empty, movies/shows look wrong, animations replay or fire early, or the Heroku build fails but local works. Triggers - "why is this stale", "section is empty", "wrong data", "still shows old", "works locally but not on Heroku", "debug", "not updating".
---

# Website Debugging Playbook

Runbook for diagnosing the real failure modes of this repo (Abhinav Prakash's personal website). Live site: https://apwebsite-5c4657230595.herokuapp.com. Local dev: `npm run dev` on port 3000 (`.claude/launch.json` config `personal-website`).

Core principle: **never guess between cache layers, code bugs, and provider outages — run the discriminating experiment first.** Every symptom below has one.

Definitions used throughout:
- **ISR** (Incremental Static Regeneration): Next.js serves a cached route response and re-generates it in the background after `revalidate` seconds. Stale-while-revalidate means the *first* request after expiry still gets the old payload.
- **Route-level revalidate**: `export const revalidate = N` in a route file. **Fetch-level revalidate**: `fetch(url, { next: { revalidate: N } })`. Both exist in this repo, sometimes in the same route.
- **In-memory cache**: a module-level variable (only `src/app/api/wordofday/route.ts` uses this). Survives across requests in one server process; wiped by dyno restart or dev-server hot reload.

## When NOT to use this skill

- Making or approving a change (favorite teams, providers, caching values, deps) → `website-change-control`
- Past incidents and their full history → `website-failure-archaeology`
- How the system is *supposed* to fit together → `website-architecture-contract`
- Endpoint/field reference for ESPN, CricAPI, jolpi.ca, Spotify → `sports-data-reference`
- Build pipeline and Heroku deploy mechanics → `website-build-and-deploy`
- Designing caching policy (not debugging it) → `website-caching-and-freshness`
- Pre-merge/pre-deploy checks → `website-validation-and-qa`
- Visual styling questions → `website-design-system`
- Adding a whole new section → `website-new-section-campaign`
- Keeping keyword lists / season data current → `website-self-maintaining-data-frontier`
- Ad-hoc exploration of an external API → `website-api-probing-toolkit`

All sibling skills above exist on disk (verify with `ls .claude/skills` if in doubt).

## Symptom → cause → discriminating experiment

| # | Symptom | Most likely cause | Discriminating experiment |
|---|---------|-------------------|---------------------------|
| 1 | Section shows stale data locally but fresh on Heroku (or vice versa) | Layered caching: ISR (route + fetch revalidate) vs wordofday's in-memory cache vs your browser cache | `curl -s "http://localhost:3000/api/<route>?cb=$(date +%s)"` and compare with a browser hard refresh (Cmd+Shift+R) and with `curl` against Heroku. curl bypasses the browser cache; if curl is fresh but the browser is stale, it's browser caching. If curl is stale too, read the route's revalidate config (see "Per-route caching config" below). |
| 2 | A completed game shows as "upcoming" in Upcoming Fixtures | ESPN scoreboard `dates=` range starts *today*, so games played earlier today are still in the payload; code must skip `status.type.completed === true` (fix: commit `86bf9fe` in `src/lib/sports.ts`) | Hit the ESPN URL directly (see Experiments §2) and check `.events[].status.type.completed` for the offending event. If `true` and the site still shows it, the completed-check regressed — grep `completed === true` in `src/lib/sports.ts` (present in `findNextGame`, `findNextNFLGame`, `findNextNationalGame`). |
| 3 | Tennis tournament shows wrong surface or tier | Keyword-list miss in `src/app/api/atp-schedule/route.ts`. ESPN uses **branded** names ("Terra Wortmann Open"), not city names ("Halle") — fix: commit `104d400` | `curl -s "https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard?dates=20260101-20261231&limit=100" \| jq -r '.events[].name'` and check whether the exact branded name matches any entry in `GRASS_KEYWORDS` / `CLAY_KEYWORDS` / `INDOOR_HARD_KEYWORDS` / the tier lists. Matching is lowercase-substring (`getSurface`, `getTier`). |
| 4 | A sports section (or one team) is empty | ESPN league slug returns 0 events out of season — not a code bug. E.g. `uefa.nations` and `conmebol.america` had 0 events May–Aug 2026; only `fifa.world` was active | For each slug in `src/lib/sports.ts` (`fifa.world`, `uefa.nations`, `conmebol.america`, `concacaf.gold`, `eng.1`, `esp.1`, `usa.1`): `curl -s "https://site.api.espn.com/apis/site/v2/sports/soccer/<slug>/scoreboard?dates=<range>&limit=100" \| jq '.events \| length'`. 0 events = out of season; non-zero but empty section = filtering bug in `sports.ts`. |
| 5 | Spotify section empty or stale | Two very different causes: (a) refresh-token flow failing (revoked token, wrong Config Vars) → route returns `{ error: "Failed to get access token" }`; (b) route-level `revalidate = 3600` → up to 1h stale is *normal* | `curl -s http://localhost:3000/api/spotify \| jq`. `configured: false` = env vars missing/placeholder. `error` field present = token flow broken (check `SPOTIFY_CLIENT_ID/SECRET/REFRESH_TOKEN` in `.env.local` locally, `heroku config` on prod). Data present but old = just ISR; wait out the window, or ask the owner whether to redeploy — deploy is an owner-gated push (`website-change-control`). |
| 6 | Movies/Shows animation triggers too early, or replays on scroll | `Interests.tsx` IntersectionObserver wiring. Historical bug: observers accumulated because `setup()`'s returned cleanup was never captured, and the wrong element was observed. Also a 15-min localStorage gate (`entertainment_intro_ts`) suppresses replays | In devtools: `localStorage.removeItem("entertainment_intro_ts")` then reload to force the animation. If it fires before the Spotify card is visible, check what the observer targets (`spotifyRef.current` with `#interests` fallback) and threshold (0.15) in `src/components/Interests.tsx`. If it replays every scroll, check the `observer.disconnect()` on trigger and the effect deps `[shouldPlay, spotifyConfigured]`. |
| 7 | Movies/Shows section shows wrong/placeholder titles (Dune, Shōgun, etc.) | Firestore read failing → component silently falls back to `fallbackData` hardcoded in `Interests.tsx`. Historical incident: Firebase security rules had a time-limited `allow read` that expired | Browser console on the page: a Firestore permission error means rules likely expired. **Changing Firebase rules is an owner-gated action** (`website-change-control`) — report the evidence and the proposed rule (`allow read: if true; allow write: if false` was the past fix), then wait for explicit owner approval. No error but fallback data = check `NEXT_PUBLIC_FIREBASE_*` env vars (they're inlined at **build** time, so Heroku Config Vars must be set *before* the build). |
| 8 | Build fails on Heroku but `npm run dev` works locally | Dev mode skips full type-check/prerender. Heroku runs `heroku-postbuild: next build` (see `package.json`), which does both. Also: missing Config Vars at build time, or lockfile drift | Reproduce locally with `npm run build`. If local build passes but Heroku fails, diff env: `heroku config` vs `.env.local`, and check Heroku build log for the failing step (`git push heroku main` output, or `heroku builds` if the plugin is installed). |
| 9 | Word of the Day shows yesterday's word | Historically ISR stale-while-revalidate served the old word after midnight; fixed in `e4cdb11` with `force-dynamic` + in-memory date-keyed cache. If it regresses now, suspect the `memCache` date key or Dictionary.com HTML shape change | `curl -s http://localhost:3000/api/wordofday \| jq '.date, .word'`. A 500 with a parse error = Dictionary.com changed their `wotd-entry-*` CSS classes (provider change → see Escalation). Correct word from curl but stale in browser = client cache. |

### Per-route caching config

One-line orientation (as of 2026-07-06): wordofday is `force-dynamic` + an in-memory
UTC-date cache; cricket revalidates every 30 min; games/spotify/tennis hourly;
atp-schedule caches its ESPN fetches 24h (handler runs per request); fact weekly —
"stale" fact/atp data for hours or days is often by design. **The authoritative
per-route catalog (directives, why each value, worst-case staleness) lives in
`website-caching-and-freshness` §2 — read it before reasoning about any route's cache.**

## Historical bugs — quick reference (full stories: `website-failure-archaeology`)

One line each; the incident detail, evidence, and do-not-retry status live in `website-failure-archaeology` — read it before re-investigating any of these.

- **Completed games shown as upcoming — `86bf9fe` (2026-05-10).** ESPN date-range queries include already-played events; fix skips `status.type.completed === true` in the `findNext*` finders in `src/lib/sports.ts`.
- **Wrong tournament surface — `104d400` (2026-06-10).** ESPN uses sponsor-branded names ("Terra Wortmann Open" = Halle) that city-name keywords never matched; fix added brand keywords. Triage move: diff the ESPN `.events[].name` string against the keyword lists character-for-character.
- **Stale Word of the Day — `e4cdb11` (2026-05-15).** ISR stale-while-revalidate served yesterday's word after midnight; fix is `force-dynamic` + a `todayUTC()`-keyed in-memory cache.
- **Animation replay / early trigger (Interests.tsx, no single fix commit).** Observer cleanup discarded + `#interests` fallback target; current state is deliberate — owner rejected a re-fix (archaeology entry 7).
- **Movies/Shows fell back to placeholders (Firebase rules, no fix commit).** Console-default time-limited `allow read` expired; fixed in the Firebase Console, never visible in git (archaeology entry 8).

## Discriminating experiments — exact commands

### 1. Hit each API route locally

Start the dev server first (`npm run dev`, or the `personal-website` launch config). Then:

```bash
curl -s http://localhost:3000/api/games        | jq '.games | length, .[0]'
curl -s http://localhost:3000/api/cricket      | jq '.configured, (.matches | length)'
curl -s http://localhost:3000/api/tennis       | jq '.matches | length'
curl -s http://localhost:3000/api/atp-schedule | jq '.tournaments | length, ([.tournaments[] | select(.surface=="grass")] | length)'
curl -s http://localhost:3000/api/spotify      | jq '{configured, error, artists: (.artists|length), tracks: (.tracks|length)}'
curl -s http://localhost:3000/api/wordofday    | jq '{word, date}'
curl -s http://localhost:3000/api/fact         | jq
```

Interpretation:
- Every route returns 200 with an empty payload on failure (`{ games: [] }`, `{ tournaments: [] }`, ...) — errors are swallowed by design, so **an empty array is a symptom, not an error message**. Exception: `/api/wordofday` returns a real 500 with `{ error }`.
- `configured: false` (cricket, spotify) = missing env vars, stop debugging code.
- Cache-bust with a throwaway query param when you suspect a stale cached response: `curl -s "http://localhost:3000/api/games?cb=$(date +%s)"`. Note this busts *browser/CDN-style* caching; Next's data cache keys on the upstream fetch URL, so it does NOT bust fetch-level `revalidate` — for that, restart the server (dev) or redeploy (Heroku).

### 2. Test an ESPN endpoint directly

ESPN's unofficial site API needs no key. Date params are `YYYYMMDD-YYYYMMDD` ranges. Real example (EPL scoreboard, next ~75 days, mirroring `dateRange()` in `src/lib/sports.ts`):

```bash
curl -s "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard?dates=20260706-20260919&limit=200" \
  | jq '{league: .leagues[0].abbreviation, count: (.events | length), first: .events[0] | {name, date, completed: .status.type.completed}}'
```

Swap the path for other feeds used by this repo: `soccer/fifa.world`, `soccer/uefa.nations`, `soccer/conmebol.america`, `soccer/concacaf.gold`, `soccer/esp.1`, `soccer/usa.1`, `basketball/nba`, `football/nfl`, `tennis/atp`, `tennis/wta`. Key checks: `.events | length` (0 = out of season), `.events[].status.type.completed`, `.events[].name` (branded tournament names), `.events[].competitions[0].competitors[].team.displayName` (what team-keyword matching runs against).

### 3. Compare deployed Heroku vs local

```bash
curl -s https://apwebsite-5c4657230595.herokuapp.com/api/games | jq '.games | length' 
curl -s http://localhost:3000/api/games                        | jq '.games | length'
```

If they differ: (a) Heroku is serving an ISR-cached response from before your change — wait out the revalidate window, or ask the owner whether to redeploy (deploy = `git push heroku main`, an owner-gated action per `website-change-control`); (b) env vars differ (`heroku config` vs `.env.local`); (c) local has uncommitted changes Heroku never got (`git status`, `git log origin/main..HEAD`). Remember Heroku dynos restart roughly daily, which wipes both the in-memory wordofday cache and the ISR cache — "it fixed itself overnight" usually means a dyno cycle, not a real fix.

Note: the live site returned HTTP 503 when checked on 2026-07-06 (Heroku "Application Error", presumed transient) — `curl -sI https://apwebsite-5c4657230595.herokuapp.com | head -1` before relying on any live-site comparison.

## Traps (each has cost real time)

1. **Next.js caching is layered.** A route can have `export const revalidate` (route segment), `next: { revalidate }` on each fetch (data cache), AND the browser caching the client-side `fetch("/api/...")` response. Fixing one layer while another still serves stale looks like "my fix didn't work." Always identify which layer with curl-vs-browser before editing code.
2. **`npm run dev` hot reload resets module state.** wordofday's `memCache` is a module-level variable — every file edit re-evaluates the module and wipes it. You cannot reproduce "stale in-memory cache" bugs under active editing; use `npm run build && npm start` (set `PORT=3000` since `start` uses `-p $PORT`) to test production behavior.
3. **Dev and prod cache differently.** In dev, ISR/route caching largely doesn't apply, so revalidate bugs only manifest on Heroku or under `next build && next start`. "Works locally" is weak evidence for caching bugs.
4. **ESPN date params are `YYYYMMDD-YYYYMMDD` ranges** (e.g. `dates=20260706-20260919`), not ISO dates. A malformed range doesn't error — it just returns a default (often near-empty) window, which presents as symptom #4.
5. **This Next.js (16.2.3) differs from training data.** Per `AGENTS.md`, read `node_modules/next/dist/docs/` (subdirs `01-app`, `02-pages`, `03-architecture`) before assuming any caching or routing API behaves the way you remember. Verify before you "fix" behavior that is actually correct.
6. **Empty payloads are silent by design.** Nearly every route catch-block returns an empty array with status 200. Don't wait for a 500 that will never come — inspect payload contents.
7. **`NEXT_PUBLIC_*` vars are baked in at build time.** Setting a Firebase Config Var on Heroku after a deploy does nothing until the next build.
8. **The atp-schedule year is hardcoded** (`dates=20260101-20261231` as of 2026-07-06). In January 2027 the section will quietly show last year — that's data drift, not a caching bug.

## Escalation

If the discriminating experiment shows the **provider** changed — ESPN renamed fields or event names, Dictionary.com changed its `wotd-entry-*` HTML classes, CricAPI changed its response envelope, Spotify revoked the token — the code fix is a **change to an external contract**, and provider changes need owner approval. Stop, write down the evidence (exact curl output before/after), and follow `website-change-control` before patching. Same rule for anything that would change favorite teams, keyword lists, revalidate values, or dependencies as a side effect of the "fix."

## Provenance and maintenance

All facts verified against the repo on 2026-07-06. One-line re-verification commands:

- Caching config table: `grep -rn "revalidate\|force-dynamic\|no-store" src/app/api src/lib`
- Fix commits exist and say what this doc claims: `git show --stat 86bf9fe 104d400 e4cdb11`
- Completed-game guard still present: `grep -n "completed === true" src/lib/sports.ts`
- Surface/tier keyword lists: `grep -n "GRASS_KEYWORDS\|CLAY_KEYWORDS\|INDOOR_HARD" src/app/api/atp-schedule/route.ts`
- League slugs and date ranges: `grep -n "fifa.world\|dateRange" src/lib/sports.ts`
- Hardcoded atp-schedule year: `grep -n "dates=2026" src/app/api/atp-schedule/route.ts`
- Env var names: `grep -o '^[A-Z_]*=' .env.local` (locally) / `heroku config` (prod)
- Heroku entrypoints: `cat Procfile && grep -n '"start"\|heroku-postbuild' package.json`
- Live URL still responds: `curl -sI https://apwebsite-5c4657230595.herokuapp.com | head -1`
- Sibling skills that actually exist: `ls .claude/skills`

Update this file when: a new API route is added, a revalidate value changes, the atp-schedule hardcoded year rolls over, a listed sibling skill is created, or a new incident earns a row in the triage table.
