"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Doto } from "next/font/google";
import { Trophy } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import { motion } from "framer-motion";

import type { GameEvent, TennisMatch } from "@/lib/sports";
import type { CricketMatch } from "@/app/api/cricket/route";

// Dot-matrix display face for the LED board numerals and team codes
const doto = Doto({ subsets: ["latin"], weight: ["700", "900"] });

// ── Sport config ───────────────────────────────────────────────────────────────

const SPORT_LABEL: Record<string, string> = {
  soccer:     "Soccer",
  football:   "Football",
  cricket:    "Cricket",
  basketball: "Basketball",
  formula1:   "Formula 1",
  tennis:     "Tennis",
};

// Single-league sports get a sensible fallback; multi-league sports (football) get null
const SPORT_DEFAULT_LEAGUE: Record<string, string> = {
  basketball: "NBA",
  cricket:    "Cricket",
};

function leagueDisplay(game: { league: string; sport: string }): string | null {
  if (game.league === game.sport) return SPORT_DEFAULT_LEAGUE[game.sport] ?? null;
  return game.league;
}

// Lamp colours (hex equivalents of the Tailwind -400 sport accents)
const SPORT_HEX: Record<string, string> = {
  soccer:     "#4ade80",
  football:   "#a5b4fc",
  basketball: "#fb923c",
  cricket:    "#60a5fa",
  formula1:   "#f87171",
  tennis:     "#facc15",
};

const AMBER = "#facc15";

// ── Team colours (for the LED team codes) ─────────────────────────────────────

type TeamColor = { primary: string; secondary?: string };

const TEAM_COLOR_MAP: Record<string, TeamColor> = {
  // Football
  "manchester united": { primary: "#da0707" },
  "barcelona":         { primary: "#a50044", secondary: "#004d98" }, // blaugrana garnet→blue
  "real madrid":       { primary: "#d4af37" },
  "chelsea":           { primary: "#034694" },
  "inter miami":       { primary: "#f72585" },                        // vivid pink glow
  "la galaxy":         { primary: "#00245d" },
  "osasuna":           { primary: "#cc0000" },
  "orlando city":      { primary: "#633492" },
  "liverpool":         { primary: "#c8102e" },
  // American Football
  "new england patriots": { primary: "#002244", secondary: "#c60c30" }, // navy + red
  "philadelphia eagles":  { primary: "#004c54", secondary: "#a5acaf" }, // midnight green + silver
  // Basketball
  "boston celtics":    { primary: "#007a33" },                        // celtic green wash
  "philadelphia 76ers":{ primary: "#006bb6" },
  "miami heat":        { primary: "#98002e" },
  "golden state":      { primary: "#ffc72c" },
  "los angeles lakers":{ primary: "#552583" },
  // Cricket — IPL
  "mumbai indians":        { primary: "#003a8c" },                    // deep royal blue
  "royal challengers":     { primary: "#cc0000", secondary: "#c8971f" }, // red + gold
  "punjab kings":           { primary: "#dd1f2d" },
  "rajasthan royals":       { primary: "#ad1c85" },
  "sunrisers hyderabad":    { primary: "#f26522" },
  "chennai super kings":    { primary: "#f7c948" },
  "kolkata knight riders":  { primary: "#3b1e6e" },
  "delhi capitals":         { primary: "#0033a0" },
  "gujarat titans":         { primary: "#1c4d82" },
  "lucknow super giants":   { primary: "#67b2e8" },
  // International cricket
  "india":     { primary: "#ff6600" },
  "australia": { primary: "#f6c600" },
  "pakistan":  { primary: "#01411c" },
  // National soccer teams
  "argentina": { primary: "#74ACDF", secondary: "#003082" },   // sky blue + darker blue
  "france":    { primary: "#003189", secondary: "#ED2939" },   // bleu + rouge
  "spain":     { primary: "#AA151B", secondary: "#F1BF00" },   // rojo + amarillo
  "brazil":    { primary: "#009C3B", secondary: "#FFDF00" },   // verde + amarelo
  "england":   { primary: "#CE1126" },                         // St George red
  "germany":   { primary: "#DD0000", secondary: "#FFCD00" },   // rot + gold
  // Tennis players — national colours
  "sinner":   { primary: "#009246", secondary: "#CE2B37" }, // Italy
  "alcaraz":  { primary: "#AA151B", secondary: "#F1BF00" }, // Spain
  "djokovic": { primary: "#C6363C", secondary: "#0C4076" }, // Serbia
};

function getTeamColor(name: string): TeamColor | null {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(TEAM_COLOR_MAP)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Team colour lifted toward white so dark kits still read as lit LEDs on the black panel
function ledStyle(team: string, fallback: string): CSSProperties {
  const [r, g, b] = hexToRgb(getTeamColor(team)?.primary ?? fallback);
  const lift = (v: number) => Math.round(v + (255 - v) * 0.45);
  return {
    color:      `rgb(${lift(r)},${lift(g)},${lift(b)})`,
    textShadow: `0 0 22px rgba(${lift(r)},${lift(g)},${lift(b)},0.7)`,
  };
}

// ── Cricket helpers ────────────────────────────────────────────────────────────

const CRICKET_LOGOS: Record<string, string> = {
  "mumbai":    "https://scores.iplt20.com/ipl/teamlogos/MI.png",
  "royal":     "https://scores.iplt20.com/ipl/teamlogos/RCB.png",
  "chennai":   "https://scores.iplt20.com/ipl/teamlogos/CSK.png",
  "kolkata":   "https://scores.iplt20.com/ipl/teamlogos/KKR.png",
  "delhi":     "https://scores.iplt20.com/ipl/teamlogos/DC.png",
  "sunrisers": "https://scores.iplt20.com/ipl/teamlogos/SRH.png",
  "punjab":    "https://scores.iplt20.com/ipl/teamlogos/PBKS.png",
  "rajasthan": "https://scores.iplt20.com/ipl/teamlogos/RR.png",
  "gujarat":   "https://scores.iplt20.com/ipl/teamlogos/GT.png",
  "lucknow":   "https://scores.iplt20.com/ipl/teamlogos/LSG.png",
  "india":     "https://upload.wikimedia.org/wikipedia/en/thumb/4/41/Flag_of_India.svg/320px-Flag_of_India.svg.png",
};

function cricketLogo(teamName: string): string | undefined {
  const lower = teamName.toLowerCase();
  for (const [key, url] of Object.entries(CRICKET_LOGOS)) {
    if (lower.includes(key)) return url;
  }
  return undefined;
}

function cricketMatchToEvent(m: CricketMatch): GameEvent {
  return {
    id:        `cricket-${m.id}`,
    homeTeam:  m.team1,
    awayTeam:  m.team2,
    homeLogo:  cricketLogo(m.team1),
    awayLogo:  cricketLogo(m.team2),
    date:      m.date,
    league:    m.matchType === "IPL" ? "IPL 2026" : `${m.matchType} · ${m.series}`,
    sport:     "cricket",
    venue:     m.venue,
  };
}

function tennisMatchToEvent(m: TennisMatch): GameEvent {
  return {
    id:       m.id,
    homeTeam: m.player1,
    awayTeam: m.player2,
    homeLogo: m.player1Flag,
    awayLogo: m.player2Flag,
    date:     m.date,
    league:   m.tournament,
    sport:    "tennis",
    venue:    m.venue,
  };
}

function buildFallbackGames(): GameEvent[] {
  const d = (n: number) => new Date(Date.now() + n * 86400000).toISOString();
  return [
    { id:"1", homeTeam:"Manchester United", awayTeam:"Chelsea",       date:d(1), league:"Premier League", sport:"soccer",     venue:"Old Trafford" },
    { id:"2", homeTeam:"Barcelona",         awayTeam:"Real Madrid",   date:d(2), league:"La Liga",        sport:"soccer",     venue:"Camp Nou" },
    { id:"4", homeTeam:"Boston Celtics",    awayTeam:"Miami Heat",    date:d(3), league:"NBA",            sport:"basketball", venue:"TD Garden" },
    { id:"5", homeTeam:"Miami Grand Prix",  awayTeam:"Round 6",       date:d(4), league:"Formula 1",      sport:"formula1",   venue:"Miami International Autodrome" },
    { id:"6", homeTeam:"Inter Miami",       awayTeam:"LA Galaxy",     date:d(5), league:"MLS",            sport:"soccer",     venue:"Chase Stadium" },
  ];
}

// ── Utils ──────────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
function daysUntil(iso: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const match = new Date(iso); match.setHours(0, 0, 0, 0);
  const days = Math.round((match.getTime() - today.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}
function dayKey(d: Date | string) {
  return new Date(d).toDateString();
}
function weekday(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
}
function dayLabel(iso: string) {
  return `${weekday(iso)} ${new Date(iso).getDate()}`;
}

function teamAbbrev(name: string): string {
  const words = name.replace(/\s+(CF|SC|FC)$/i, "").trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
}

// Tennis players read better as a surname code (SIN, ALC) than as initials
function boardCode(game: GameEvent, team: string): string {
  if (game.sport === "tennis") {
    const words = team.trim().split(/\s+/);
    return words[words.length - 1].slice(0, 3).toUpperCase();
  }
  return teamAbbrev(team);
}

function kicker(game: GameEvent): string {
  return (leagueDisplay(game) ?? SPORT_LABEL[game.sport]).toUpperCase();
}

const STRIP_DAYS = 12;
const RAIL_COLS  = "grid grid-cols-[64px_28px_minmax(0,1fr)] sm:grid-cols-[124px_36px_minmax(0,1fr)]";

// ── Day strip ──────────────────────────────────────────────────────────────────

function DayStrip({ games, nextKey }: { games: GameEvent[]; nextKey?: string }) {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const days = Array.from({ length: STRIP_DAYS }, (_, i) => {
    const date = new Date(start); date.setDate(start.getDate() + i);
    const key  = dayKey(date);
    const sports = [...new Set(games.filter((g) => dayKey(g.date) === key).map((g) => g.sport))].slice(0, 3);
    return { key, date, sports, isToday: i === 0, isNext: key === nextKey };
  });

  return (
    <div className="flex gap-2 overflow-x-auto px-4 sm:px-7 py-5 border-b-2 border-[#163d60]">
      {days.map((d) => {
        const lit = d.sports.length > 0;
        return (
          <div
            key={d.key}
            className="flex-1 min-w-[56px] h-[92px] rounded-xl border flex flex-col items-center justify-center gap-1"
            style={{
              borderColor: d.isNext ? AMBER : d.isToday ? "#60a5fa" : "#163d60",
              background:  d.isNext ? "rgba(250,204,21,0.14)" : lit ? "#071e38" : "transparent",
              color:       d.isNext ? AMBER : lit ? "#ffffff" : "#8fa3bf",
            }}
          >
            <span className="font-mono text-[10px] font-bold tracking-widest">
              {d.isToday ? "TODAY" : weekday(d.date)}
            </span>
            <span
              className={`${doto.className} text-3xl font-black leading-none`}
              style={d.isNext ? { textShadow: "0 0 12px rgba(250,204,21,0.6)" } : undefined}
            >
              {d.date.getDate()}
            </span>
            <span className="flex gap-1 h-2.5 items-center">
              {d.sports.map((s) => (
                <span
                  key={s}
                  className="w-2 h-2 rounded-full"
                  style={{ background: SPORT_HEX[s], boxShadow: `0 0 8px ${SPORT_HEX[s]}` }}
                />
              ))}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Featured (next-up) block ───────────────────────────────────────────────────

function FeaturedRow({ game }: { game: GameEvent }) {
  const lamp = SPORT_HEX[game.sport];
  const isF1 = game.sport === "formula1";

  return (
    <div className={`${RAIL_COLS} px-4 sm:px-7`}>
      <div className="pt-7">
        <div className="font-mono text-[10px] sm:text-[11px] font-bold tracking-widest" style={{ color: lamp }}>
          {daysUntil(game.date).toUpperCase()}
        </div>
        <div className={`${doto.className} text-base sm:text-[28px] font-black text-white mt-0.5 whitespace-nowrap`}>{dayLabel(game.date)}</div>
      </div>

      <div className="relative" aria-hidden="true">
        <div className="absolute left-1/2 -translate-x-1/2 top-10 bottom-0 w-0.5 bg-[#1f4a75]" />
        <div
          className="absolute left-1/2 -translate-x-1/2 top-8 w-5 h-5 rounded-full animate-pulse"
          style={{ background: lamp, boxShadow: `0 0 14px ${lamp}` }}
        />
      </div>

      <div className="pt-6 pb-6 min-w-0">
        <div className="flex flex-wrap justify-between items-center gap-x-4 gap-y-1 font-mono text-[11px] sm:text-xs font-bold tracking-[0.2em]">
          <span style={{ color: lamp }}>
            NEXT UP · {[SPORT_LABEL[game.sport], leagueDisplay(game)].filter(Boolean).join(" · ").toUpperCase()}
          </span>
          <span className="text-[#b6c4d8]">
            {[game.venue, formatTime(game.date)].filter(Boolean).join(" · ").toUpperCase()}
          </span>
        </div>

        {isF1 ? (
          <div className="mt-4">
            <div
              className={`${doto.className} text-4xl sm:text-6xl lg:text-7xl font-black leading-none uppercase`}
              style={{ color: "#ff5a5a", textShadow: "0 0 22px rgba(255,60,60,0.75)" }}
            >
              {game.homeTeam}
            </div>
            <div className="font-mono text-xs sm:text-[13px] font-bold tracking-[0.2em] text-white mt-2 uppercase">{game.awayTeam}</div>
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5 mt-3">
            <div className="min-w-0">
              <div className={`${doto.className} text-5xl sm:text-8xl lg:text-[124px] font-black leading-[0.95]`} style={ledStyle(game.homeTeam, "#ff5a5a")}>
                {boardCode(game, game.homeTeam)}
              </div>
              <div className="font-mono text-[10px] sm:text-[13px] font-bold tracking-[0.2em] text-white mt-1 uppercase">{game.homeTeam}</div>
            </div>
            <div
              className={`${doto.className} text-2xl sm:text-5xl font-black leading-none text-center`}
              style={{ color: AMBER, textShadow: "0 0 18px rgba(250,204,21,0.6)" }}
            >
              VS
            </div>
            <div className="min-w-0 text-right">
              <div className={`${doto.className} text-5xl sm:text-8xl lg:text-[124px] font-black leading-[0.95]`} style={ledStyle(game.awayTeam, "#5aa2ff")}>
                {boardCode(game, game.awayTeam)}
              </div>
              <div className="font-mono text-[10px] sm:text-[13px] font-bold tracking-[0.2em] text-white mt-1 uppercase">{game.awayTeam}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Board row ──────────────────────────────────────────────────────────────────

function BoardRow({ game, i, showDay }: { game: GameEvent; i: number; showDay: boolean }) {
  const lamp = SPORT_HEX[game.sport];

  return (
    <motion.div
      className={`${RAIL_COLS} px-4 sm:px-7`}
      style={{ background: i % 2 === 0 ? "rgba(7,30,56,0.55)" : "transparent" }}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="pt-3.5">
        {showDay && (
          <>
            <div className="font-mono text-[10px] sm:text-[11px] font-bold tracking-widest text-[#8fa3bf]">
              {daysUntil(game.date).toUpperCase()}
            </div>
            <div className={`${doto.className} text-base sm:text-[22px] font-black text-white mt-0.5`}>{dayLabel(game.date)}</div>
          </>
        )}
      </div>

      <div className="relative" aria-hidden="true">
        <div className="absolute left-1/2 -translate-x-1/2 inset-y-0 w-0.5 bg-[#1f4a75]" />
        <div
          className="absolute left-1/2 -translate-x-1/2 top-[27px] w-4 h-4 rounded-full"
          style={{ background: lamp, boxShadow: `0 0 12px ${lamp}` }}
        />
      </div>

      <div className="min-w-0 min-h-[70px] py-3 border-t border-[#0f2d4a] grid grid-cols-[auto_minmax(0,1fr)] md:grid-cols-[112px_190px_minmax(0,1fr)_200px] gap-x-4 gap-y-1 items-center">
        <span
          className={`${doto.className} text-lg sm:text-[22px] font-black whitespace-nowrap`}
          style={{ color: AMBER, textShadow: "0 0 10px rgba(250,204,21,0.45)" }}
        >
          {formatTime(game.date)}
        </span>
        <span className="font-mono text-xs font-bold tracking-widest truncate" style={{ color: lamp }}>
          {kicker(game)}
        </span>
        <span className="col-span-2 md:col-span-1 font-mono text-sm sm:text-base font-bold tracking-wide text-white uppercase">
          {game.homeTeam} <span className="text-[#8fa3bf]">{game.sport === "formula1" ? "·" : "v"}</span> {game.awayTeam}
        </span>
        {game.venue && (
          <span className="col-span-2 md:col-span-1 font-mono text-xs font-medium tracking-wider text-[#b6c4d8] uppercase md:text-right">
            {game.venue}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function UpcomingGames() {
  const [games, setGames]     = useState<GameEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<string>("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/games").then((r) => r.json()).catch(() => ({ games: [] })),
      fetch("/api/cricket").then((r) => r.json()).catch(() => ({ matches: [] })),
      fetch("/api/tennis").then((r) => r.json()).catch(() => ({ matches: [] })),
    ]).then(([gamesData, cricketData, tennisData]) => {
      const sportGames: GameEvent[]   = gamesData.games?.length ? gamesData.games : buildFallbackGames();
      const cricketGames: GameEvent[] = (cricketData.matches ?? []).map(cricketMatchToEvent);
      const tennisGames: GameEvent[]  = (tennisData.matches ?? []).map(tennisMatchToEvent);
      const all = [...sportGames, ...cricketGames, ...tennisGames].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setGames(all);
    }).finally(() => setLoading(false));
  }, []);

  const allSports = ["all", "soccer", "football", "basketball", "cricket", "formula1", "tennis"];
  const sports    = allSports.filter((s) => s === "all" || games.some((g) => g.sport === s));
  const activeFilter = sports.includes(filter) ? filter : "all";
  const filtered  = activeFilter === "all" ? games : games.filter((g) => g.sport === activeFilter);
  const [featured, ...rest] = filtered;

  return (
    <section id="games" className="py-20 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 mb-8">
          <div>
            <SectionHeading eyebrow="Matchday" title="Upcoming Fixtures" />
            <p className="text-gray-400 text-sm mt-2 min-h-5">
              {!loading && `${filtered.length} event${filtered.length !== 1 ? "s" : ""} across the next ${STRIP_DAYS} days`}
            </p>
          </div>

          {/* Sport legend — click a sport to filter, click it again to show all */}
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {sports.filter((s) => s !== "all").map((sport) => {
              const dimmed = activeFilter !== "all" && activeFilter !== sport;
              return (
                <button
                  key={sport}
                  onClick={() => setFilter(activeFilter === sport ? "all" : sport)}
                  aria-pressed={activeFilter === sport}
                  className={`flex items-center gap-2 font-mono text-xs font-bold tracking-widest uppercase transition-opacity hover:opacity-100 ${
                    dimmed ? "opacity-40" : "opacity-100"
                  }`}
                  style={{ color: SPORT_HEX[sport] }}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: SPORT_HEX[sport], boxShadow: `0 0 8px ${SPORT_HEX[sport]}` }}
                  />
                  {sport === "formula1" ? "F1" : SPORT_LABEL[sport] ?? sport}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-28 bg-[#071e38] rounded-2xl animate-pulse" />
            <div className="h-52 bg-[#071e38] rounded-2xl animate-pulse" />
            <div className="h-72 bg-[#071e38] rounded-2xl animate-pulse" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No upcoming fixtures found.</p>
          </div>
        ) : (
          <div
            className="rounded-2xl border-2 border-[#163d60] overflow-hidden"
            style={{
              backgroundColor: "#01070f",
              backgroundImage: "radial-gradient(#0d2440 1px, transparent 1.6px)",
              backgroundSize:  "8px 8px",
              boxShadow:       "0 0 60px rgba(59,130,246,0.12)",
            }}
          >
            <DayStrip games={filtered} nextKey={featured ? dayKey(featured.date) : undefined} />
            {featured && <FeaturedRow game={featured} />}
            {rest.map((game, i) => {
              const prev = i === 0 ? featured : rest[i - 1];
              return (
                <BoardRow
                  key={game.id}
                  game={game}
                  i={i}
                  showDay={dayKey(game.date) !== dayKey(prev.date)}
                />
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}
