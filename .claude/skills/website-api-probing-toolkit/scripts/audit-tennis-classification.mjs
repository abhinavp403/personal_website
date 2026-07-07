#!/usr/bin/env node
// audit-tennis-classification.mjs
//
// Standalone audit of the tennis tournament keyword classifier.
// Fetches the ATP + WTA 2026 scoreboards from ESPN exactly like
// src/app/api/atp-schedule/route.ts does, re-runs the SAME keyword logic,
// and prints every tournament as:  name | surface | tier | tour
//
// Zero dependencies — needs only Node 18+ (global fetch).
//   Usage: node scripts/audit-tennis-classification.mjs [year]   (default 2026)
//
// !!! KEYWORD LISTS ARE A SNAPSHOT (2026-07-06). !!!
// The source of truth is src/app/api/atp-schedule/route.ts — if this script
// and the route disagree, re-copy the lists from the route before trusting
// any audit result. This script exists so you can eyeball the classifier's
// output against known ground truth (e.g. June tournaments should be grass).

const YEAR = process.argv[2] ?? "2026";

// ── Keyword lists: copied VERBATIM from src/app/api/atp-schedule/route.ts ──
const CLAY_KEYWORDS = [
  "roland garros", "monte-carlo", "madrid", "barcelona", "rome", "internazionali",
  "hamburg", "munich", "bmw open", "buenos aires", "rio", "chile", "geneva", "gonet",
  "marrakech", "bucharest", "tiriac", "houston", "clay court", "estoril",
  "strasbourg", "rabat", "parma", "bogota", "warsaw", "prague",
  "nordea", "gstaad", "generali", "umag", "porsche", "charleston",
];
const GRASS_KEYWORDS = [
  "wimbledon", "halle", "boss open", "stuttgart", "hertogenbosch", "libéma",
  "eastbourne", "mallorca", "nottingham", "ilkley", "birmingham classic",
  "bad homburg", "queens", "hsbc championships", "terra wortmann", "vanda", "bali",
];
const INDOOR_HARD_KEYWORDS = [
  "abn amro", "rotterdam",
  "nexo dallas", "dallas open",
  "open occitanie", "montpellier",
  "erste bank", "vienna",
  "swiss indoors",
  "paris masters", "rolex paris",
  "auvergne", "grand prix lyon", "ldlc",
  "almaty",
  "nordic open",
  "european open", "antwerp",
  "atp finals", "next gen atp",
  "japan open", "ariake",
  "ostrava",
  "transylvania", "cluj",
  "upper austria", "ladies linz",
  "memphis classic", "the memphis",
  "wta finals",
];
const TIER_FINALS_KEYWORDS = [
  "nitto atp finals", "atp finals", "wta finals", "next gen atp finals",
];
const ATP_TIER_1000 = [
  "bnp paribas open", "miami open", "monte-carlo", "mutua madrid",
  "internazionali", "national bank open", "rogers cup", "canadian open",
  "cincinnati", "shanghai", "rolex shanghai", "rolex paris masters",
  "paris masters", "china open", "guadalajara",
];
const ATP_TIER_500 = [
  "abn amro", "rotterdam", "dubai", "doha", "qatar exxonmobil", "dallas",
  "rio open", "telcel", "acapulco", "barcelona open", "bmw open", "munich",
  "hamburg", "bitpanda hamburg", "mubadala citi", "mifel", "los cabos",
  "japan open", "erste bank", "swiss indoors", "nordea", "hsbc championships",
  "san diego", "pan pacific",
];
const WTA_TIER_1000 = [
  "bnp paribas open", "miami open", "mutua madrid", "internazionali bnl",
  "national bank open", "rogers cup", "canadian open", "cincinnati",
  "china open", "wuhan", "dongfeng", "qatar total energies", "dubai duty free",
];
const WTA_TIER_500 = [
  "united cup", "brisbane international", "adelaide international",
  "abu dhabi", "mubadala citi", "mérida", "merida", "charleston", "linz",
  "porsche", "stuttgart", "strasbourg", "hsbc championships", "berlin",
  "bad homburg", "abierto gnp", "guadalajara", "singapore tennis",
  "pan pacific", "toray", "ningbo", "tokyo",
];
const ATP_EXCLUDE_KEYWORDS = ["estoril"];
const WTA_125_KEYWORDS = [
  "125",
  "canberra international", "philippine women", "manila",
  "mumbai open", "oeiras", "les sables", "dow tennis classic", "midland",
  "megasaray", "antalya open", "dubrovnik open", "villa de madrid",
  "capfinances", "huzhou", "saint malo", "vic 125", "jiujiang",
  "catalonia open", "solgironès", "solgirones", "jiangxi", "trophée clarins",
  "delle puglie", "bari", "makarska", "eugenio fontana", "femminili",
  "figueira da foz", "grand est open", "modena", "palermo", "kitzbü",
  "kitzbuehel", "contrexeville", "bastad 125", "newport 125", "rome 125",
  "targu mures", "vancouver 125", "warsaw 125", "istanbul open",
  "istanbul 125", "parma ladies", "lexus birmingham", "lexus ilkley",
  "hall of fame", "nordea open", "austin 125", "bogota cup", "saguenay",
  "portoroz challenger", "sp open", "kinoshita",
];
// ── end verbatim snapshot ──────────────────────────────────────────────────

function getSurface(name) {
  const n = name.toLowerCase();
  if (GRASS_KEYWORDS.some((k) => n.includes(k))) return "grass";
  if (CLAY_KEYWORDS.some((k) => n.includes(k))) return "clay";
  if (INDOOR_HARD_KEYWORDS.some((k) => n.includes(k))) return "hard-indoor";
  return "hard";
}
function getTier(name, major, tour) {
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
const isWTA125 = (name) =>
  WTA_125_KEYWORDS.some((k) => name.toLowerCase().includes(k));
const isATPExcluded = (name) =>
  ATP_EXCLUDE_KEYWORDS.some((k) => name.toLowerCase().includes(k));

async function fetchEvents(tour) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/tennis/${tour}/scoreboard?dates=${YEAR}0101-${YEAR}1231&limit=100`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${tour} fetch failed: HTTP ${res.status}`);
  const data = await res.json();
  return data.events ?? [];
}

const [atpEvents, wtaEvents] = await Promise.all([
  fetchEvents("atp"),
  fetchEvents("wta"),
]);

const rows = [];
let skipped125 = 0, skippedExcluded = 0;
for (const [tour, events] of [["atp", atpEvents], ["wta", wtaEvents]]) {
  for (const e of events) {
    const name = e.name ?? "";
    if (tour === "wta" && isWTA125(name)) { skipped125++; continue; }
    if (tour === "atp" && isATPExcluded(name)) { skippedExcluded++; continue; }
    rows.push({
      name,
      startDate: e.date ?? "",
      surface: getSurface(name),
      tier: getTier(name, e.major ?? false, tour),
      tour,
    });
  }
}
rows.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

console.log(`# Tennis classification audit — year ${YEAR}, run ${new Date().toISOString().slice(0, 10)}`);
console.log(`# ATP raw events: ${atpEvents.length}, WTA raw events: ${wtaEvents.length}`);
console.log(`# Skipped: ${skipped125} WTA-125/ITF, ${skippedExcluded} ATP-excluded`);
console.log(`# Classified rows: ${rows.length}`);
console.log(`# name | surface | tier | tour  (date prefix for sanity-checking season vs surface)`);
for (const r of rows) {
  console.log(`${r.startDate.slice(0, 10)}  ${r.name} | ${r.surface} | ${r.tier} | ${r.tour}`);
}
