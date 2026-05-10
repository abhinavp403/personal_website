import { NextResponse } from "next/server";

export interface ATPTournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  venue: string;
  surface: "clay" | "grass" | "hard" | "hard-indoor";
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
  "eastbourne", "mallorca", "nottingham", "ilkley", "birmingham classic",
  "bad homburg", "queens", "bali",
];

// Confirmed indoor hard-court venues (conservative — only add when certain)
const INDOOR_HARD_KEYWORDS = [
  // ATP
  "abn amro", "rotterdam",          // Rotterdam
  "nexo dallas", "dallas open",     // Dallas
  "open occitanie", "montpellier",  // Montpellier
  "erste bank", "vienna",           // Vienna
  "swiss indoors",                  // Basel (literally in the name)
  "paris masters", "rolex paris",   // Paris-Bercy
  "auvergne", "grand prix lyon", "ldlc", // Lyon (Grand Prix Auvergne-Rhône-Alpes)
  "almaty",                         // Almaty
  "nordic open",                    // Stockholm
  "european open", "antwerp",       // Antwerp
  "atp finals", "next gen atp",     // ATP Finals / Next Gen
  "japan open", "ariake",           // Tokyo (Ariake Colosseum)
  // WTA
  "ostrava",                        // Ostrava
  "transylvania", "cluj",           // Cluj-Napoca
  "upper austria", "ladies linz",   // Linz
  "memphis classic", "the memphis", // Memphis
  "wta finals",                     // WTA Finals
];

function getSurface(name: string): ATPTournament["surface"] {
  const n = name.toLowerCase();
  if (GRASS_KEYWORDS.some((k) => n.includes(k))) return "grass";
  if (CLAY_KEYWORDS.some((k) => n.includes(k))) return "clay";
  if (INDOOR_HARD_KEYWORDS.some((k) => n.includes(k))) return "hard-indoor";
  return "hard";
}

// ── Tour Finals ────────────────────────────────────────────────────────────────
const TIER_FINALS_KEYWORDS = [
  "nitto atp finals", "atp finals", "wta finals", "next gen atp finals",
];

// ── ATP tier keywords (men's tour) ─────────────────────────────────────────────
const ATP_TIER_1000 = [
  "bnp paribas open",     // Indian Wells
  "miami open",
  "monte-carlo",
  "mutua madrid",
  "internazionali",       // Rome
  "national bank open", "rogers cup", "canadian open",
  "cincinnati",
  "shanghai", "rolex shanghai",
  "rolex paris masters", "paris masters",
  "china open",
  "guadalajara",
];
const ATP_TIER_500 = [
  "abn amro", "rotterdam",
  "dubai",
  "doha", "qatar exxonmobil",   // Doha ATP 500
  "dallas",                      // Dallas ATP 500
  "rio open",                    // Rio de Janeiro ATP 500
  "telcel", "acapulco",
  "barcelona open",
  "bmw open", "munich",          // BMW Open Munich ATP 500
  "hamburg", "bitpanda hamburg",
  "mubadala citi",               // Washington DC
  "mifel", "los cabos",
  "japan open",
  "erste bank",
  "swiss indoors",               // Basel ATP 500 only (not Gstaad ATP 250)
  "nordea",                      // Bastad
  "hsbc",
  "san diego",
  "pan pacific",
];

// ── WTA tier keywords (women's tour) ──────────────────────────────────────────
// Source: https://www.wtatennis.com/tournaments (official WTA API, 2026 season)
const WTA_TIER_1000 = [
  "bnp paribas open",     // Indian Wells
  "miami open",
  "mutua madrid",
  "internazionali bnl",   // Rome
  "national bank open", "rogers cup", "canadian open",
  "cincinnati",
  "china open",           // Beijing
  "wuhan", "dongfeng",
  "qatar total energies", // Doha (WTA 1000 in 2026)
  "dubai duty free",      // Dubai (WTA 1000 in 2026)
];
const WTA_TIER_500 = [
  "united cup",
  "brisbane international",
  "adelaide international",
  "abu dhabi",            // Mubadala Abu Dhabi Open
  "mubadala citi",        // Washington DC
  "mérida", "merida",
  "charleston",           // Credit One Charleston Open
  "linz",                 // Upper Austria Ladies Linz
  "porsche", "stuttgart", // Porsche Tennis Grand Prix
  "strasbourg",
  "hsbc championships",   // Queen's / London
  "berlin",               // VANDA Berlin Open
  "bad homburg",
  "abierto gnp",          // Monterrey
  "guadalajara",          // WTA 500 (different from ATP 1000)
  "singapore tennis",
  "pan pacific", "toray", // Ningbo / Tokyo
  "ningbo",               // AUX Ningbo Open (WTA 500)
  "tokyo",
];

// ── ATP events removed from / not on 2026 calendar ────────────────────────────
const ATP_EXCLUDE_KEYWORDS = [
  "estoril",   // Removed from 2026 ATP calendar
];

function isATPExcluded(name: string): boolean {
  const n = name.toLowerCase();
  return ATP_EXCLUDE_KEYWORDS.some((k) => n.includes(k));
}

// ── WTA 125K series — filter out entirely ─────────────────────────────────────
// Source: WTA official API cross-referenced with ESPN event names
const WTA_125_KEYWORDS = [
  "125",
  "canberra international", "philippine women", "manila",
  "mumbai open",
  "oeiras",
  "les sables",
  "dow tennis classic", "midland",
  "megasaray", "antalya open",
  "dubrovnik open",
  "villa de madrid",      // Grand Prix Open Villa de Madrid (WTA 125, not Madrid WTA 1000)
  "capfinances",
  "huzhou",
  "saint malo",
  "vic 125", "jiujiang",
  "catalonia open", "solgironès", "solgirones", "jiangxi",
  "trophée clarins",
  "delle puglie", "bari",
  "makarska",
  "eugenio fontana",
  "femminili",            // catches Internazionali Femminili Di Brescia etc.
  "figueira da foz",
  "grand est open",
  "modena",               // Modena WTA 125
  "palermo",              // WTA 125 Palermo (separate from any WTA 250)
  "kitzbü", "kitzbuehel",
  "contrexeville",
  "bastad 125", "newport 125", "rome 125", "targu mures",
  "vancouver 125", "warsaw 125",
  "istanbul open", "istanbul 125",
  "parma ladies",
  "lexus birmingham",     // Birmingham Classic WTA 125
  "lexus ilkley",         // Ilkley WTA 125
  "hall of fame",         // ATP Newport event appearing in WTA feed
  "nordea open",          // ATP Bastad event appearing in WTA feed
  "austin 125",
  "bogota cup",
  "saguenay",
  "portoroz challenger",
  "sp open",
  "kinoshita",
];

function isWTA125(name: string): boolean {
  const n = name.toLowerCase();
  return WTA_125_KEYWORDS.some((k) => n.includes(k));
}

function getTier(name: string, major: boolean, tour: "atp" | "wta"): ATPTournament["tier"] {
  if (major) return "grand-slam";
  const n = name.toLowerCase();
  if (TIER_FINALS_KEYWORDS.some((k) => n.includes(k))) return "tour-finals";
  if (tour === "wta") {
    if (WTA_TIER_1000.some((k) => n.includes(k))) return "masters-1000";
    if (WTA_TIER_500.some((k) => n.includes(k))) return "atp-500";
  } else {
    if (ATP_TIER_1000.some((k) => n.includes(k))) return "masters-1000";
    if (ATP_TIER_500.some((k) => n.includes(k))) return "atp-500";
  }
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

    // Skip WTA 125-level and ITF events
    if (tour === "wta" && isWTA125(name)) continue;
    // Skip ATP events removed from 2026 calendar
    if (tour === "atp" && isATPExcluded(name)) continue;

    results.push({
      id:      `${tour}-${e.id as string}`,
      name,
      startDate,
      endDate,
      venue,
      surface: getSurface(name),
      tier:    getTier(name, major, tour),
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
