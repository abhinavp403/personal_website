---
name: website-new-section-campaign
description: >-
  End-to-end, decision-gated campaign for adding a NEW section to the personal
  website (Next.js 16 App Router, single-page, Heroku) — from owner scope
  approval, through probing the data source, building the API route and
  component, wiring nav, validation, and the commit/push gates. Load when asked
  to "add a new section", "add a data-driven feature", "add a new sport/league",
  "track X on my site", "add a new API/data source", or anything that would
  create a new src/components/<Name>.tsx + src/app/api/<name>/route.ts pair.
  When NOT to use — small tweaks to an EXISTING section (styling, copy, card
  layout, filters): use website-design-system + website-validation-and-qa
  instead; structural questions ("why is it built this way"):
  website-architecture-contract.
---

# New Section Campaign

Executable playbook for the hardest recurring job in this repo: adding a new live-data
section at the existing quality bar. Written for a zero-context mid-level engineer or a
Sonnet-class model. Facts verified against the repo on **2026-07-06**.

**The shape you are building** (every existing section follows it):

```
external API  →  src/app/api/<name>/route.ts  →  src/components/<Name>.tsx  →  src/app/page.tsx + SiteNav.tsx
   (probe)       (server-side fetch, tuned      (client component,             (section slot + nav link)
                  caching, empty-shape catch)     fetch("/api/<name>"))
```

Never skip a phase. Each phase ends in a gate with an expected observation. If you see
something else, follow the branch — do not improvise past a failing gate.

Companion skills you will be told to open at specific points: website-change-control
(house rules — read it before ANY edit), website-api-probing-toolkit, sports-data-reference,
website-caching-and-freshness, website-design-system, website-validation-and-qa,
website-failure-archaeology, website-self-maintaining-data-frontier.

---

## Phase 0 — Scope gate (OWNER decision, before any code)

Answer three questions WITH the owner, in writing, before touching a file:

1. **What data?** One sentence: "Show <what> for <whom/scope> updating <how often>."
2. **Which source?** Existing integrations (as of 2026-07-06): ESPN site API (soccer,
   NFL, NBA, tennis), CricAPI, Spotify, Dictionary.com, jolpi.ca (F1), Firebase, plus a
   facts API. If the data can come from a source already in `src/app/api/`, prefer it.
3. **Where on the page?** Which position in the `src/app/page.tsx` section stack, and
   what the nav label is.

**HARD FENCE — new third-party provider = OWNER GATE.** If the data needs a provider
not already used in this repo: **STOP. Do not write code.** Present the owner a short
options table — for each candidate: official/unofficial? auth or API key required?
rate limits? cost? seasonal coverage? — and wait for an explicit pick. This is a
standing house rule (see website-change-control). Never select a provider unilaterally,
"just to prototype," or because one endpoint happened to respond.

**Gate 0 output:** owner-approved one-liner (data + source + page position). If the
owner says "you pick the source" → still list the options and get a "yes, use X".

---

## Phase 1 — Probe the source BEFORE writing app code

Load **website-api-probing-toolkit** for curl hygiene and **sports-data-reference** if
the source is ESPN/sports. Work in the scratchpad, never in the repo.

1. **Curl the candidate endpoint(s)** and save raw responses:

   ```bash
   curl -s "<endpoint>" | head -c 4000
   curl -s "<endpoint>" > "$SCRATCHPAD/<name>-sample.json"
   ```

2. **Confirm the basics:** response is JSON, no auth wall (or auth works with a key the
   owner has approved), and note anything about update frequency / cache headers.

3. **Probe seasonal availability** — this catches the most common silent failure. Hit a
   date range that SHOULD have data and one that should NOT:

   ```bash
   curl -s "<endpoint>?dates=<in-season-range>"  | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('events',[])))"
   curl -s "<endpoint>?dates=<off-season-range>" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('events',[])))"
   ```

   Expected: nonzero for in-season, zero (not an error) for off-season. If off-season
   returns an ERROR instead of an empty list, your route's empty-state handling must
   treat that as "no data", not "crash".

4. **Write the field-mapping table.** List the 3–5 fields the UI needs and verify EACH
   exists in the saved sample (exact JSON path, example value). Example shape:

   | UI need        | JSON path                                | Example        |
   |----------------|------------------------------------------|----------------|
   | title          | `events[].name`                          | "Wimbledon"    |
   | start date     | `events[].date`                          | "2026-06-29…"  |
   | status         | `events[].status.type.completed`         | `false`        |

**Gate 1 output:** saved sample JSON in the scratchpad + a complete field-mapping table
where every row points at a real value in that sample.

**If a needed field is MISSING → branch:**
- Try another endpoint of the same provider first (ESPN often exposes the same data at
  several paths — see sports-data-reference).
- If no endpoint has it, you may **derive it via keyword classification** (the way
  `src/app/api/atp-schedule/route.ts` derives court surface from tournament names).
  **Say so explicitly to the owner**, because keyword lists inherit seasonal drift —
  new tournaments/teams/names appear every season and the list silently goes stale.
  Point at **website-self-maintaining-data-frontier** for the maintenance contract, and
  at commit `104d400` ("Fix tournament surface detection…") as proof this drift is real:
  city-name keywords missed branded tournament names ("Terra Wortmann Open" is Halle
  grass; the city never appears). Full incident record:
  website-failure-archaeology entry 3.
- If the field can't be fetched or derived → back to Phase 0; the scope may need to change.

---

## Phase 2 — API route

Load **website-caching-and-freshness** before choosing any cache directive, and
**website-architecture-contract** if unsure where logic belongs.

Create `src/app/api/<name>/route.ts`. Two in-repo exemplars (both verified 2026-07-06):

- **Simple exemplar:** `src/app/api/tennis/route.ts` — single fetch, filter, sort,
  empty-shape catch. Read it first; copy its structure.
- **Complex exemplar:** `src/app/api/atp-schedule/route.ts` — multiple fetches
  (`Promise.all` of ATP + WTA), keyword-derived fields, exported TS interface.

Skeleton (matches the house pattern in `api/tennis/route.ts`):

```ts
import { NextResponse } from "next/server";

export interface MyItem {          // exported — the component imports this type
  id: string;
  title: string;
  date: string;
  // …the 3–5 fields from your Phase 1 mapping table, no more
}

export async function GET() {
  try {
    const res  = await fetch("<endpoint>", { next: { revalidate: 3600 } }); // ← from table below
    const data = await res.json();
    const items: MyItem[] = /* map data using the Phase 1 field paths */ [];
    items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });   // ALWAYS return the empty SHAPE, never a 500
  }
}
```

**Caching decision table** (a decision aid — the source of truth for every route's
actual values and rationale is the catalog in **website-caching-and-freshness §2**):

| Data changes…                        | Directive                                                  |
|--------------------------------------|------------------------------------------------------------|
| Yearly / per-season schedule          | `next: { revalidate: 86400 }`                              |
| Hourly-ish (fixtures, scores)         | `next: { revalidate: 3600 }` (1800 if score-sensitive)     |
| At a calendar boundary (daily word)   | `export const dynamic = "force-dynamic"` + in-memory cache keyed by today's date |
| Response contains tokens/credentials  | `cache: "no-store"` on that fetch                          |

**FENCE — plain ISR for calendar-boundary data.** Commit `e4cdb11` ("Fix Word of the
Day showing stale word after midnight") exists because a plain `revalidate` window
straddles midnight and serves yesterday's data. If your data flips at a calendar
boundary, use force-dynamic + date-key. Do not re-fight this (website-failure-archaeology).

**FENCE — ESPN-family source? You MUST filter completed events and sort by date.**
Commit `86bf9fe` ("Fix completed games showing as upcoming"): ESPN date-range queries
RETURN finished events inside the range. The settled pattern (see
`src/lib/sports.ts:98-99`):

```ts
const completed = (e.status as Record<string, unknown>)?.type as Record<string, unknown>;
if (completed?.completed === true) return false;
```

**FENCE — no client-side third-party fetching.** The component fetches YOUR route,
never the external API. Fetching third-party APIs from the browser leaks keys, bypasses
the server caching contract, and hits CORS. Every one of the seven existing routes
exists precisely to prevent this (website-architecture-contract).

**Gate 2:**

```bash
npx tsc --noEmit                       # expected: clean, zero output
curl -s localhost:3000/api/<name> | head -c 2000   # expected: the documented shape with real data
```

- `tsc` errors → fix them; do not proceed with a dirty typecheck.
- Route returns `{ items: [] }` when data should exist → your mapping is wrong or the
  in-season probe from Phase 1 doesn't match what the route requests. Re-diff route URL
  vs. your working curl. Do NOT "fix" it by widening date ranges blindly.
- Route 500s → your catch isn't catching, or you threw inside `NextResponse`. The catch
  must return the empty shape.

---

## Phase 3 — Component

Load **website-design-system** BEFORE writing any JSX — it owns tokens, card anatomy,
typography, and animation idioms. This phase only covers the data-wiring contract.

Create `src/components/<Name>.tsx` following the house anatomy (all verified in
`src/components/UpcomingGames.tsx` and `ATPSchedule.tsx`):

1. `"use client"` at the top; fetch in `useEffect`.
2. Fetch your route with a per-fetch catch that resolves to the empty shape — never let
   a rejected fetch reach state (pattern from `UpcomingGames.tsx:452`):

   ```ts
   fetch("/api/<name>").then((r) => r.json()).catch(() => ({ items: [] }))
   ```

3. **Loading skeleton** while `loading` — `animate-pulse` blocks sized like the real
   cards (`UpcomingGames.tsx:506-511` is the exemplar:
   `className="h-36 bg-[#071e38] rounded-2xl animate-pulse"`).
4. **Empty state** — icon + short friendly message when the route returns the empty
   shape. The section must render SOMETHING on route failure; a blank hole in the page
   stack is a bug, not a state.

**Gate 3 — three states, all observed in the browser:**
- Real data renders (dev server + real route).
- Loading skeleton is visible on first paint (throttle network or just watch first load).
- Empty state verified by TEMPORARILY pointing the fetch at a dead route
  (e.g. `/api/<name>-nope`), observing the icon+message, then **reverting that edit**.

If real data doesn't render but `curl` on the route works → the bug is in the component
(shape mismatch, wrong state key). Compare the curl output to what the component
destructures, field by field.

---

## Phase 4 — Integration

1. **page.tsx:** import the component and add `<Name />` in the owner-approved position
   inside `src/app/page.tsx` (see how `<ATPSchedule />` sits at line ~49). The
   component's root section needs an `id` for nav targeting.
2. **SiteNav.tsx:** add one entry to `NAV_LINKS` in `src/components/SiteNav.tsx`:

   ```ts
   { label: "My Section", href: "#my-section" },   // href must equal the section id
   ```

   Scroll-to and active-highlight come free from the existing IntersectionObserver —
   IF the `href` matches an element id on the page. No other nav code changes.

**Gate 4:** in the browser — nav link appears, clicking it smooth-scrolls to the
section, and the pill highlights when the section is in view. If the highlight never
activates, the section `id` and the nav `href` disagree, or the section renders zero
height (empty state missing — back to Phase 3).

---

## Phase 5 — Validation

Load **website-validation-and-qa** for the full golden checklists. Minimum bar:

```bash
npx tsc --noEmit      # expected: clean
npm run lint          # expected: NO NEW problems beyond the pre-existing baseline
```

The lint baseline is recorded in **website-validation-and-qa §2** (14 problems as of
2026-07-06 — recount before judging; the gate is "no NEW errors", NOT "lint-clean"). Do not "helpfully" fix
baseline lint in this change — that's a separate, separately-approved commit.

- **Desktop AND mobile viewport** — the nav pill row and card grids are the usual
  mobile casualties.
- **Every EXISTING section still renders** — Projects, Entertainment & Music, Upcoming
  Fixtures, Tennis Schedule, Word of the Day, Links. A page.tsx edit can break
  neighbors.
- **README.md `## Sections` list updated** — docs-of-record rule: the README edit ships
  in the SAME commit as the section.

---

## Phase 6 — Review & promotion (three separate WAITs)

Load **website-change-control**. The gates, in order — each requires an explicit owner
signal; none is implied by the previous:

1. **Show the owner** the rendered section (screenshot or live). WAIT for visual
   approval. Owner reviews all visuals; expect iteration — that's Phase 3/4 rework, not
   a failure.
2. WAIT for an explicit **"commit"**. Then ONE single-purpose commit containing the
   whole vertical slice: component + route + page.tsx + SiteNav.tsx + README. Not five
   commits, not a commit that also sneaks in unrelated fixes.
3. WAIT for an explicit **"push"**. Never push on your own initiative. Deploy is via
   Heroku (see website-build-and-deploy).

---

## Wrong paths — fenced off, with the receipts

Each of these was actually tried or is structurally forbidden. Verified via
`git show --stat` on 2026-07-06.

| Wrong path | Why it's fenced | Evidence |
|---|---|---|
| Fetch the third-party API from the client component | Leaks keys, bypasses the server caching contract, CORS | Architecture contract; all 7 routes exist to prevent this |
| Plain ISR (`revalidate: N`) for calendar-boundary data | Window straddles midnight → serves yesterday's data | `e4cdb11` (Word of the Day stale-after-midnight fix) |
| Trust ESPN date ranges to exclude finished events | They don't; completed events come back inside the range | `86bf9fe` (added `status.type.completed` filter, `src/lib/sports.ts:98-99`) |
| City-name keywords for branded tournament names | "Terra Wortmann Open", "HSBC Championships" carry no city; classification silently wrong | `104d400` (grass/clay surface fix — see website-failure-archaeology entry 3) |
| Full-season data dump when current-window is house style | Owner already rejected a full-2026 table — it was REVERTED | `feef5ad` (revert of TournamentTable.tsx, −225 lines) |
| Large media in `public/` (>50MB files) | Bloats the Heroku slug and the repo forever | `bbc7036` (56MB `fifa-world-cup-26.mov`) triggered GitHub's large-file warning — see website-failure-archaeology entry 9; don't compound it |
| Committing/pushing without explicit instruction | Standing house rule, memorialized in user memory | website-change-control |

---

## Worked example — how the Tennis Schedule section ran this campaign

The existing Tennis Schedule section maps 1:1 onto the phases (all commits verified
with `git show --stat`, 2026-07-06):

- **Phase 0–1:** ESPN was already an approved provider (no new-provider gate needed).
  The scoreboard endpoint was probed for a full-year range; the responses carry
  tournament name/dates/venue but NOT surface or tier → the missing-field branch fired:
  surface and tier are **derived by keyword classification** in the route.
- **Phase 2:** `c474621` "Add ATP/WTA Tour schedule section" — the whole vertical slice
  in ONE commit: `src/app/api/atp-schedule/route.ts` (+127, Promise.all of ATP+WTA
  scoreboards, `revalidate: 86400` — yearly-schedule row of the cache table),
  `src/components/ATPSchedule.tsx` (+180), `page.tsx` (+3), `SiteNav.tsx` (+5/−2).
  Exactly the Phase 6 single-commit shape.
- **Phase 3 iteration under owner review:** `ccc58ae` (All/ATP/WTA filter pills),
  `b21c24d` (card redesign: grouping, sizing, layout — +115/−56), `f2cbd31`
  (surface+tier backdrop images in `public/`). Visual iteration after the first render
  is normal; each pass was its own small single-purpose commit.
- **The maintenance tail it inherited:** `104d400` fixed surface keywords for branded
  names — the predicted seasonal-drift cost of the keyword-classification branch.
  And `feef5ad` reverted a full-2026 table someone added — scope the owner never
  approved. Both are why Phases 0 and 1 exist.

---

## Provenance and maintenance

- Written 2026-07-06 against the repo at commit `c930109` (branch `main`). All cited
  commits (`c474621`, `ccc58ae`, `b21c24d`, `f2cbd31`, `86bf9fe`, `e4cdb11`, `104d400`,
  `feef5ad`) verified with `git show --stat`; all cited files and line references read
  directly from the working tree that day.
- Volatile facts to re-verify before trusting: the lint baseline count (14 on
  2026-07-06), the list of seven API routes, the cache values table, and line numbers
  in `UpcomingGames.tsx` / `sports.ts` / `page.tsx`.
- If a new section is added or an exemplar route is refactored, update the exemplar
  pointers here (Phase 2/3) and extend the worked example — this skill is only useful
  while its receipts stay real.
- Next.js in this repo is a nonstandard 16.x build — per `AGENTS.md`, check
  `node_modules/next/dist/docs/` before assuming App Router APIs match training data.
