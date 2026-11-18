---
name: website-validation-and-qa
description: >-
  Evidence standards, verification procedures, and golden checks for the
  personal-website repo (Next.js 16 App Router). Load BEFORE declaring any
  change "done", whenever asked to verify, test, QA, or "check that it works",
  before reporting a fix as complete, and whenever tempted to add a test
  framework (don't — the no-tests setup is deliberate). Covers the static gates
  (tsc / lint / build) with today's recorded baseline, per-change-type
  verification steps, section-by-section golden checklists, and the API-route
  smoke suite. When NOT to use — diagnosing WHY something is broken:
  website-debugging-playbook; commit/push rules, owner-approval gates, and
  "is this ready to commit": website-change-control.
---

# Website Validation & QA

How to prove a change works on this site, what counts as evidence, and the golden
checks per section. This repo has **no unit tests and no CI — deliberately**.
Quality is enforced by: TypeScript compile, ESLint, browser verification, and
owner review. Proposing a test framework (Jest, Vitest, Playwright, etc.) is a
**scope change that needs explicit owner approval** — never add one unasked.

House rules that bind everything below:
- Visual changes must be **verified in the browser AND reviewed by the owner** before "done".
- **Never commit unless explicitly asked** (that gate lives in `website-change-control`).

## 1. Evidence hierarchy (strongest → weakest)

1. **Owner confirms in the browser.** The only acceptance for visual changes.
2. **Agent verifies rendered output** — snapshot / screenshot / DOM inspection of
   `localhost:3000` via the preview tooling (`.claude/launch.json` has a
   `personal-website` config → `npm run dev` on port 3000).
3. **curl of an API route** showing correct JSON shape and fresh values.
4. **`npx tsc --noEmit` clean** — proves it compiles, not that it works.
5. **"The code looks right."** — **NOT evidence. Never ship on it.** If you only
   read the code, say exactly that: "I did not verify this in the browser."

Each level catches failures the level below cannot. A client component can
compile cleanly, curl fine, and still render nothing because a fetch shape
changed or a fallback silently kicked in (see §4 — two sections have hardcoded
fallback data that make a broken data path *look* populated).

## 2. Static gates — commands and recorded baseline (2026-07-06)

Run all three from the repo root. Results below were actually run and recorded
on **2026-07-06**; treat them as the baseline until re-verified.

### `npx tsc --noEmit`
**PASSES (exit 0, no output) as of 2026-07-06.** Any tsc error after your change
is yours. This gate must stay clean.

### `npm run lint` (runs bare `eslint`)
**As of 2026-11-16: clean — 0 errors, 0 warnings.** Local images go through
`next/image`; the three remaining `<img>` tags (Firestore posters, Spotify artist
photos, the old GIF branch) carry an `eslint-disable` comment saying why.
The gate is: **lint stays clean.**

Practical check: run lint, diff the problem list against this table. New file or
new line in the output → investigate; identical list → baseline, pass.

### `npm run build` — the pre-deploy gate (Heroku runs it as `heroku-postbuild`)
**PASSES (exit 0) as of 2026-07-06.** Two expected non-fatal warnings during
static generation: `Failed to set Next.js data cache ... items over 2MB can not
be cached` for the ESPN NFL scoreboard fetch. This is benign — do not chase it.

Build route table (2026-07-06): `/` static; `/api/cricket` revalidate 30m,
`/api/games` 1h; `/api/atp-schedule`, `/api/spotify`,
`/api/spotify/callback`, `/api/tennis`, `/api/wordofday` are dynamic (ƒ).
A change that flips a route between static/dynamic unexpectedly is worth flagging.

**There are no unit tests.** `package.json` has no test script. This is by design.

## 3. Per-change-type verification

| Change type | Minimum verification |
|---|---|
| Copy / link text | Render the page (`localhost:3000`), read the actual text in the DOM, **click the link** and confirm the destination. |
| Visual / component | Dev server up → inspect the affected section's rendered DOM/styles → check **desktop (~1280px) AND mobile (~375px)** viewports → confirm no layout shift or scrollbar introduced (Interests uses `overflow-x-hidden` for a reason — off-screen animated posters) → screenshot for the **owner to review. Not done until the owner has seen it.** |
| API route | `curl` it locally (see §5), verify the response **shape** and the **freshness-sensitive field** (a date, `status`, `configured`) — then load the page and confirm the **consuming component** renders the data (not its fallback). |
| Keyword-list / classification (tennis surface & tier keywords in `src/app/api/atp-schedule/route.ts`, team colours / MY_TEAMS in `UpcomingGames.tsx`) | **Before/after audit of the full output**, not just the case you targeted — substring matching means one keyword can reclassify unrelated tournaments/teams. Capture the route's full classified list before the change, diff after. See the `website-api-probing-toolkit` skill for the probing commands. Also check `website-failure-archaeology` — surface/tier keywords have burned sessions before. |
| Dependency change | `npm run build` passes + whole-page smoke: load `/`, confirm all eight sections render (§4) and the browser console is clean of new errors. |

## 4. Section-by-section golden checklist

Page order in `src/app/page.tsx` (2026-11-18): SiteNav → Hero → **AIProjects → Interests →
UpcomingGames → ATPSchedule → WordOfDay → SportQuestion → LinkWebsites** → footer.
Nav anchors (`SiteNav.tsx`): `#about`, `#projects`, `#interests`, `#games`, `#atp-schedule`,
`#word-of-the-day`, `#sport-quiz`, `#connect` — a dot rail on large screens, a menu button on smaller ones.

### Projects (`#projects`, `src/components/AIProjects.tsx`)
- [ ] All **4** projects navigable: FIFA World Cup 26, Tennis Calendar, Concert Tracklist Finder, World Map.
- [ ] The FIFA clip (`/fifa-web-match-zoom.mp4`, muted, loads and plays only while on screen) actually plays. An embedded preview pane running in the background pauses silent video to save power — check in a real, focused browser tab.
- [ ] No layout shift when switching between slides (media heights must match).

### Entertainment & Music (`#interests`, `src/components/Interests.tsx`)
- [ ] Movies and Shows grids populate **from Firestore** (`interests/current/movies`, `interests/current/shows`, client-side `getDocs`), 5 items each in a 3+2 layout.
- [ ] **Fallback trap:** on Firestore failure the component silently renders hardcoded `fallbackData` (Dune: Part Two, Shōgun, ...). A populated grid is NOT proof Firestore worked — check the titles aren't the fallback set.
- [ ] Spotify card renders (only when `/api/spotify` returns `configured: true`): **5 top artists** (circles) + **5 top tracks** (1 hero + 2×2 grid).
- [ ] The train-in poster animation is gated by localStorage `entertainment_intro_ts` (15-min replay interval). To verify the animation, clear that key first; its absence on reload is correct behavior, not a bug.

### Upcoming Fixtures (`#games`, `src/components/UpcomingGames.tsx`)

Naming note: `README.md` calls this section "Upcoming Matches" while the page/nav
context calls it "Upcoming Fixtures" — both refer to this same section; the
README/page divergence is known. Don't "fix" one to match the other unasked.
- [ ] Featured "NEXT UP" card shows the soonest event with countdown (Today / Tomorrow / In N days); remaining events in a 2-col grid.
- [ ] **NO completed games shown.** The filter is server-side in `src/lib/sports.ts` (drops events where `status.type.completed === true`) — the component does not filter. A completed game on the page means a bug in `lib/sports.ts` or ESPN data, not the component.
- [ ] **Tabs with no events are hidden.** Verified logic (UpcomingGames.tsx ~line 467): `allSports.filter((s) => s === "all" || games.some((g) => g.sport === s))`. A visible "Cricket" tab with zero cricket events = regression.
- [ ] **Fallback trap:** if `/api/games` returns empty, `buildFallbackGames()` renders 5 hardcoded fixtures (Man United vs Chelsea, Barcelona vs Real Madrid, Celtics vs Heat, Miami GP, Inter Miami vs LA Galaxy) with relative future dates. Check the fixtures aren't this list.
- [ ] Data is merged client-side from `/api/games` + `/api/cricket` + `/api/tennis`, sorted by date ascending — featured card must be the earliest.

### Tennis Schedule (`#atp-schedule`, `src/components/ATPSchedule.tsx`)
- [ ] Shows **current-month** tournaments only; ATP and WTA events with the same name merge into one card with both badges.
- [ ] **Timeline rows** (2026-11-15): live tournaments first, then upcoming; finished ones sit behind a "Show N finished" button. The surface label in each row (Clay/Grass/Hard/Indoor Hard) must be right — a wrong one means the surface keyword classification in `/api/atp-schedule/route.ts` is wrong.
- [ ] **All / ATP / WTA** filter pills work (WTA pill goes pink when active).
- [ ] Live tournaments get a blue glow + LIVE pulse; past ones render at 45% opacity; Grand Slams get a ★.

### Word of the Day (`src/components/WordOfDay.tsx`)
- [ ] Card shows a word with phonetics, part-of-speech badge, definition, example.
- [ ] **`word.date` equals today** (UTC `YYYY-MM-DD`; the route is `force-dynamic` with an in-memory per-day cache — a stale date means the cache or upstream scrape broke; see website-debugging-playbook).

### Links (`#connect`, `src/components/LinkWebsites.tsx`)
- [ ] Three cards render and **click through**: GitHub (github.com/abhinavp403), Play Store (developer page), LinkedIn.

## 5. API-route smoke suite (7 routes)

Dev server must be running (`personal-website` launch config, port 3000).
For each: run the curl, eyeball the named fields. `configured: false` means a
missing env var locally — not a code bug (Heroku has the real keys).

```bash
# 1. games — {games:[...]} ; eyeball: games[0].date is a FUTURE ISO date (no completed games), and it's not the hardcoded fallback list
curl -s localhost:3000/api/games | jq '{count: (.games|length), first: .games[0] | {homeTeam, awayTeam, sport, date}}'

# 2. cricket — {matches, configured} ; eyeball: configured == true (false = CRICAPI_KEY unset), matches[].date is ISO GMT with time
curl -s localhost:3000/api/cricket | jq '{configured, count: (.matches|length), first: .matches[0] | {team1, team2, date, matchType}}'

# 3. tennis — {matches} ; eyeball: player1/player2/tournament present, date is future
curl -s localhost:3000/api/tennis | jq '{count: (.matches|length), first: .matches[0] | {player1, player2, tournament, date}}'

# 4. atp-schedule — {tournaments} ; eyeball: surface+tier sane for a KNOWN tournament (Wimbledon => grass + grand-slam), status in past/live/upcoming
curl -s localhost:3000/api/atp-schedule | jq '[.tournaments[] | {name, surface, tier, status, tour}] | .[0:5]'

# 5. spotify — {configured, artists, tracks} ; eyeball: configured == true AND artists/tracks each have exactly 5; an "error" field means token refresh failed
curl -s localhost:3000/api/spotify | jq '{configured, error, artists: (.artists|length), tracks: (.tracks|length)}'

# 6. wordofday — WordOfDay object at TOP level (not wrapped) ; eyeball: .word non-empty, .date == today (UTC)
curl -s localhost:3000/api/wordofday | jq '{word, date, partOfSpeech}'
```

(`/api/spotify/callback` is the OAuth redirect handler — not part of the smoke
suite; it's only exercised during manual token setup.)

## 6. Acceptance discipline

**Done =** static gates pass at baseline (§2) **+** the relevant golden checks
from §4 pass **+** for anything visual, the **owner has seen it and approved**.

- "Code written" is not done. "Compiles" is not done. "Should work" is not done.
- Never claim verification you didn't perform. Report precisely: *"Verified: tsc
  clean, lint at baseline, curled /api/atp-schedule (Wimbledon = grass/grand-slam),
  inspected the section at desktop width. Not verified: mobile viewport, owner review."*
- If you couldn't run the dev server or the browser tooling, say so and mark the
  change **unverified** — hand the owner the exact checks from §4 to run.
- Committing is a separate, owner-triggered step — see `website-change-control`.

## 7. Provenance and maintenance

All facts above verified against the working tree on **2026-07-06**
(Next.js 16.2.3, TypeScript 5.9.3, branch `main` @ c930109). Re-verify with:

- Gate results / lint baseline: `npx tsc --noEmit`, `npm run lint`, `npm run build` — update §2 if the problem list or exit codes change.
- Section order & anchors: read `src/app/page.tsx` and `src/components/SiteNav.tsx`.
- Tab-hiding + completed-game filter: `grep -n "games.some" src/components/UpcomingGames.tsx` and `grep -n "completed" src/lib/sports.ts`.
- Route list & shapes: `ls src/app/api */route.ts` and each route's `NextResponse.json(...)` lines.
- Fallback traps: `buildFallbackGames` in UpcomingGames.tsx, `fallbackData` in Interests.tsx.

If any check contradicts this file, the code wins — fix the file.
