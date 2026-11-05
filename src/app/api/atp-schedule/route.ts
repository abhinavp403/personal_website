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
  "strasbourg", "rabat", "lalla meryem", "parma", "bogota", "colsanitas", "warsaw",
  "nordea", "gstaad", "generali", "umag", "porsche", "charleston",
  "upper austria", "capfinances", "iasi", // Linz (indoor clay), Rouen, Iasi
];
const GRASS_KEYWORDS = [
  "wimbledon", "halle", "boss open", "stuttgart", "hertogenbosch", "libéma",
  "eastbourne", "mallorca", "nottingham", "ilkley", "birmingham classic",
  "bad homburg", "queens", "hsbc championships", "terra wortmann",
  "berlin tennis open", "bali", // not "vanda" — that sponsor also has hard-court Athens
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
  "nordic open", "stockholm",       // Stockholm
  "european open", "antwerp",       // Antwerp
  "atp finals", "next gen atp",     // ATP Finals / Next Gen
  "japan open tennis championships", "ariake", // Tokyo (not WTA's outdoor Osaka "Japan Open")
  // WTA
  "ostrava",                        // Ostrava
  "transylvania", "cluj",           // Cluj-Napoca
  "singapore tennis",               // Singapore
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
  "mubadala citi", "mubadala dc", // Washington DC
  "mifel", "los cabos",
  "japan open",
  "erste bank",
  "swiss indoors",               // Basel ATP 500 only (not Gstaad ATP 250)
  "nordea",                      // Bastad
  "hsbc championships",          // Queen's (not Acapulco "…presentado por HSBC")
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
  "mubadala citi", "mubadala dc", // Washington DC
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

// ── WTA 250 tournaments ───────────────────────────────────────────────────────
// Source: api.wtatennis.com 2026 calendar (level "WTA 250"), matched to ESPN names
const WTA_TIER_250 = [
  "asb classic",          // Auckland
  "hobart",
  "ostrava",
  "transylvania",         // Cluj-Napoca
  "atx open",             // Austin
  "copa colsanitas",      // Bogotá
  "capfinances",          // Rouen
  "lalla meryem",         // Rabat
  "libéma",               // 's-Hertogenbosch
  "lexus nottingham",
  "lexus eastbourne",
  "athens open",
  "iasi",
  "prague open",
  "hamburg ladies",
  "memphis classic",
  "sp open",              // São Paulo
  "korea open",           // Seoul
  "japan open",           // Osaka (Kinoshita Group)
  "guangzhou",
  "hong kong",
  "chennai",
];

// ── WTA feed allowlist ────────────────────────────────────────────────────────
// ESPN's WTA feed mixes in ~70 WTA 125 events (new sponsor names every season)
// plus some ATP events, so only known tour-level events (250+) are shown.
function isWTATourLevel(name: string, major: boolean): boolean {
  if (major) return true;
  const n = name.toLowerCase();
  return [TIER_FINALS_KEYWORDS, WTA_TIER_1000, WTA_TIER_500, WTA_TIER_250]
    .some((list) => list.some((k) => n.includes(k)));
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

    // Skip WTA 125s, ITF and ATP events appearing in the WTA feed
    if (tour === "wta" && !isWTATourLevel(name, major)) continue;
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
      fetch("https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard?dates=20260101-20261231&limit=300", { next: { revalidate: 86400 } }),
      fetch("https://site.api.espn.com/apis/site/v2/sports/tennis/wta/scoreboard?dates=20260101-20261231&limit=300", { next: { revalidate: 86400 } }),
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
