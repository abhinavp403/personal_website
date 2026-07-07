---
name: sports-data-reference
description: >-
  Domain reference for the external data APIs and sports-domain structure used
  by this personal website. Load when working with ESPN endpoints or league
  slugs (eng.1, esp.1, usa.1, fifa.world, nfl, nba, tennis/atp, tennis/wta),
  tennis tournament tiers/surfaces (grand slam, masters 1000, ATP/WTA 500/250,
  WTA 125, clay/grass/hard), the favourite-teams system in src/lib/sports.ts,
  or the Spotify / Dictionary.com / CricAPI / F1 (jolpi.ca) / Firebase
  integrations — or when interpreting why fixture data looks wrong, empty, or
  mis-tiered. When NOT to use: for HOW to probe/curl these APIs safely use
  website-api-probing-toolkit; for cache/revalidate policy decisions use
  website-caching-and-freshness; for symptom-driven triage of a broken section
  use website-debugging-playbook. This skill is the "what the data means" pack,
  not the tooling or triage pack.
---

# Sports Data Reference

Domain knowledge pack for the data layer of this site. Everything here was
verified against source code and live API responses on **2026-07-06**. Facts
marked *(volatile)* can drift silently — re-verify with the curls in
"Provenance and maintenance" before relying on them.

Key source files:

- `src/lib/sports.ts` — favourite teams, ESPN scoreboard fetching/parsing, F1
- `src/app/api/games/route.ts` — thin wrapper around `getUpcomingGames()`
- `src/app/api/atp-schedule/route.ts` — tennis season calendar (surface/tier derivation)
- `src/app/api/tennis/route.ts` — upcoming matches for watched players
- `src/app/api/cricket/route.ts` — CricAPI (IPL + India internationals)
- `src/app/api/spotify/route.ts` + `src/app/api/spotify/callback/route.ts`
- `src/app/api/wordofday/route.ts` — Dictionary.com scrape
- `src/lib/firebase.ts` + `src/components/Interests.tsx` — Firestore movies/shows

Consumed by `UpcomingGames.tsx` (Upcoming Fixtures section) and
`ATPSchedule.tsx` (Tennis Schedule section).

---

## 1. ESPN unofficial site API

Base URL: `https://site.api.espn.com/apis/site/v2/sports/`

This is ESPN's **unofficial** site API — the same JSON their own website uses.
There is **no auth, no API key, no SLA, no documentation, and no versioning
promise**. Endpoints and JSON shapes can change or disappear silently. Treat
every claim in this section as *(volatile)* and empirically derived.

### Endpoint anatomy

```
https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/scoreboard?dates=YYYYMMDD-YYYYMMDD&limit=N
```

- `{sport}/{league}` — e.g. `soccer/eng.1`, `football/nfl`, `basketball/nba`, `tennis/atp`
- `dates` — a single day `YYYYMMDD` or a range `YYYYMMDD-YYYYMMDD`
- `limit` — max events returned; this repo uses 100–200 depending on route.
  If a wide date range has more events than `limit`, events are silently
  truncated — a team's next game can be missing simply because the window was
  too big for the limit.

### League slugs used in this repo

| Slug | Competition | Where used |
|---|---|---|
| `soccer/eng.1` | English Premier League | `FOOTBALL_TEAMS` (Manchester United) |
| `soccer/esp.1` | La Liga | `FOOTBALL_TEAMS` (Barcelona) |
| `soccer/usa.1` | MLS | `FOOTBALL_TEAMS` (Inter Miami) |
| `soccer/fifa.world` | FIFA World Cup | national-team search |
| `soccer/uefa.nations` | UEFA Nations League | national-team search |
| `soccer/conmebol.america` | Copa América | national-team search |
| `soccer/concacaf.gold` | CONCACAF Gold Cup | national-team search |
| `football/nfl` | NFL | `NFL_TEAMS` (Patriots, Eagles) |
| `basketball/nba` | NBA | `BASKETBALL_TEAMS` (Celtics) |
| `tennis/atp` | ATP men's tour | `api/tennis`, `api/atp-schedule` |
| `tennis/wta` | WTA women's tour | `api/atp-schedule` |

Soccer slugs follow a `country.tier` convention (`eng.1` = England tier 1);
international tournaments use `confederation.name` style. There are many more
slugs than listed here — these are just the ones this repo touches.

---

## 2. ESPN event JSON — the two shapes this repo relies on

### 2a. Team-sport scoreboard (soccer / NFL / NBA)

One `events[]` entry = one game. Fields the parsing code
(`parseEvent`/`findNextGame` in `src/lib/sports.ts`) actually reads:

```jsonc
{
  "leagues": [ { "abbreviation": "Premier League" } ],   // used as league label
  "events": [
    {
      "id": "740123",
      "date": "2026-08-21T19:00Z",                        // ISO UTC
      "name": "Coventry City at Arsenal",
      "status": { "type": { "completed": false } },       // CRITICAL — see below
      "competitions": [
        {
          "venue": { "fullName": "Emirates Stadium" },
          "competitors": [
            { "homeAway": "home", "team": { "displayName": "Arsenal",       "logo": "https://…png" } },
            { "homeAway": "away", "team": { "displayName": "Coventry City", "logo": "https://…png" } }
          ]
        }
      ]
    }
  ]
}
```

(Verified live 2026-07-06 against `soccer/eng.1`.)

**CRITICAL — `status.type.completed`:** a `dates=` range query starting today
still returns games already played today (and any past dates in the range).
Every consumer in this repo sorts events by date ascending and **skips any
event where `status.type.completed === true`** before picking the first
match. If you write new ESPN-consuming code and forget this filter, a
finished game will show up as "upcoming" — this exact bug class has occurred
here before (see website-failure-archaeology).

Other shape notes:

- `competitors[]` order is not guaranteed; find home/away via the
  `homeAway` field, never by index.
- `leagues[0].abbreviation` is used as the display league name. Despite the
  key name it can be a full name ("Premier League").
- `competitions[0]` is the only competition consulted; team sports have one.

### 2b. Tennis scoreboard (different shape!)

For `tennis/atp` and `tennis/wta`, one `events[]` entry = one **tournament**,
not one match. A full-year query (`dates=20260101-20261231&limit=100`)
returns the season calendar (~60 raw ATP events; the WTA feed hits the
`limit=100` cap because it includes 125-level/ITF noise that the route
filters out). Fields used:

```jsonc
{
  "events": [
    {
      "id": "412",
      "name": "Mutua Madrid Open",              // SPONSOR-BRANDED — see §3
      "date": "2026-04-20T…", "endDate": "2026-05-04T…",
      "major": false,                           // true only for the 4 Grand Slams
      "venue": { "displayName": "Madrid, Spain" },   // NOTE: displayName, not fullName
      "groupings": [                            // individual matches live in here
        { "competitions": [
            {
              "id": "…", "date": "…",
              "status": { "type": { "state": "pre" } },  // "pre" | "in" | "post"
              "venue": { "fullName": "…" },
              "competitors": [
                { "athlete": { "displayName": "Jannik Sinner", "flag": { "href": "…png" } } },
                { "athlete": { "displayName": "…" } }
              ]
            }
        ] }
      ]
    }
  ]
}
```

- `api/atp-schedule` reads only tournament-level fields (`name`, `date`,
  `endDate`, `major`, `venue.displayName`).
- `api/tennis` drills into `groupings[].competitions[]` for individual
  matches, filters out completed ones via `status.type.state === "post"`
  (note: **state string**, not the `completed` boolean used for team sports),
  and keeps only matches involving `WATCH_PLAYERS = ["sinner", "alcaraz",
  "djokovic"]` (substring match on `athlete.displayName`, 90-day window).

---

## 3. Tennis tour structure (domain knowledge ESPN does not give you)

### The tours and season

- **ATP** = men's tour, **WTA** = women's tour. Both run roughly
  **January–November** (Australian swing → clay spring → grass Jun–Jul →
  North American hard → Asian swing → indoor autumn → Finals), with December
  off.
- **Tiers**, best to smallest:
  1. **Grand Slam** (4/year: Australian Open, Roland Garros, Wimbledon, US Open) — ESPN marks these with `major: true`; the only tier signal ESPN provides.
  2. **Masters 1000** (ATP) / **WTA 1000**
  3. **ATP 500 / WTA 500**
  4. **ATP 250 / WTA 250** (default assumption)
  5. **Tour Finals** (Nitto ATP Finals, WTA Finals, Next Gen ATP Finals) — special tier.
  6. **WTA 125** — developmental tier (minor-league). **Excluded entirely from this site** via a blocklist.
- **Surfaces**: clay, grass, outdoor hard, indoor hard. Seasonal: clay in
  spring (roughly Feb S.America + Apr–May Europe), grass only ~Jun–mid-Jul,
  hard the rest of the year, indoor hard concentrated in Oct–Nov.

### The core problem: ESPN provides NO tier or surface fields

Apart from `major: true` on Slams, tier and surface are **derived in
`src/app/api/atp-schedule/route.ts` by keyword-matching the tournament
name**. And ESPN uses **sponsor-branded names**, so you must know the
sponsor→tournament mapping. Verified live examples (2026-07-06 feed):

- "Terra Wortmann Open" = Halle, Germany → grass ATP 500
- "HSBC Championships" = Queen's Club, London → grass 500
- "Mutua Madrid Open" = Madrid → clay Masters/WTA 1000
- "Nordea Open" = Båstad, Sweden → clay ATP 250
- "Abierto Mexicano Telcel presentado por HSBC" = Acapulco → hard ATP 500

Sponsors change between seasons *(volatile)* — when they do, the keyword
lists silently stop matching and tournaments fall back to defaults
(outdoor hard / 250).

### The three keyword systems in api/atp-schedule/route.ts

All matching is `name.toLowerCase().includes(keyword)` substring matching.

1. **Surface** — `getSurface()`: checks `GRASS_KEYWORDS`, then
   `CLAY_KEYWORDS`, then `INDOOR_HARD_KEYWORDS` (conservative,
   confirmed-venues-only list), **default `"hard"` (outdoor)**. Order
   matters: grass wins over clay wins over indoor.
2. **Tier** — `getTier()`: `major` → grand-slam; `TIER_FINALS_KEYWORDS` →
   tour-finals; then tour-specific lists `ATP_TIER_1000`/`ATP_TIER_500` or
   `WTA_TIER_1000`/`WTA_TIER_500`; **default `"atp-250"`**. ATP and WTA lists
   differ because the same city can be a different tier per tour (e.g.
   Guadalajara: ATP list has it as 1000, WTA as 500; Doha/Dubai are WTA 1000
   in 2026 but ATP 500).
3. **Exclusion blocklists** — `WTA_125_KEYWORDS` drops developmental WTA 125
   events from the WTA feed; `ATP_EXCLUDE_KEYWORDS` drops events removed
   from the 2026 ATP calendar (currently just "estoril") *(volatile)*.

### Gotcha: the same event appears in BOTH the atp and wta feeds

ESPN's tennis feeds are not cleanly split by tour. Combined ATP/WTA events —
and even some pure ATP events — show up in the WTA feed too. This is why the
`WTA_125_KEYWORDS` blocklist contains ATP entries like `"nordea open"` (ATP
Båstad) and `"hall of fame"` (ATP Newport): they must be filtered out of the
WTA parse to avoid duplicate tournaments with a wrong `tour: "wta"` tag.
Before touching any of the keyword lists, load website-failure-archaeology —
several past keyword changes were reverted.

---

## 4. Favourite-teams system (src/lib/sports.ts)

`getUpcomingGames()` fans out with `Promise.allSettled` (one failed feed
never blanks the section), picks **one next game per favourite**, and sorts
the combined list by date.

Team lists (edit these constants to change whose fixtures appear):

| Constant | Contents (2026-07-06) | Search space | Date window |
|---|---|---|---|
| `FOOTBALL_TEAMS` | Manchester United (eng.1), Barcelona (esp.1), Inter Miami (usa.1) | that club's league scoreboard only | default **75 days** |
| `NATIONAL_TEAMS` | Argentina, France, Spain, Brazil, England, Germany (names only, no slug) | all 4 international slugs (`fifa.world`, `uefa.nations`, `conmebol.america`, `concacaf.gold`) in parallel, merged + date-sorted | **120 days** |
| `BASKETBALL_TEAMS` | Celtics (nba) | `basketball/nba` scoreboard | default **75 days** |
| `NFL_TEAMS` | Patriots, Eagles | `football/nfl` scoreboard | **270 days** (wide, to bridge the Feb–Sep off-season gap) |

Windows come from `dateRange(daysAhead)` — default parameter is 75;
`findNextNFLGame` passes 270, `findNextNationalGame` passes 120.

**Matching rule**: case-insensitive **substring** match of the configured
name against `team.displayName`. Consequences:

- Short names are deliberate ("Celtics" matches "Boston Celtics";
  "Patriots" matches "New England Patriots").
- Substrings can over-match: a NATIONAL_TEAMS entry like "England" would
  match any displayName containing it — safe today because the search space
  is only the 4 international soccer slugs, but keep this in mind when
  adding teams.
- A club is missed entirely if its game is outside the window, beyond the
  `limit=200` truncation, or in a competition the slug doesn't cover
  (e.g. Manchester United's Champions League games are invisible — only
  eng.1 is searched).

F1 is the odd one out: no favourite, just the next race, via a different API
(see §5).

---

## 5. Other integrations

### Spotify (`api/spotify` + `api/spotify/callback`)

**Auth model**: refresh-token OAuth. Three env vars: `SPOTIFY_CLIENT_ID`,
`SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`. On each request the route
POSTs `grant_type=refresh_token` to `https://accounts.spotify.com/api/token`
(Basic auth = base64 `clientId:clientSecret`) with `cache: "no-store"` — the
short-lived access token must never be cached. It then fetches
`GET /v1/me/top/artists` and `/v1/me/top/tracks` with
`limit=5&time_range=short_term` (short_term ≈ last 4 weeks of listening).
Route-level `revalidate = 3600`. Returns `{ configured: false }` when env
vars are absent or still the placeholder value — the UI hides the section
rather than erroring.

**The callback route** (`api/spotify/callback`) exists only to (re-)obtain a
refresh token: visit Spotify's authorize URL with redirect URI
`http://127.0.0.1:3000/api/spotify/callback`, and the route exchanges the
`code` (`grant_type=authorization_code`) and renders the new
`SPOTIFY_REFRESH_TOKEN` in an HTML page to paste into `.env.local` / Heroku
config. Needed when: setting up a new environment, changing OAuth scopes, or
the refresh token is revoked (user revoked app access, or Spotify secret
rotation). Refresh tokens otherwise don't expire in normal use.

### F1 — jolpi.ca Ergast mirror (`fetchF1NextRace` in src/lib/sports.ts)

`GET https://api.jolpi.ca/ergast/f1/current/next.json` — a community-run
mirror of the retired Ergast API (ergast.com shut down after 2024)
*(volatile — community project, no SLA)*. Shape:
`MRData.RaceTable.Races[0]` with `raceName`, `round`, `date` (YYYY-MM-DD),
`time` (may be absent → code defaults to `12:00:00Z`), and
`Circuit.circuitName` / `Circuit.Location.country`. Mapped into a `GameEvent`
where `homeTeam` = race name and `awayTeam` = "Round N" (display hack).
Verified live 2026-07-06: next race = Belgian Grand Prix, round 10.

### CricAPI (`api/cricket`)

Requires `CRICAPI_KEY` env var (route returns `{ configured: false }`
without it; free tier has a daily request quota). Two endpoints:

1. `GET https://api.cricapi.com/v1/series_info?apikey=…&id=…` with the
   hardcoded IPL 2026 series id
   `87c62aac-bc3c-4738-ab93-19da0690488f` *(volatile — must be updated each
   IPL season)*. Finds the next upcoming match for each of
   `IPL_TEAMS = ["Mumbai Indians", "Royal Challengers Bengaluru"]`
   (matched on the first two words, lowercase).
2. `GET https://api.cricapi.com/v1/currentMatches?apikey=…&offset=0` — next
   upcoming **India international** (any match whose teams include "india"
   and whose `matchType` is not `ipl`).

**Time-zone gotcha (settled — do not re-fight)**: CricAPI's `dateTimeGMT` is
UTC but has **no `Z` suffix**, so `new Date()` would parse it as local time.
The route appends `"Z"` before parsing. `revalidate = 1800`.

### Dictionary.com Word of the Day (`api/wordofday`)

**Not an API** — an HTML scrape of `https://www.dictionary.com/word-of-the-day`
(with a bot User-Agent), parsed by regex against CSS class names
(`wotd-entry-headword`, `wotd-entry-phonetics`, `wotd-entry-pos`,
`wotd-entry-definition`, `wotd-entry-example`,
`wotd-entry-explanation-section`) *(volatile — breaks whenever
Dictionary.com redesigns; a 500 from this route usually means the class
names changed)*. Caching is deliberate: `dynamic = "force-dynamic"` plus a
module-level **in-memory cache keyed by UTC date** — at most one upstream
fetch per calendar day per server process, and the word flips exactly at UTC
midnight. Do not "simplify" this to `revalidate` (see
website-failure-archaeology).

### Firebase Firestore (movies/shows in `Interests.tsx`)

Client-side Firebase Web SDK (`src/lib/firebase.ts`), configured entirely
from `NEXT_PUBLIC_FIREBASE_*` env vars (public by design — Firebase web
config is not a secret; security lives in Firestore rules, which allow
public **read** on this data). `Interests.tsx` reads two collections:
`interests/current/movies` and `interests/current/shows`, sorts docs by doc
id (ids are ordering keys), and falls back to hardcoded defaults in the
component if both are empty or the fetch fails. Content updates happen by
editing documents in the Firebase console — no code change needed.

### Not sports, for completeness

`api/fact` also exists under `src/app/api/` — unrelated to sports data; read
the route directly if you need it.

---

## 6. Seasonal calendar — "empty section" is usually just off-season

Before debugging an empty Upcoming Fixtures card, check whether anything is
actually scheduled inside that feed's date window:

| Feed | In season | Off / empty |
|---|---|---|
| Club soccer (EPL, La Liga) | mid-Aug – late May | Jun–mid-Aug (MLS differs: runs Feb–Nov/Dec) |
| National teams | international windows (Mar, Jun, Sep, Oct, Nov) + summer tournaments; **World Cup Jun–Jul 2026** | most other weeks |
| NFL | early Sep – mid-Feb (Super Bowl) | mid-Feb – Aug (hence the 270-day window) |
| NBA | late Oct – mid-Jun (Finals) | Jul–Sep |
| Tennis (ATP/WTA) | Jan – mid-Nov | mid-Nov – Dec |
| IPL cricket | roughly late Mar – May/Jun | rest of year (India internationals fill gaps) |
| F1 | Mar – early Dec | winter break; `current/next.json` returns empty `Races` after the finale |

Cross-check windows: a club-soccer favourite (75-day window) queried in
early June may legitimately return nothing until the new season's fixtures
enter the window in ~mid-June. Only after ruling out season timing should
you reach for website-debugging-playbook.

---

## Provenance and maintenance

Everything above was derived from the source files listed at the top plus
live API calls on **2026-07-06**. Re-verification one-liners (all read-only;
see website-api-probing-toolkit for probing etiquette):

```bash
# ESPN team-sport shape + completed flag + league abbreviation
curl -s "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard?dates=20260801-20260901&limit=3" | python3 -m json.tool | head -80

# ESPN tennis season calendar (tournament-level events, major flag, sponsor names)
curl -s "https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard?dates=20260101-20261231&limit=100" | python3 -c "import json,sys; [print(e['name'], e['date'][:10], e['major']) for e in json.load(sys.stdin)['events']]"

# WTA feed (check for ATP events leaking in / new 125s to blocklist)
curl -s "https://site.api.espn.com/apis/site/v2/sports/tennis/wta/scoreboard?dates=20260101-20261231&limit=100" | python3 -c "import json,sys; [print(e['name']) for e in json.load(sys.stdin)['events']]"

# F1 next race via jolpi.ca Ergast mirror
curl -s "https://api.jolpi.ca/ergast/f1/current/next.json" | python3 -m json.tool

# CricAPI (needs key from .env.local; costs one quota hit)
curl -s "https://api.cricapi.com/v1/currentMatches?apikey=$CRICAPI_KEY&offset=0" | python3 -m json.tool | head -40

# Word of the Day markup still parseable?
curl -s -A "Mozilla/5.0" https://www.dictionary.com/word-of-the-day | grep -o 'wotd-entry-[a-z-]*' | sort -u
```

Maintenance triggers:

- **Each January**: new tennis season — sponsors, tier promotions/demotions,
  and calendar changes mean auditing all keyword lists in
  `api/atp-schedule/route.ts` and the `dates=` year range hardcoded there
  (`20260101-20261231` as of 2026-07-06).
- **Each IPL season (~Feb)**: new `IPL_2026_SERIES_ID` in `api/cricket/route.ts`.
- **Any time a tennis tournament shows the wrong surface/tier**: a sponsor
  rename broke keyword matching — but read website-failure-archaeology
  before editing the lists.
- **ESPN shape drift**: no notice will be given; if a section empties
  mid-season, curl the endpoint and diff against §2 before touching code.
