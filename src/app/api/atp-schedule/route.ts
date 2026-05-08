import { NextResponse } from "next/server";

export interface ATPTournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  venue: string;
  surface: "clay" | "grass" | "hard";
  tier: "tour-finals" | "grand-slam" | "masters-1000" | "atp-500" | "atp-250";
  status: "past" | "live" | "upcoming";
  major: boolean;
  tour: "atp" | "wta";
}

// ── Surface detection ──────────────────────────────────────────────────────────
const CLAY_KEYWORDS = [
  "roland garros", "monte-carlo", "madrid", "barcelona", "rome", "internazionali",
  "hamburg", "munich", "bmw open", "buenos aires", "rio", "chile", "geneva", "gonet",
  "marrakech", "bucharest", "tiriac", "houston", "clay court", "estoril",
  "strasbourg", "rabat", "parma", "bogota", "warsaw", "prague",
];
const GRASS_KEYWORDS = [
  "wimbledon", "halle", "boss open", "stuttgart", "hertogenbosch", "libéma",
  "eastbourne", "mallorca", "hsbc championships", "birmingham", "bali",
];

function getSurface(name: string): ATPTournament["surface"] {
  const n = name.toLowerCase();
  if (GRASS_KEYWORDS.some((k) => n.includes(k))) return "grass";
  if (CLAY_KEYWORDS.some((k) => n.includes(k))) return "clay";
  return "hard";
}

// ── Tier detection ─────────────────────────────────────────────────────────────
const TIER_1000_KEYWORDS = [
  "indian wells", "miami open", "monte-carlo", "mutua madrid", "internazionali",
  "national bank open", "cincinnati", "shanghai", "rolex paris masters", "paris masters",
  "canadian open", "rogers cup", "china open", "wuhan open", "guadalajara",
];
const TIER_FINALS_KEYWORDS = [
  "nitto atp finals", "atp finals", "wta finals",
];
const TIER_500_KEYWORDS = [
  "abn amro", "rotterdam", "dubai", "telcel", "acapulco", "barcelona open",
  "hamburg", "mubadala", "japan open", "china open", "erste bank", "swiss indoors",
  "nordea", "ostrava", "san diego", "pan pacific",
];

// WTA 125K / ITF W125 series — filter these out entirely
const WTA_125_KEYWORDS = [
  "125", "canberra international", "philippine women", "mumbai open", "l&t",
  "oeiras", "les sables", "dow tennis classic", "megasaray", "dubrovnik open",
  "villa de madrid gp", "capfinances", "rouen", "huzhou", "saint malo",
  "catalonia open", "jiangxi", "trophée clarins", "delle puglie", "makarska",
  "eugenio fontana", "femminili", "figueira da foz", "grand est open",
  "iasi open", "athens open", "istanbul open", "parma ladies", "hamburg ladies", "sp open", "ningbo",
  "guangzhou", "hong kong", "kinoshita", "chennai open", "austin 125",
  "bogota cup", "saguenay", "contrexeville", "portoroz challenger",
];

function isWTA125(name: string): boolean {
  const n = name.toLowerCase();
  return WTA_125_KEYWORDS.some((k) => n.includes(k));
}

function getTier(name: string, major: boolean): ATPTournament["tier"] {
  if (major) return "grand-slam";
  const n = name.toLowerCase();
  if (TIER_FINALS_KEYWORDS.some((k) => n.includes(k))) return "tour-finals";
  if (TIER_1000_KEYWORDS.some((k) => n.includes(k))) return "masters-1000";
  if (TIER_500_KEYWORDS.some((k) => n.includes(k))) return "atp-500";
  return "atp-250";
}

function getStatus(startDate: string, endDate: string): ATPTournament["status"] {
  const now   = Date.now();
  const start = new Date(startDate).getTime();
  const end   = new Date(endDate).getTime();
  if (now > end)   return "past";
  if (now < start) return "upcoming";
  return "live";
}

function parseEvents(events: Record<string, unknown>[], tour: "atp" | "wta"): ATPTournament[] {
  const results: ATPTournament[] = [];
  for (const e of events) {
    const name      = (e.name as string) ?? "";
    const startDate = (e.date as string) ?? "";
    const endDate   = (e.endDate as string) ?? "";
    const major     = (e.major as boolean) ?? false;
    const venue     = ((e.venue as Record<string, unknown>)?.displayName as string) ?? "";

    // Skip WTA 125-level events
    if (tour === "wta" && isWTA125(name)) continue;

    results.push({
      id:      `${tour}-${e.id as string}`,
      name,
      startDate,
      endDate,
      venue,
      surface: getSurface(name),
      tier:    getTier(name, major),
      status:  getStatus(startDate, endDate),
      major,
      tour,
    });
  }
  return results;
}

export async function GET() {
  try {
    const [atpRes, wtaRes] = await Promise.all([
      fetch("https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard?dates=20260101-20261231&limit=100", { next: { revalidate: 86400 } }),
      fetch("https://site.api.espn.com/apis/site/v2/sports/tennis/wta/scoreboard?dates=20260101-20261231&limit=100", { next: { revalidate: 86400 } }),
    ]);

    const [atpData, wtaData] = await Promise.all([atpRes.json(), wtaRes.json()]);

    const tournaments: ATPTournament[] = [
      ...parseEvents(atpData.events ?? [], "atp"),
      ...parseEvents(wtaData.events ?? [], "wta"),
    ].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    return NextResponse.json({ tournaments });
  } catch {
    return NextResponse.json({ tournaments: [] });
  }
}
