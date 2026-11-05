export interface TennisMatch {
  id: string;
  player1: string;
  player2: string;
  player1Flag?: string;
  player2Flag?: string;
  tournament: string;
  date: string;
  venue?: string;
}

export interface GameEvent {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  date: string;
  league: string;
  sport: "soccer" | "football" | "cricket" | "basketball" | "formula1" | "tennis";
  venue?: string;
}

// ─── Favourite teams ──────────────────────────────────────────────────────────
// ESPN league slugs: eng.1=EPL, esp.1=La Liga, usa.1=MLS, nba=NBA
const FOOTBALL_TEAMS = [
  { name: "Manchester United", league: "eng.1" },
  { name: "Barcelona",         league: "esp.1" },
  { name: "Inter Miami",       league: "usa.1" },
];
const NATIONAL_TEAMS = [
  "Argentina", "France", "Spain", "Brazil", "England", "Germany",
];
const BASKETBALL_TEAMS = [
  { name: "Celtics", league: "nba" },
  { name: "76ers",   league: "nba" },
];
const NFL_TEAMS = [
  { name: "Patriots" },
  { name: "Eagles"   },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";

// Months (YYYYMM) from today through daysAhead from now
function monthsAhead(daysAhead: number): string[] {
  const end    = new Date(Date.now() + daysAhead * 86400000);
  const cursor = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
  const months: string[] = [];
  while (cursor <= end) {
    months.push(`${cursor.getUTCFullYear()}${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

// ESPN's team-sport scoreboards reject YYYYMMDD-YYYYMMDD ranges (HTTP 400,
// observed 2026-11-03) but accept whole months, so fetch each month in the
// window and merge. Events before today are dropped.
async function fetchScoreboard(path: string, daysAhead = 75) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const pages = await Promise.all(
    monthsAhead(daysAhead).map((m) =>
      fetch(`${ESPN_BASE}/${path}/scoreboard?dates=${m}&limit=1000`, { next: { revalidate: 3600 } })
        .then((r) => (r.ok ? r.json() : { events: [] }))
        .catch(() => ({ events: [] }))
    )
  );
  const events: Record<string, unknown>[] = pages
    .flatMap((p) => p.events ?? [])
    .filter((e: Record<string, unknown>) => new Date(e.date as string) >= today);
  const leagueName = pages
    .map((p) => (p.leagues as Record<string, unknown>[] | undefined)?.[0]?.abbreviation as string | undefined)
    .find(Boolean);
  return { events, leagueName };
}

function parseEvent(
  e: Record<string, unknown>,
  sport: GameEvent["sport"],
  leagueName?: string,
): GameEvent {
  const comp        = (e.competitions as Record<string, unknown>[])[0];
  const competitors = (comp.competitors as Record<string, unknown>[]) ?? [];
  const home        = competitors.find((c) => c.homeAway === "home");
  const away        = competitors.find((c) => c.homeAway === "away");
  const homeTeam    = home?.team as Record<string, unknown>;
  const awayTeam    = away?.team as Record<string, unknown>;
  const venue       = (comp.venue as Record<string, unknown>)?.fullName as string | undefined;
  const league      = leagueName ?? (e.league as Record<string, unknown>)?.name as string ?? sport;

  return {
    id:        String(e.id),
    homeTeam:  String(homeTeam?.displayName ?? ""),
    awayTeam:  String(awayTeam?.displayName ?? ""),
    homeLogo:  homeTeam?.logo as string | undefined,
    awayLogo:  awayTeam?.logo as string | undefined,
    date:      String(e.date),
    league,
    sport,
    venue:     venue ?? undefined,
  };
}

// ─── Scoreboard search ────────────────────────────────────────────────────────
async function findNextGame(
  leagueSlug: string,
  sport: "football" | "basketball",
  teamKeyword: string
): Promise<GameEvent | null> {
  try {
    const base = sport === "basketball"
      ? "basketball/nba"
      : `soccer/${leagueSlug}`;
    const { events, leagueName } = await fetchScoreboard(base);

    const match = events
      .sort((a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime())
      .find((e) => {
        const completed = (e.status as Record<string, unknown>)?.type as Record<string, unknown>;
        if (completed?.completed === true) return false;
        const competitors = (
          (e.competitions as Record<string, unknown>[])?.[0]?.competitors
        ) as Record<string, unknown>[] | undefined;
        return competitors?.some((c) => {
          const name = (c?.team as Record<string, unknown>)?.displayName;
          return typeof name === "string" && name.toLowerCase().includes(teamKeyword.toLowerCase());
        });
      });

    return match ? parseEvent(match, sport === "basketball" ? "basketball" : "soccer", leagueName) : null;
  } catch {
    return null;
  }
}

// ─── NFL: next Patriots game ──────────────────────────────────────────────────
async function findNextNFLGame(teamKeyword: string): Promise<GameEvent | null> {
  try {
    const { events } = await fetchScoreboard("football/nfl", 270); // wide window to catch upcoming season

    const match = events
      .sort((a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime())
      .find((e) => {
        const completed = (e.status as Record<string, unknown>)?.type as Record<string, unknown>;
        if (completed?.completed === true) return false;
        const competitors = (
          (e.competitions as Record<string, unknown>[])?.[0]?.competitors
        ) as Record<string, unknown>[] | undefined;
        return competitors?.some((c) => {
          const name = (c?.team as Record<string, unknown>)?.displayName;
          return typeof name === "string" && name.toLowerCase().includes(teamKeyword.toLowerCase());
        });
      });

    return match ? parseEvent(match, "football", "NFL") : null;
  } catch {
    return null;
  }
}

// ─── National teams: search FIFA World Cup + international competitions ────────
async function findNextNationalGame(teamName: string): Promise<GameEvent | null> {
  const leagues = ["fifa.world", "uefa.nations", "conmebol.america", "concacaf.gold"];
  try {
    const results = await Promise.all(leagues.map((league) => fetchScoreboard(`soccer/${league}`, 120)));
    let match: Record<string, unknown> | undefined;
    let leagueName = "International";
    const sortedPairs: Array<{ event: Record<string, unknown>; league: string }> = results
      .flatMap((d) => d.events.map((e) => ({ event: e, league: d.leagueName ?? "International" })))
      .sort((a, b) => new Date(a.event.date as string).getTime() - new Date(b.event.date as string).getTime());
    const pair = sortedPairs.find(({ event: e }) => {
      const completed = (e.status as Record<string, unknown>)?.type as Record<string, unknown>;
      if (completed?.completed === true) return false;
      const competitors = (
        (e.competitions as Record<string, unknown>[])?.[0]?.competitors
      ) as Record<string, unknown>[] | undefined;
      return competitors?.some((c) => {
        const name = (c?.team as Record<string, unknown>)?.displayName;
        return typeof name === "string" && name.toLowerCase().includes(teamName.toLowerCase());
      });
    });
    if (pair) { match = pair.event; leagueName = pair.league; }
    return match ? parseEvent(match, "soccer", leagueName) : null;
  } catch {
    return null;
  }
}

// ─── F1: next Grand Prix (no favourite team — just the next race) ─────────────
async function fetchF1NextRace(): Promise<GameEvent | null> {
  try {
    const res  = await fetch("https://api.jolpi.ca/ergast/f1/current/next.json", {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    const race = data?.MRData?.RaceTable?.Races?.[0];
    if (!race) return null;

    return {
      id:       `f1-${race.round}`,
      homeTeam: race.raceName,
      awayTeam: `Round ${race.round}`,
      date:     `${race.date}T${race.time ?? "12:00:00Z"}`,
      league:   "Formula 1",
      sport:    "formula1",
      venue:    `${race.Circuit.circuitName}, ${race.Circuit.Location.country}`,
    };
  } catch {
    return null;
  }
}

// ─── Public entry point ───────────────────────────────────────────────────────
export async function getUpcomingGames(): Promise<GameEvent[]> {
  const results = await Promise.allSettled([
    ...FOOTBALL_TEAMS.map((t)   => findNextGame(t.league, "football",   t.name)),
    ...NATIONAL_TEAMS.map((t)   => findNextNationalGame(t)),
    ...BASKETBALL_TEAMS.map((t) => findNextGame(t.league, "basketball", t.name)),
    ...NFL_TEAMS.map((t)        => findNextNFLGame(t.name)),
    fetchF1NextRace(),
  ]);

  const games = results
    .filter((r): r is PromiseFulfilledResult<GameEvent | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((g): g is GameEvent => g !== null);

  // Two favourite teams can face each other (e.g. two national teams in the
  // same match), which resolves to the same underlying event id via separate
  // searches — dedupe so it isn't shown twice.
  const seen = new Set<string>();
  const deduped = games.filter((g) => {
    if (seen.has(g.id)) return false;
    seen.add(g.id);
    return true;
  });

  return deduped.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
