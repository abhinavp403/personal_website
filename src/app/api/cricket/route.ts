import { NextResponse } from "next/server";

export const revalidate = 1800; // 30 min

export interface CricketMatch {
  id: string;
  name: string;
  team1: string;
  team2: string;
  date: string;        // ISO UTC string with time (dateTimeGMT)
  venue: string;
  matchType: string;   // "IPL" | "T20I" | "ODI" | "TEST"
  series: string;
  status: string;
}

// IPL 2026 series ID on CricAPI
const IPL_2026_SERIES_ID = "87c62aac-bc3c-4738-ab93-19da0690488f";

// Favourite IPL teams (substring match against team names)
const IPL_TEAMS = ["Mumbai Indians", "Royal Challengers Bengaluru"];

// ─── Fetch next IPL game for each favourite team ──────────────────────────────
async function fetchIPLMatches(apiKey: string): Promise<CricketMatch[]> {
  try {
    const res = await fetch(
      `https://api.cricapi.com/v1/series_info?apikey=${apiKey}&id=${IPL_2026_SERIES_ID}`,
      { next: { revalidate: 1800 } }
    );
    const data = await res.json();

    if (data.status !== "success") return [];

    const now = new Date();
    const matchList: Record<string, unknown>[] = data.data?.matchList ?? [];

    const results: CricketMatch[] = [];
    const found = new Set<string>();

    // Sort by date ascending so we find the NEXT upcoming match first
    const sorted = [...matchList].sort((a, b) => {
      const da = new Date((a.dateTimeGMT ?? a.date ?? "") as string).getTime();
      const db = new Date((b.dateTimeGMT ?? b.date ?? "") as string).getTime();
      return da - db;
    });

    for (const m of sorted) {
      const teams: string[] = (m.teams as string[]) ?? [];
      // Prefer dateTimeGMT (includes time) over date (date only)
      // Append Z so JavaScript always parses it as UTC, not local time
      const raw = ((m.dateTimeGMT ?? m.date ?? "") as string);
      const dateStr = raw && !raw.endsWith("Z") && !raw.includes("+") ? raw + "Z" : raw;
      const matchDate = new Date(dateStr);
      if (isNaN(matchDate.getTime()) || matchDate <= now) continue;

      const teamsStr = teams.join(" ").toLowerCase();

      for (const fav of IPL_TEAMS) {
        if (found.has(fav)) continue;
        const matchKey = fav.toLowerCase().split(" ").slice(0, 2).join(" ");
        if (!teamsStr.includes(matchKey)) continue;

        found.add(fav);
        results.push({
          id:        String(m.id ?? dateStr),
          name:      (m.name ?? "") as string,
          team1:     teams[0] ?? "",
          team2:     teams[1] ?? "",
          date:      dateStr,
          venue:     (m.venue ?? "") as string,
          matchType: "IPL",
          series:    "IPL 2026",
          status:    "Upcoming",
        });
        break;
      }

      if (found.size === IPL_TEAMS.length) break;
    }

    return results;
  } catch {
    return [];
  }
}

// ─── Fetch next India international match ────────────────────────────────────
async function fetchIndiaInternational(apiKey: string): Promise<CricketMatch | null> {
  try {
    const res = await fetch(
      `https://api.cricapi.com/v1/currentMatches?apikey=${apiKey}&offset=0`,
      { next: { revalidate: 1800 } }
    );
    const data = await res.json();
    if (data.status !== "success") return null;

    const now = new Date();
    const allMatches: Record<string, unknown>[] = data.data ?? [];

    // Look for upcoming India matches that are NOT IPL
    const sorted = [...allMatches].sort((a, b) => {
      const da = new Date((a.dateTimeGMT ?? a.date ?? "") as string).getTime();
      const db = new Date((b.dateTimeGMT ?? b.date ?? "") as string).getTime();
      return da - db;
    });

    for (const m of sorted) {
      const teams: string[] = (m.teams as string[]) ?? [];
      const raw = ((m.dateTimeGMT ?? m.date ?? "") as string);
      const dateStr = raw && !raw.endsWith("Z") && !raw.includes("+") ? raw + "Z" : raw;
      const matchDate = new Date(dateStr);
      if (isNaN(matchDate.getTime()) || matchDate <= now) continue;

      const matchType = ((m.matchType ?? "") as string).toLowerCase();
      const teamsStr  = teams.join(" ").toLowerCase();

      // Must be international (not IPL) and involve India
      if (matchType === "ipl") continue;
      if (!teamsStr.includes("india")) continue;

      return {
        id:        String(m.id ?? dateStr),
        name:      (m.name ?? "") as string,
        team1:     teams[0] ?? "",
        team2:     teams[1] ?? "",
        date:      dateStr,
        venue:     (m.venue ?? "") as string,
        matchType: matchType.toUpperCase(),
        series:    (m.series_id ?? m.series ?? m.name ?? "") as string,
        status:    "Upcoming",
      };
    }

    return null;
  } catch {
    return null;
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function GET() {
  const apiKey = process.env.CRICAPI_KEY;
  if (!apiKey) {
    return NextResponse.json({ matches: [], configured: false });
  }

  try {
    const [iplMatches, indiaMatch] = await Promise.all([
      fetchIPLMatches(apiKey),
      fetchIndiaInternational(apiKey),
    ]);

    const matches: CricketMatch[] = [
      ...iplMatches,
      ...(indiaMatch ? [indiaMatch] : []),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({ matches, configured: true });
  } catch {
    return NextResponse.json({ matches: [], configured: true, error: "Fetch failed" });
  }
}
