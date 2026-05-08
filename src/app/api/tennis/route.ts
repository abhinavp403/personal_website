import { NextResponse } from "next/server";
import type { TennisMatch } from "@/lib/sports";

export type { TennisMatch };

const WATCH_PLAYERS = ["sinner", "alcaraz", "djokovic"];

function dateRange(daysAhead = 90) {
  const from = new Date();
  const to   = new Date(Date.now() + daysAhead * 86400000);
  const fmt  = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");
  return `${fmt(from)}-${fmt(to)}`;
}

export async function GET() {
  try {
    const range = dateRange();
    const url   = `https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard?dates=${range}&limit=200`;
    const res   = await fetch(url, { next: { revalidate: 3600 } });
    const data  = await res.json();

    const events: Record<string, unknown>[] = data.events ?? [];
    const matches: TennisMatch[] = [];

    for (const event of events) {
      const tournament = event.name as string ?? "ATP Tour";
      const groupings  = (event.groupings as Record<string, unknown>[]) ?? [];

      for (const grouping of groupings) {
        const competitions = (grouping.competitions as Record<string, unknown>[]) ?? [];

        for (const comp of competitions) {
          // Skip completed matches
          const state = (comp.status as Record<string, unknown>)?.type as Record<string, unknown>;
          if ((state?.state as string) === "post") continue;

          const competitors = (comp.competitors as Record<string, unknown>[]) ?? [];
          if (competitors.length < 2) continue;

          const names = competitors.map((c) => {
            const athlete = c.athlete as Record<string, unknown> | undefined;
            return (athlete?.displayName as string ?? "").toLowerCase();
          });

          const hasWatched = names.some((n) => WATCH_PLAYERS.some((w) => n.includes(w)));
          if (!hasWatched) continue;

          const [c1, c2] = competitors;
          const a1 = c1.athlete as Record<string, unknown> | undefined;
          const a2 = c2.athlete as Record<string, unknown> | undefined;

          matches.push({
            id:          `tennis-${comp.id}`,
            player1:     (a1?.displayName as string) ?? "TBD",
            player2:     (a2?.displayName as string) ?? "TBD",
            player1Flag: (a1?.flag as Record<string, unknown>)?.href as string | undefined,
            player2Flag: (a2?.flag as Record<string, unknown>)?.href as string | undefined,
            tournament,
            date:        comp.date as string ?? event.date as string,
            venue:       (comp.venue as Record<string, unknown>)?.fullName as string | undefined,
          });
        }
      }
    }

    matches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({ matches });
  } catch {
    return NextResponse.json({ matches: [] });
  }
}
