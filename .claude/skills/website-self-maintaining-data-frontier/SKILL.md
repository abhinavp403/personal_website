---
name: website-self-maintaining-data-frontier
description: >
  Open research problems and adoption methodology for making this personal website's
  sports data SELF-MAINTAINING — i.e., correct without manual keyword-list fixes each
  season. Load when asked to: make data self-maintaining, automate season updates,
  reduce keyword-list maintenance, add monitoring or validation of surfaces/tiers/fixtures,
  detect mislabels automatically, "make this less manual", "stop hand-editing these lists",
  or plan the yearly January calendar refresh. Contains ranked open problems (audit
  diffing, low-confidence flagging, live-site smoke checks, keyword provenance) and the
  house methodology for turning a hunch into an owner-approved change.
  When NOT to use: for a one-off API probe or curl session use website-api-probing-toolkit;
  for fixing TODAY's specific mislabel or empty section use website-debugging-playbook;
  for commit/approval rules themselves use website-change-control (this skill routes
  through it, never around it).
---

# Self-Maintaining Data: The Frontier

**Owner's declared north star (stated 2026-07-06):** "self-maintaining data" — sports
sections that stay correct without manual keyword fixes; automated validation of
surfaces/tiers/fixtures against sources each season.

This skill is the research-frontier + methodology pack for that goal. Nothing in Part A
is adopted. Every item is an **open problem** or **candidate approach** until the owner
approves it. All implementation routes through the gates in `website-change-control`.
This skill grants zero exemptions from house rules.

## Why this frontier exists (ground truth, verified 2026-07-06)

The tennis section derives surface and tier **entirely from tournament-name keyword
matching** in `/Users/abhinavp403/Documents/Website/src/app/api/atp-schedule/route.ts`:

- `CLAY_KEYWORDS`, `GRASS_KEYWORDS`, `INDOOR_HARD_KEYWORDS` → `getSurface()`, which
  **defaults to `"hard"`** when nothing matches (line ~58).
- `ATP_TIER_1000/500`, `WTA_TIER_1000/500`, `TIER_FINALS_KEYWORDS` → `getTier()`, which
  **defaults to `"atp-250"`** when nothing matches (line ~207).
- `WTA_125_KEYWORDS` — a **54-entry blocklist** filtering WTA 125/ITF noise out of the
  ESPN WTA feed.
- `ATP_EXCLUDE_KEYWORDS` — events removed from the current-season calendar.

ESPN's scoreboard API provides **no surface or tier fields** and uses sponsor-branded
names ("Terra Wortmann Open", "VANDA Berlin Open"), so the lists drift every season:

- Commit `104d400` (2026-06-10) fixed surface detection — grass/clay tournaments were
  mislabeled until a human noticed wrong backdrops (an audit found 7 mislabeled
  tournaments; the fix added 9 keywords in a 2-insertion diff — authoritative record:
  `website-failure-archaeology` entry 3).
- The WTA-125 blocklist grew **entry-by-entry as failures were noticed**: `832339c`
  ("Filter out Istanbul Open"), `b8b9313` ("Filter out Parma Ladies Open"), etc.
- Tier lists were corrected in bulk twice: `aea19ab` (WTA, from official WTA data),
  `c4a5c2b` (ATP, from 2026 official calendar).
- The ESPN fetch is pinned to the season: `?dates=20260101-20261231` — a **hardcoded
  year** that silently goes stale every January.

Fixture correctness has the same "human is the monitor" property: commit `86bf9fe`
fixed completed games showing as upcoming in `src/lib/sports.ts`
(`status.type.completed === true` filter) — again found by the owner looking at the site.

Existing asset: sibling skill `website-api-probing-toolkit` ships
`.claude/skills/website-api-probing-toolkit/scripts/audit-tennis-classification.mjs`,
a standalone re-implementation of the keyword logic that prints every tournament's
derived surface/tier. It exists and runs (verified 2026-07-06; the toolkit skill
quotes its live output) — one-line existence check:
`ls .claude/skills/website-api-probing-toolkit/scripts/`.

---

## PART A — Open problems, ranked by value/effort

### A1. Season-start classification audit (highest value)

**Current practice:** manual eyeballing after someone notices a wrong backdrop on the
live site. Mean time to detect a mislabel is "whenever the owner happens to look during
that tournament's week" — commit `104d400` landed mid-June for a problem present since
the season data loaded.

**This repo's asset:** the api-probing-toolkit auditor already derives every
tournament's classification outside the app. The missing half is a ground-truth source
to diff against.

**Candidate (NOT adopted):** a yearly audit script extending the auditor that diffs
derived classifications against an external ground-truth source. Candidate sources to
EVALUATE — not adopt; adding any data source is an owner-gated provider decision per
`website-change-control`:
- Wikipedia tournament pages (structured infoboxes list surface; free; scraping fragility unknown)
- Official ATP/WTA public data (the tier lists already cite `wtatennis.com/tournaments`
  as their human source — see comment at `route.ts` line ~102)

**First three steps in this repo:**
1. Run the existing auditor (`node .claude/skills/website-api-probing-toolkit/scripts/audit-tennis-classification.mjs`)
   and save the full derived table for the current season to scratch.
2. Hand-verify 10 tournaments against each candidate ground-truth source and record,
   per source: name-matching difficulty (sponsor names vs. canonical names), fields
   available (surface? tier? dates?), and fetch stability. This is a probe, in scratch
   or `.claude/skills/*/scripts/` — never committed app code.
3. Write a one-page comparison for the owner: per-source accuracy on the 10-sample,
   estimated matching effort, and a recommendation. Owner picks (or rejects) a source.

**You have a result when:** run in January, the script produces a suspect-classification
report containing **≥1 true mislabel found before any human notices it on the site**.
Until that happens once, this is unproven.

### A2. Unknown-name / low-confidence detection (cheapest real win)

**Insight:** you don't need ground truth to know when the code is *guessing*. Any
tournament matching NO surface keyword silently defaults to `"hard"`; any tournament
matching no tier keyword silently defaults to `"atp-250"`. Every historical surface
mislabel was, by definition, a wrong default or wrong match — a "matched nothing"
flag catches the default-fallthrough class for free.

**Candidate (NOT adopted):** flag defaulted tournaments as LOW CONFIDENCE in a
**report-only** output. No behavior change on the site; the report is the deliverable.

**First three steps in this repo:**
1. Measure today's default rate: run the existing auditor and count tournaments whose
   surface came from the `"hard"` fallthrough and whose tier came from the `"atp-250"`
   fallthrough (the auditor re-implements the logic, so it can tag which branch fired).
2. Define the flag precisely: `surface_defaulted`, `tier_defaulted`, plus
   "matched a WTA_125 keyword but is in the display set" as a sanity cross-check.
3. Decide where the report surfaces — console output of a manual script vs. anything
   scheduled — this is an **owner decision**; propose, don't build.

**You have a result when:** back-testing shows **every known 2026 mislabel would have
appeared on the low-confidence report** (checkable now against the `104d400` fix and
the blocklist-growth commits). If a known mislabel would NOT have appeared (e.g., a
tournament that matched the *wrong* keyword rather than no keyword), record that as a
measured limitation — that class needs A1's ground truth instead.

### A3. Fixture-correctness self-check (live-site smoke)

**Current practice:** completed-game and empty-section failures (the `86bf9fe` class)
are noticed only when the owner looks at the site.

**Candidate (NOT adopted):** a smoke script — manual at first, scheduling is a separate
owner decision — that hits the live site's API routes and asserts invariants:
- no event returned as "next game" has already completed (dates/status sane)
- returned dates fall within the expected search window
- each favourite team (soccer/NBA/NFL configured in `src/lib/sports.ts`:
  `FOOTBALL_TEAMS`, `BASKETBALL_TEAMS`, `NFL_TEAMS`; cricket's `IPL_TEAMS` lives
  in `src/app/api/cricket/route.ts`) yields at most 1 upcoming entry
- `/api/atp-schedule` returns a non-empty `tournaments` array during the season
  (`/api/tennis` returns `{matches}` — different shape)

**First three steps in this repo:**
1. Enumerate the invariants from actual route shapes — read
   `src/app/api/` (routes: `atp-schedule`, `cricket`, `fact`, `games`, `spotify`,
   `wordofday`, `tennis`) and `src/lib/sports.ts`, and from the failure classes
   recorded in `website-failure-archaeology`.
2. Write the script as a probe (scratch or a skill `scripts/` dir) against the
   **local dev server first**, then the live Heroku URL, read-only GETs only.
3. Deliberately break one invariant locally (e.g., temporarily widen the date window)
   and confirm the script catches it — a checker that has never failed is untested.

**You have a result when:** a failing invariant produces a report **before the owner
sees the problem on the site** for at least one real incident.

### A4. Keyword-list provenance (lowest effort, quality-of-life)

**Current practice:** each entry's *reason* is buried in git history. `route.ts`
already has partial inline comments ("// Removed from 2026 ATP calendar",
"// catches Internazionali Femminili Di Brescia etc.") but coverage is inconsistent —
answering "why is `vanda` in `GRASS_KEYWORDS`" (it's the sponsor-branded Berlin grass
event, VANDA Berlin Open — cross-referenced from the `WTA_TIER_500` comment at
line ~127) currently takes archaeology.

**Candidate (NOT adopted):** a comment-per-entry convention (entry → tournament →
season last verified) or a sidecar map file. Comments are lower-friction and can't
drift from the list; a sidecar is machine-readable for A1/A2. Owner picks.

**First three steps in this repo:**
1. Inventory which entries already have explanatory comments vs. which are bare
   (grep the six lists in `route.ts`).
2. For 5 bare entries, do the git archaeology ONCE (`git log -S"<entry>" -- src/app/api/atp-schedule/route.ts`)
   and draft the convention using them as examples.
3. Propose the convention to the owner as a diff sketch — it touches app code, so it
   gates through change-control even though it's comments-only.

**You have a result when:** a brand-new session can answer "why is `vanda` in
GRASS_KEYWORDS" from the file alone, without git archaeology.

### Explicitly NOT worth pursuing at current scale

These are fenced OFF. Each is also an owner-gated scope change, so do not drift into
them while implementing A1–A4:

- **Paid sports-data provider** — cost and integration weight dwarf the problem; the
  whole section is one hobby page, and new providers require explicit owner approval anyway.
- **Full test framework** — the no-tests setup is deliberate (see
  `website-validation-and-qa`); targeted probe/audit scripts deliver the same signal
  without the maintenance surface.
- **A database for classifications** — the keyword lists total a few hundred lines of
  code with git history as the audit log; a DB adds ops burden on Heroku for zero
  correctness gain.

---

## PART B — Methodology: how an idea becomes an adopted change HERE

### B1. Evidence bar

A proposed mechanism must explain **ALL observations, including the negatives**.
House lesson from `86bf9fe`: data that "looked stale" was actually a logic bug
(completed events not filtered) — the accepted fix had to explain why hard-refresh
didn't help, which no caching theory could. If your explanation doesn't cover a
negative observation, it's the wrong explanation.

State predictions **BEFORE running the probe**: "if these tournaments are mislabeled,
the auditor will show N suspect rows" — then run it. A probe run without a prior
prediction is exploration (fine), but it cannot count as confirmation.

### B2. Idea lifecycle

```
hunch
  → probe script in .claude/skills/*/scripts/ or the session scratchpad
      (NEVER committed app code; read-only against APIs and the live site)
  → report to owner WITH MEASURED NUMBERS (default rates, mismatch counts —
      not adjectives)
  → owner approves           ← hard gate; no approval, no implementation
  → implement behind the change-control gates (website-change-control)
  → validate per website-validation-and-qa (tsc / lint / build + golden checks)
  → owner-triggered commit    ← never auto-commit
```

**Retirement:** failed ideas get recorded in `website-failure-archaeology`
(symptom → what was tried → why it failed) so they aren't re-tried by a later session.
A dead end that isn't written down will be re-excavated.

### B3. Where good ideas historically came from here

Verified in git history (re-verify: `git log --oneline --follow -- src/app/api/atp-schedule/route.ts`):

1. **User-noticed visual wrongness** — wrong surface backdrops drove `104d400` and
   `a48dd97`. Effective but slow: detection latency is "until the owner looks".
2. **Systematic audit against official data** — `aea19ab` (WTA tiers from official WTA
   API data) and `c4a5c2b` (ATP tiers from the 2026 official calendar) each fixed a
   whole class at once, versus the entry-by-entry blocklist commits (`832339c`,
   `b8b9313`) that fixed one failure per commit.
3. **API-shape inspection** — `86bf9fe` came from looking at the actual ESPN response
   and finding `status.type.completed`.

**Corollary — the highest-yield habit in this repo is probing real API responses, not
reading more code.** The code is small and honest; the surprises live in what ESPN
actually returns.

---

## Provenance and maintenance

All repo claims verified 2026-07-06 against the working tree at commit `c930109` and
`git log`. Volatile facts and how to re-check them:

- Keyword lists, defaults, hardcoded `dates=20260101-20261231`:
  `grep -n "KEYWORDS\|dates=2026\|return \"hard\"\|return \"atp-250\"" src/app/api/atp-schedule/route.ts`
- WTA_125 blocklist size (54 entries as of 2026-07-06): count array literals in
  `WTA_125_KEYWORDS` in the same file.
- Auditor script existence:
  `ls .claude/skills/website-api-probing-toolkit/scripts/` (expect
  `audit-tennis-classification.mjs` and `probe-route-shapes.sh` — both present
  and runnable as of 2026-07-06).
- Historical commits cited: `git show 104d400 aea19ab c4a5c2b 86bf9fe --stat`.
- Favourite-team configs: `grep -n "TEAMS" src/lib/sports.ts`.

When any of these drift (new season, list edits, auditor lands), update the dated
claims here rather than letting them rot — this skill's own credibility depends on the
same provenance discipline it preaches in A4.
