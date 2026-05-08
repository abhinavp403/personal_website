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
  sport: "football" | "cricket" | "basketball" | "formula1" | "tennis";
  venue?: string;
}

// ─── Favourite teams ──────────────────────────────────────────────────────────
// ESPN league slugs: eng.1=EPL, esp.1=La Liga, usa.1=MLS, nba=NBA
const FOOTBALL_TEAMS = [
  { name: "Manchester United", league: "eng.1" },
  { name: "Barcelona",         league: "esp.1" },
  { name: "Inter Miami",       league: "usa.1" },
];
const BASKETBALL_TEAMS = [
  { name: "Celtics", league: "nba" },
];
const NFL_TEAMS = [
  { name: "Patriots" },
  { name: "Eagles"   },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function dateRange(daysAhead = 75) {
  const from = new Date();
  const to   = new Date(Date.now() + daysAhead * 86400000);
  const fmt  = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");
  return `${fmt(from)}-${fmt(to)}`;
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
    const range = dateRange();
    const base  = sport === "basketball"
      ? "basketball/nba"
      : `soccer/${leagueSlug}`;
    const url   = `https://site.api.espn.com/apis/site/v2/sports/${base}/scoreboard?dates=${range}&limit=200`;

    const res  = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();
    const events: Record<string, unknown>[] = data.events ?? [];
    const leagueName = (data.leagues as Record<string, unknown>[])?.[0]?.abbreviation as string | undefined;

    const match = events
      .sort((a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime())
      .find((e) => {
        const competitors = (
          (e.competitions as Record<string, unknown>[])?.[0]?.competitors
        ) as Record<string, unknown>[] | undefined;
        return competitors?.some((c) => {
          const name = (c?.team as Record<string, unknown>)?.displayName;
          return typeof name === "string" && name.toLowerCase().includes(teamKeyword.toLowerCase());
        });
      });

    return match ? parseEvent(match, sport === "basketball" ? "basketball" : "football", leagueName) : null;
  } catch {
    return null;
  }
}

// ─── NFL: next Patriots game ──────────────────────────────────────────────────
async function findNextNFLGame(teamKeyword: string): Promise<GameEvent | null> {
  try {
    const range = dateRange(270); // wide window to catch upcoming season
    const url   = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${range}&limit=200`;

    const res  = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();
    const events: Record<string, unknown>[] = data.events ?? [];

    const match = events
      .sort((a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime())
      .find((e) => {
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
    ...BASKETBALL_TEAMS.map((t) => findNextGame(t.league, "basketball", t.name)),
    ...NFL_TEAMS.map((t)        => findNextNFLGame(t.name)),
    fetchF1NextRace(),
  ]);

  return results
    .filter((r): r is PromiseFulfilledResult<GameEvent | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((g): g is GameEvent => g !== null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
