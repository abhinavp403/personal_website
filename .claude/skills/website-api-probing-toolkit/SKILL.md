---
name: website-api-probing-toolkit
description: >-
  "Prove it, don't assume it" recipes for the personal-website repo's external
  APIs (site.api.espn.com, Spotify, CricAPI, Dictionary.com, jolpi.ca Ergast).
  Load when verifying an external API's behavior or response shape, auditing
  keyword classifications (tennis surface/tier) against ground truth,
  investigating why a data source returns nothing/0 events, validating a
  league slug, or BEFORE coding against any endpoint. Triggers: "is this API
  claim true", "does ESPN return X", "probe the endpoint", "why is events[]
  empty", "which slug has data", "verify the response shape", "audit the
  keywords". When NOT to use: what the data/slugs/tiers MEAN and what's
  already known → sports-data-reference; symptom-driven triage of a broken
  app section → website-debugging-playbook. This skill is the tooling — how
  to get evidence, not what the evidence means.
---

# Website API Probing Toolkit

Every sports feed on this site rides UNOFFICIAL APIs — `site.api.espn.com` has
no docs and no SLA. Claims like "that slug has events", "that field exists",
"that tournament is clay" have repeatedly turned out wrong. The fix is always
the same: **run a probe, read the actual response, then code.**

## 1. Probing doctrine

1. **Demonstrate, don't recall.** Before writing code that depends on an
   endpoint's behavior, hit the endpoint and look at the real JSON. Training
   data and intuition about ESPN's API are both stale.
2. **Audit classifications against known ground truth.** The tennis
   surface/tier logic is keyword matching on tournament names. The only way to
   trust it is to dump every classified row and compare against facts you know
   independently (Wimbledon = grass, June = grass season, Rome = clay). This
   exact method found 7 surface mismatches → fixed in commit `104d400`
   (full incident record: `website-failure-archaeology` entry 3).
3. **Negative results are findings.** "0 events" is data, not failure. Record
   the **date you probed** and the **exact query** — seasonality changes
   answers. `uefa.nations` returning 0 events in July 2026 is true *for July
   2026*; it may return hundreds in October. A dated negative result saved
   this repo from wiring three dead slugs (see recipe 3).
4. **One probe beats an hour of reading code.** When code and reality might
   disagree, reality wins and is one curl away.

## 2. Recipe: ESPN endpoint probe

Template — scoreboard with a date range, extracting exactly the fields this
repo relies on (`events[].name`, `.date`, `.status.type.completed`,
`competitions[0].competitors[].team.displayName`):

```bash
curl -s "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260704-20260712&limit=100" \
  | jq '{eventCount: (.events|length),
         sample: [.events[:3][] | {name, date,
                  completed: .status.type.completed,
                  teams: [.competitions[0].competitors[].team.displayName]}]}'
```

For other sports swap the path segment: `tennis/atp`, `tennis/wta`,
`basketball/nba`, `football/nfl`, `soccer/<league-slug>`. Dates are
`YYYYMMDD` or `YYYYMMDD-YYYYMMDD`.

**Live output (run 2026-07-06):** `eventCount: 12`, first samples were
`"Morocco at Canada"` (2026-07-04T17:00Z, `completed: true`, teams
`["Canada","Morocco"]`), `"France at Paraguay"` (completed: true), `"Norway at
Brazil"` (completed: true) — World Cup knockout matches. Note `completed`
lives at `.status.type.completed` (top-level of the event), which is how the
completed-games-showing-as-upcoming bug was diagnosed.

**Interpreting empty `events[]`** — three causes, discriminate like this:

| Hypothesis | Test |
|---|---|
| Off-season / genuinely no events | Probe a range you KNOW had events (e.g. `?dates=20260611-20260614` — World Cup opening days). Events appear → original range is just empty. |
| Wrong slug | Probe a known-good slug (`eng.1`) with the same date range. Known-good works → your slug is wrong or dead. |
| Wrong date format | Drop `dates=` entirely (defaults to today) or use a single `YYYYMMDD`. Response changes shape/count → your format was silently ignored. |

ESPN returns HTTP 200 with `"events": []` in all three cases — status codes
tell you nothing; only differential probing does.

## 3. Recipe: league-slug discovery / validation

When you need a slug and aren't sure it exists or carries data, probe several
candidates over the same range and compare counts:

```bash
for slug in fifa.world uefa.nations conmebol.america concacaf.gold; do
  n=$(curl -s "https://site.api.espn.com/apis/site/v2/sports/soccer/$slug/scoreboard?dates=20260601-20260731&limit=100" | jq '.events|length')
  echo "$slug: $n events"
done
```

**Worked example (re-run 2026-07-06, summer-2026 range):**

```
fifa.world: 100 events
uefa.nations: 0 events
conmebol.america: 0 events
concacaf.gold: 0 events
```

This is the probe that established only `fifa.world` had summer-2026 data,
which is why `src/lib/sports.ts` treats it as the primary international slug.
The three zeros are dated negatives — those competitions simply aren't playing
in summer 2026 (World Cup year), not proof the slugs are dead. Re-probe before
declaring a slug useless in a different season. (`limit=100` caps the count —
fifa.world hitting exactly 100 means "at least 100".)

## 4. Recipe: audit the tennis keyword classifier

The surface/tier logic in `src/app/api/atp-schedule/route.ts` is pure keyword
matching — it drifts as sponsors rename tournaments. Audit it with:

```bash
node .claude/skills/website-api-probing-toolkit/scripts/audit-tennis-classification.mjs        # default year 2026
node .claude/skills/website-api-probing-toolkit/scripts/audit-tennis-classification.mjs 2027   # future season
```

Zero deps (Node 18+ global fetch). It fetches the ATP+WTA scoreboards exactly
like the route does, re-runs the same keyword logic (lists are a **verbatim
snapshot dated 2026-07-06** — the route file is the source of truth; re-copy
before trusting results if the route changed), and prints every tournament as
`name | surface | tier | tour` sorted by start date.

**Output sample (run 2026-07-06):**

```
# ATP raw events: 60, WTA raw events: 100
# Skipped: 37 WTA-125/ITF, 1 ATP-excluded
# Classified rows: 122
2026-01-11  Australian Open | hard | grand-slam | atp
2026-02-21  Abierto Mexicano Telcel presentado por HSBC | grass | atp-500 | atp
2026-06-13  HSBC Championships | grass | atp-500 | atp
2026-06-22  Wimbledon | grass | grand-slam | atp
2026-07-06  Nordea Open | clay | atp-500 | atp
```

**How to spot a suspect row — check date against surface season:**

- Feb–Mar and Aug–Sep should be hard; April–early June clay; June–early July
  grass; Oct–Nov hard-indoor.
- The sample above contains a real hit: *Abierto Mexicano Telcel presentado
  por HSBC* (Acapulco, February) classified **grass** because the name
  contains the substring `hsbc` from `GRASS_KEYWORDS` (meant for Queen's).
  Acapulco is a hard court. That's exactly the class of bug commit `104d400`
  fixed a batch of.
- Counter-example: *Nordea Open* on clay in July looks seasonally odd but is
  correct — Båstad really is clay. Seasonality flags candidates; confirm each
  against the real tournament before editing keywords.
- Also scan for cross-tour bleed: the same event name appearing in both tours
  with different tiers is normal (Brisbane: ATP 250 / WTA 500), but the same
  name with different *surfaces* is always a bug.

## 5. Recipe: Spotify token sanity probe

Answers "are the credentials in `.env.local` still valid?" without touching
app code. Never echo the values — export them and use `$VARS`:

```bash
# Load names from .env.local without printing values
export $(grep -E '^SPOTIFY_' /Users/abhinavp403/Documents/Website/.env.local | xargs)

# Step 1: refresh-token flow → access token (expect JSON with access_token)
ACCESS_TOKEN=$(curl -s -X POST "https://accounts.spotify.com/api/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -u "$SPOTIFY_CLIENT_ID:$SPOTIFY_CLIENT_SECRET" \
  -d "grant_type=refresh_token&refresh_token=$SPOTIFY_REFRESH_TOKEN" \
  | jq -r '.access_token')
[ "$ACCESS_TOKEN" != "null" ] && echo "token: OK" || echo "token: FAILED"

# Step 2: one top-tracks call (expect items[].name; 401 = bad/expired token)
curl -s "https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=short_term" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '{status: (.error.status // "OK"), tracks: [.items[]?.name]}'
```

Failure decode: step 1 returns `{"error":"invalid_grant"}` → refresh token
revoked (re-run the OAuth consent flow); step 1 OK but step 2 gives 403 →
token lacks the `user-top-read` scope. Vars: `SPOTIFY_CLIENT_ID`,
`SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN` (names verified in
`.env.local` and `src/app/api/spotify/route.ts`, 2026-07-06).

## 6. Recipe: local route shape probe (before/after tool)

Before any dependency upgrade or route refactor, snapshot every route's
top-level keys; re-run after and diff — a changed key set is a broken contract
for the components consuming it.

```bash
npm run dev   # in another terminal — requires a running dev server
bash .claude/skills/website-api-probing-toolkit/scripts/probe-route-shapes.sh
```

**Live output (run 2026-07-06 against a running dev server):**

```
# Route shape probe — http://localhost:3000 — 2026-07-06
/api/atp-schedule   -> ["tournaments"]
/api/cricket        -> ["configured","matches"]
/api/fact           -> ["fact"]
/api/games          -> ["games"]
/api/spotify        -> ["artists","configured","tracks"]
/api/tennis         -> ["matches"]
/api/wordofday      -> ["date","definition","example","explanation","partOfSpeech","phonetics","url","word"]
```

Without a dev server the script exits with
`ERROR: no server reachable at http://localhost:3000` (verified). Spotify and
cricket return their fallback shape when keys are missing — record that too;
`configured: false` in the body is the tell.

## 7. External endpoint inventory (verified via source grep, 2026-07-06)

Data endpoints the server code actually fetches (`grep -rE 'https://' src/`;
excludes static assets — Unsplash/IPL logo images, GitHub release links,
three.js CDN):

| Endpoint | Used by | Auth | Probe one-liner |
|---|---|---|---|
| `site.api.espn.com/.../soccer/{slug}/scoreboard` (also `basketball/nba`, `football/nfl`) | `src/lib/sports.ts` (→ `/api/games`) | none | `curl -s "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard" \| jq '.events\|length'` |
| `site.api.espn.com/.../tennis/atp/scoreboard` (and `tennis/wta`) | `src/app/api/atp-schedule/route.ts`, `src/app/api/tennis/route.ts` | none | `curl -s "https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard?dates=20260101-20261231&limit=100" \| jq '.events\|length'` |
| `api.jolpi.ca/ergast/f1/current/next.json` | `src/lib/sports.ts` (F1) | none | `curl -s "https://api.jolpi.ca/ergast/f1/current/next.json" \| jq '.MRData.RaceTable.Races[0].raceName'` |
| `api.cricapi.com/v1/series_info`, `/v1/currentMatches` | `src/app/api/cricket/route.ts` | `apikey` query param (`$CRICAPI_KEY`) | `curl -s "https://api.cricapi.com/v1/currentMatches?apikey=$CRICAPI_KEY&offset=0" \| jq '.status'` |
| `accounts.spotify.com/api/token` | `src/app/api/spotify/route.ts` | Basic (client id/secret) + refresh token | recipe 5, step 1 |
| `api.spotify.com/v1/me/top/{artists,tracks}` | `src/app/api/spotify/route.ts` | Bearer access token | recipe 5, step 2 |
| `www.dictionary.com/word-of-the-day` | `src/app/api/wordofday/route.ts` | none (HTML scrape, not JSON) | `curl -s "https://www.dictionary.com/word-of-the-day" \| grep -c 'word-of-the-day'` |
| `uselessfacts.jsph.pl/api/v2/facts/random?language=en` | `src/app/api/fact/route.ts` | none | `curl -s "https://uselessfacts.jsph.pl/api/v2/facts/random?language=en" \| jq '.text'` |

Firebase (client SDK, `NEXT_PUBLIC_FIREBASE_*`) runs in the browser, not via
server fetch — not probe-able with curl from here.

## Provenance and maintenance

- All command outputs quoted above are real runs from **2026-07-06**. ESPN is
  undocumented; shapes and slug behavior can change without notice — treat any
  quoted output older than a season as a hypothesis to re-verify, not a fact.
- Keyword lists in `audit-tennis-classification.mjs` are a snapshot; source of
  truth is `src/app/api/atp-schedule/route.ts`.
- Re-verify each script still runs:
  - `node .claude/skills/website-api-probing-toolkit/scripts/audit-tennis-classification.mjs | head -8` — expect header lines with non-zero event counts.
  - `bash .claude/skills/website-api-probing-toolkit/scripts/probe-route-shapes.sh` — with dev server up, expect 7 `/api/... -> [keys]` lines; without, the ERROR line.
- Never print secret values. Load env vars from `.env.local` with the
  `export $(grep ... | xargs)` pattern and reference `$VAR` names only.
