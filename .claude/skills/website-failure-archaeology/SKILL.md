---
name: website-failure-archaeology
description: >
  Chronicle of every major investigation, dead end, rejected fix, and revert in
  this personal-website repo (symptom → root cause → evidence → status). Load
  this BEFORE re-investigating a bug, reverting anything, changing cricket time
  display, tennis surface/tier keywords, Word of the Day caching, or the
  Entertainment animations — or whenever you catch yourself wondering "has this
  been tried before?", "why is this code weird?", or "should I just revert
  this?". Prevents re-fighting settled battles.
---

# Website Failure Archaeology

The verified history of what broke, what was tried, what was rejected, and what
is still live in this repo (`/Users/abhinavp403/Documents/Website`, single
branch `main`, ~71 commits, no tests/CI, deployed to Heroku). All commit hashes
below were verified with `git show` on 2026-07-06; all "Status" claims were
cross-checked against the source files on the same date.

## When NOT to use this skill

- **Live incident on the deployed site right now** (section blank, API 500,
  build failing) → use `website-debugging-playbook` for triage steps.
- **Deciding whether a change is safe to make/ship** (gating, review, deploy
  discipline) → use `website-change-control`.
- Use THIS skill when the question is historical: "was this tried?", "why is
  it like this?", "can I revert/redo X?".

## How to use it

1. Find your symptom or file in the tables below before writing any fix.
2. If the entry is marked **settled-reverted-do-not-retry**, do not re-attempt
   the reverted approach without explicit owner direction — the owner already
   rejected it once.
3. If marked **open-residual-risk**, the fix works but decays; the entry says
   how it decays and how to extend it.
4. Every entry cites a commit; run `git show <hash>` to see the full story.

Quick index by file:

| File | Entries |
|---|---|
| `src/app/api/wordofday/route.ts` | 1 |
| `src/lib/sports.ts` | 2 |
| `src/app/api/atp-schedule/route.ts` | 3, 6 |
| `src/components/UpcomingGames.tsx`, `src/app/api/cricket/route.ts` | 4, 12 |
| `src/components/ATPSchedule.tsx` (section scope) | 5 |
| `src/components/Interests.tsx` | 7, 8 |
| `public/` (repo weight) | 9 |
| Deploy config (`Procfile`, `package.json`) | 10, 13 |
| Conventions / meta | 11, 14 |

---

## Settled battles — do not reopen

### 4. Cricket timezone display (REVERT, then re-done correctly)

- **Symptom:** Cricket match times displayed wrong / in a timezone the viewer
  didn't expect.
- **History (four commits in sequence, all 2026-04-16, verified):**
  1. `b12eb2e` — "fix: cricket dates use dateTimeGMT and display in IST":
     switched to `dateTimeGMT` and pinned display to `Asia/Kolkata` with an
     "IST" suffix.
  2. `51251db` — "fix: show cricket times in device local timezone instead of
     IST": removed the IST override from `formatDate`/`formatTime` in
     `UpcomingGames.tsx` — but did NOT fix parsing, so `dateTimeGMT` strings
     (no `Z` suffix) were parsed as *local* time and displayed wrong.
  3. `8851f2a` — **Revert** of `51251db`. Back to IST display.
  4. `9beccdc` — "fix: cricket times now parse as UTC and display in device
     timezone": appends `Z` to `dateTimeGMT` in
     `src/app/api/cricket/route.ts` (`raw + "Z"` when no `Z`/`+` present) so
     JS parses it as UTC, AND removes the IST override so display is
     device-local.
- **Root cause of the revert:** display-layer change without the parse-layer
  fix. The revert was of the *broken half-fix*, not of the goal.
- **Final settled state (verified in current source 2026-07-06):**
  device-local display. `src/app/api/cricket/route.ts` lines ~51-52 and
  ~109-110 still append `Z`; `formatDate`/`formatTime` in
  `src/components/UpcomingGames.tsx` (lines ~230-234) take no sport/timezone
  parameter.
- **Status: settled — do not touch.** If you change cricket time handling,
  you MUST keep the `Z`-append in the API route or times silently shift by
  the server/viewer UTC offset. Do not reintroduce IST display without owner
  direction.

### 5. Full 2026 tournament table (added and reverted same day)

- **Symptom (of the revert):** none — this was a feature the owner rejected.
- **History:** `f27cbed` (2026-05-08) added a full-season 2026 tournament
  schedule table (excl. Grand Slams) as `src/components/TournamentTable.tsx`
  (225 lines) plus nav entry. `feef5ad` reverted it **the same day**
  (2026-05-08, 8 minutes later), deleting the component.
- **Evidence:** `git show f27cbed --stat`, `git show feef5ad --stat`.
- **Status: settled-reverted-do-not-retry.** The Tennis Schedule section
  intentionally shows **current-month tournaments only** (`c474621` is the
  surviving design). Do not add a full-season table without owner direction.

### 7. Entertainment animation triggering early (session fix, then undone)

- **Symptom:** The Entertainment/Spotify intro animation fired before the
  viewer reached the Spotify section (session work, 2026-06/07; no dedicated
  commit — the relevant committed state is `40f86e4`).
- **Root cause (two stacked issues found in-session):**
  1. In the `IntersectionObserver` effect in `src/components/Interests.tsx`,
     `setup()` returns a cleanup function, but it is invoked via
     `setTimeout(setup, 100)` so that return value is **discarded** — only
     `clearTimeout` is returned from the effect, so observers can accumulate
     across re-runs (bounded, since the observer disconnects itself on
     trigger).
  2. The observer target falls back to the whole section:
     `spotifyRef.current ?? document.querySelector("#interests")` — the
     `#interests` fallback intersects far earlier than the Spotify card.
- **Resolution:** A session fix (observe only the Spotify ref, no fallback,
  capture cleanup) was applied and then **undone at owner request** along
  with other Entertainment/movies animation changes, while KEEPING the
  Spotify card sizing changes. `Interests.tsx` was restored to exactly
  `40f86e4`'s state (verified 2026-07-06: `git diff 40f86e4 HEAD --
  src/components/Interests.tsx` is empty).
- **Status: settled-reverted-do-not-retry.** The fallback and the discarded
  `setup()` cleanup are still in current code (lines ~242-274) **on
  purpose** — the owner chose this state. Do not "fix" the observer again
  without owner direction. If asked to, the known-good approach is: observe
  only `spotifyRef`, drop the `#interests` fallback, and capture/return
  `setup()`'s cleanup.

### 14. Commit message convention change

- Early history used conventional-commit prefixes: e.g. `80fc8f4` "feat: add
  Mac and Windows download pills to Tennis Calendar", `4c19fe4` "feat: add
  Concert Tracklist Finder project", `08c0a70` "chore: ...", `9beccdc`
  "fix: ..." (prefix era spans first commit through `80fc8f4`).
- From `0caa6b7` ("Apply new CSS theme and remove section header titles")
  onward, subjects are plain sentences with no prefix (verified across
  `git log --oneline`, 2026-07-06).
- **Status: settled.** Current convention is **plain sentence subjects** —
  do not write `feat:`/`fix:` prefixes in new commits.

---

## Fixed with residual risk

### 1. Word of the Day served stale after midnight

- **Symptom:** First visitor after midnight got yesterday's word.
- **Root cause:** ISR stale-while-revalidate — the route served the cached
  (yesterday's) response while revalidating in the background.
- **Fix:** `e4cdb11` (2026-05-15) — `export const dynamic = "force-dynamic"`
  plus an in-memory date-keyed cache (`memCache` compared against
  `todayUTC()`) in `src/app/api/wordofday/route.ts`; upstream fetch uses
  `cache: "no-store"`.
- **Status (verified in current source 2026-07-06): fixed, still in place.**
- **Residual risk:** (a) cache is per-process — a dyno restart or multiple
  instances just means an extra upstream fetch, harmless; (b) "today" is
  **UTC**, so the word flips at UTC midnight, not local; (c) the route
  scrapes dictionary.com HTML by class names (`wotd-entry-*`) — an upstream
  markup change breaks parsing, not caching.

### 2. Completed games shown as upcoming

- **Symptom:** A finished match (e.g. Barcelona–Real Madrid after the final
  whistle) stayed on the top fixture card as "upcoming".
- **Root cause:** ESPN scoreboard date-range queries include already-finished
  events; the code took the first future-dated event without checking status.
- **Fix:** `86bf9fe` (2026-05-10) — skip events where
  `status.type.completed === true` in `findNextGame` and `findNextNFLGame`
  in `src/lib/sports.ts`. The check was later carried into
  `findNextNationalGame` (added with `fbb8cf2`).
- **Status (verified 2026-07-06): fixed, still in place** — the
  `completed?.completed === true` guard appears in all three finders
  (`src/lib/sports.ts` lines ~98-99, ~128-129, ~166-167).
- **Residual risk:** any NEW `findNext*` variant added later must copy this
  guard or the bug returns for that sport.

### 3. Mislabeled tennis surfaces (branded tournament names)

- **Symptom:** Grass- and clay-court tournaments rendered with the wrong
  surface on Tennis Schedule cards.
- **Root cause:** ESPN returns sponsor-branded tournament names ("Terra
  Wortmann Open" = Halle, "HSBC Championships" = Queen's Club, "VANDA
  Pharmaceuticals ..." etc.) which the surface keyword lists — keyed on
  city/venue names — did not match, so those events fell through to the hard
  default.
- **Fix:** `104d400` (2026-06-10) — added brand keywords to the lists in
  `src/app/api/atp-schedule/route.ts`: GRASS gained `"hsbc"`,
  `"terra wortmann"`, `"vanda"`; CLAY gained `"nordea"`, `"gstaad"`,
  `"generali"`, `"umag"`, `"porsche"`, `"charleston"` (9 keywords total,
  per the verified diff; diffstat is 2 insertions/1 deletion because each
  list changed on one line). Found via a systematic audit comparing
  known-surface tournaments against keyword output, which surfaced 7
  mislabeled tournaments (session work, 2026-06 — a descendant of that
  audit now lives at
  `.claude/skills/website-api-probing-toolkit/scripts/audit-tennis-classification.mjs`).
  This entry is the authoritative record of the incident — other skills
  cite it rather than restating the numbers.
- **Status (verified 2026-07-06): fixed, still in place** —
  `GRASS_KEYWORDS`/`CLAY_KEYWORDS` at lines ~17-28 contain the additions.
- **Residual risk: keyword lists drift every season.** Sponsors change names
  yearly. When a surface looks wrong, add the *brand* keyword (lowercase
  substring match on the ESPN name), not just the city.

### 6. WTA 125 filter accretion

- **Symptom:** WTA-125/ITF-level events (Parma Ladies Open, Istanbul Open,
  ...) appearing in the Tennis Schedule as if they were tour-level WTA
  events.
- **Root cause:** ESPN's WTA scoreboard feed mixes WTA-125/ITF (and
  ATP-named) events into the WTA feed with no reliable level field.
- **Fix (accreted, not designed):** a keyword blocklist `WTA_125_KEYWORDS` in
  `src/app/api/atp-schedule/route.ts` (line ~149; **54 entries** as of
  2026-07-06) that grew one entry at a time: `b8b9313` (Parma), `832339c`
  (Istanbul), with tier logic hardened in `aea19ab` ("Fix WTA tier
  classifications using official WTA API data" — split ATP/WTA keyword lists
  because the same name means different tiers per tour, e.g. Dubai = ATP 500
  / WTA 1000).
- **Status: fixed, open-residual-risk.** The pattern is guaranteed to recur:
  **every new season surfaces new 125 events that need adding.** When a
  suspicious low-tier event appears, verify its level on wtatennis.com, then
  append a distinctive lowercase substring of its ESPN name to
  `WTA_125_KEYWORDS`. Beware over-broad substrings that would also match a
  real tour event.

### 12. daysUntil off-by-one ("Tomorrow" for a 2-days-away match)

- **Symptom:** A Saturday match shown on Thursday said "Tomorrow".
- **Root cause:** raw millisecond difference (39h) divided by 86400000 rounds
  down to 1 day.
- **Fix:** `0e2f47e` (2026-04-16) — zero out time on both dates before
  comparing (calendar-date diff).
- **Status (verified 2026-07-06): fixed, still in place** — `daysUntil` in
  `src/components/UpcomingGames.tsx` lines ~236-242 calls
  `setHours(0,0,0,0)` on both sides.

### 13. Heroku build ran at dyno startup (deploy pattern)

- **Symptom:** Build executed on dyno boot (`web: npm run build && npm
  start`), when devDependencies are pruned — fragile/slow startup.
- **Fix:** `d45616c` (2026-04-16) — `Procfile` becomes `web: npm start`;
  `heroku-postbuild: next build` added to `package.json` so the build runs
  during slug compilation while devDependencies are still installed.
- **Status: fixed, still in place.** Keep any future build steps inside
  `heroku-postbuild`, never in the Procfile.

---

## Open items

### 8. Firebase Firestore rules expiry (config lives OUTSIDE the repo)

- **Symptom (near-miss, 2026-06):** Firestore test-mode rules ship with a
  built-in expiry date; when it lapsed, the movies/shows grid (Entertainment
  section, `Interests.tsx`) would have gone dark.
- **Fix:** applied **in the Firebase console, not in this repo** — rules set
  to `allow read: if true; allow write: if false` (as of 2026-07-06; there
  is no code commit and `git log` will never show this).
- **Status: open-residual-risk / lesson.** Repo archaeology CANNOT see
  Firestore rules. If movies/shows are empty with no code change, check the
  Firebase console rules and quotas FIRST before bisecting commits.

### 9. Large video file in the repo

- **What happened:** `bbc7036` (2026-06-23) added
  `public/fifa-world-cup-26.mov` — 58,318,840 bytes (**55.6 MB**, verified
  on disk 2026-07-06), over GitHub's 50 MB recommendation. The push
  succeeded with a warning. Removal was considered; **owner chose to keep
  it.**
- **Status: open item.** If pushes start failing or the repo/slug bloats,
  compress or move to external hosting (and note: rewriting it out of
  history later requires a force-push). Do not delete without owner
  direction.

### 10. Duplicate deploy folder confusion (resolved, lesson stands)

- **What happened (2026-06):** a stale sibling folder
  `~/Documents/personal-website` (an old copy, distinct from this repo at
  `~/Documents/Website`) caused confusion about which checkout Heroku
  deploys came from. Deploys actually come from THIS repo's `heroku` remote
  (`https://git.heroku.com/apwebsite.git`, verified via `git remote -v`
  2026-07-06). The stale folder was deleted by the owner (verified gone
  2026-07-06).
- **Status: resolved; lesson permanent.** Before reasoning about deploys,
  run `git remote -v` in the checkout you're actually standing in.

### 11. (Reserved) Convention notes

See entry 14 under "Settled battles" for the commit-prefix convention change.

---

## Provenance and maintenance

Compiled 2026-07-06 by mining `git log --oneline` (all ~71 commits on
`main`), `git log --grep="Revert"`, and `git show` on every commit cited
above; each "Status" was cross-checked against the working-tree source the
same day. Entries 7, 8, and 10 include session/console knowledge that git
alone cannot show — they are date-stamped for that reason.

Re-verify before trusting a volatile fact:

- All hashes exist: `git log --oneline | grep -E 'e4cdb11|86bf9fe|104d400|8851f2a|51251db|9beccdc|b12eb2e|feef5ad|f27cbed|b8b9313|832339c|aea19ab|0e2f47e|d45616c|bbc7036|40f86e4'`
- Reverts list: `git log --grep="Revert" --oneline` (expect `feef5ad`, `8851f2a`)
- Word of the Day fix live: `grep -n 'force-dynamic\|memCache' src/app/api/wordofday/route.ts`
- Completed-game guard live in all finders: `grep -n 'completed === true' src/lib/sports.ts` (expect 3 hits)
- Surface/125 keywords: `grep -n 'GRASS_KEYWORDS\|CLAY_KEYWORDS\|WTA_125_KEYWORDS' src/app/api/atp-schedule/route.ts`
- Cricket final state: `grep -n 'endsWith("Z")' src/app/api/cricket/route.ts` and confirm `formatTime` in `src/components/UpcomingGames.tsx` has no timezone override
- Interests still at 40f86e4: `git diff 40f86e4 HEAD -- src/components/Interests.tsx` (expect empty)
- Video size: `ls -l public/fifa-world-cup-26.mov`
- Deploy remote: `git remote -v` (expect `heroku` → apwebsite)

When a new investigation, revert, or rejected fix lands, add an entry here in
the same format (**Symptom / Root cause / Evidence / Status**) under the
correct group, verify the hash with `git show` first, and date-stamp anything
that lives outside the repo.
