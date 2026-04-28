"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Calendar, MapPin, Trophy } from "lucide-react";
import { motion } from "framer-motion";

import type { GameEvent } from "@/lib/sports";
import type { CricketMatch } from "@/app/api/cricket/route";

// ── Sport config ───────────────────────────────────────────────────────────────

const SPORT_LABEL: Record<string, string> = {
  football:   "Football",
  cricket:    "Cricket",
  basketball: "Basketball",
  formula1:   "Formula 1",
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

const SPORT_DOT: Record<string, string> = {
  football:   "bg-green-400",
  basketball: "bg-orange-400",
  cricket:    "bg-blue-400",
  formula1:   "bg-red-400",
};

const SPORT_TEXT: Record<string, string> = {
  football:   "text-green-400",
  basketball: "text-orange-400",
  cricket:    "text-blue-400",
  formula1:   "text-red-400",
};

// ── Team colours (for card glow) ──────────────────────────────────────────────

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
  "england":   { primary: "#003087" },
  "pakistan":  { primary: "#01411c" },
};

// Teams the user follows — these win colour priority when playing away
const MY_TEAMS = [
  "manchester united", "barcelona", "inter miami",
  "patriots", "eagles",
  "boston celtics",
  "mumbai indians", "royal challengers",
];

function getTeamColor(name: string): TeamColor | null {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(TEAM_COLOR_MAP)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

function getCardTeamColor(game: GameEvent): TeamColor | null {
  const homeLower = game.homeTeam.toLowerCase();
  const awayLower = game.awayTeam.toLowerCase();
  const awayIsMine = MY_TEAMS.some((t) => awayLower.includes(t));
  const homeIsMine = MY_TEAMS.some((t) => homeLower.includes(t));
  // Prefer "my team" colour regardless of home/away
  if (awayIsMine) return getTeamColor(game.awayTeam) ?? getTeamColor(game.homeTeam);
  if (homeIsMine) return getTeamColor(game.homeTeam) ?? getTeamColor(game.awayTeam);
  return getTeamColor(game.homeTeam) ?? getTeamColor(game.awayTeam);
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function cardStyle(game: GameEvent): CSSProperties {
  // F1 always uses Ferrari Rosso Corsa
  if (game.sport === "formula1") {
    return {
      background:  "linear-gradient(160deg, rgba(212,0,0,0.22) 0%, rgba(212,0,0,0.10) 100%), #071e38",
      borderColor: "rgba(212,0,0,0.30)",
    };
  }

  const entry = getCardTeamColor(game);
  if (!entry) return {};

  const [r1, g1, b1] = hexToRgb(entry.primary);

  if (entry.secondary) {
    const [r2, g2, b2] = hexToRgb(entry.secondary);
    return {
      background:  `linear-gradient(160deg, rgba(${r1},${g1},${b1},0.45) 0%, rgba(${r2},${g2},${b2},0.30) 55%, rgba(${r2},${g2},${b2},0.15) 100%), #071e38`,
      borderColor: `rgba(${r1},${g1},${b1},0.45)`,
    };
  }

  return {
    background:  `linear-gradient(160deg, rgba(${r1},${g1},${b1},0.28) 0%, rgba(${r1},${g1},${b1},0.12) 100%), #071e38`,
    borderColor: `rgba(${r1},${g1},${b1},0.35)`,
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

function buildFallbackGames(): GameEvent[] {
  const d = (n: number) => new Date(Date.now() + n * 86400000).toISOString();
  return [
    { id:"1", homeTeam:"Manchester United", awayTeam:"Chelsea",       date:d(1), league:"Premier League", sport:"football",   venue:"Old Trafford" },
    { id:"2", homeTeam:"Barcelona",         awayTeam:"Real Madrid",   date:d(2), league:"La Liga",        sport:"football",   venue:"Camp Nou" },
    { id:"4", homeTeam:"Boston Celtics",    awayTeam:"Miami Heat",    date:d(3), league:"NBA",            sport:"basketball", venue:"TD Garden" },
    { id:"5", homeTeam:"Miami Grand Prix",  awayTeam:"Round 6",       date:d(4), league:"Formula 1",      sport:"formula1",   venue:"Miami International Autodrome" },
    { id:"6", homeTeam:"Inter Miami",       awayTeam:"LA Galaxy",     date:d(5), league:"MLS",            sport:"football",   venue:"Chase Stadium" },
  ];
}

// ── Utils ──────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
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

// ── Team circle helpers ────────────────────────────────────────────────────────

function teamAbbrev(name: string): string {
  const words = name.replace(/\s+(CF|SC|FC)$/i, "").trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
}

const PALETTE = [
  "#dc2626", "#ea580c", "#d97706", "#16a34a",
  "#0284c7", "#7c3aed", "#db2777", "#0f766e",
  "#b45309", "#4f46e5", "#be123c", "#15803d",
];

function teamColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function TeamCircle({ team, logo, className }: { team: string; logo?: string; className?: string }) {
  const [imgErr, setImgErr] = useState(false);

  if (logo && !imgErr) {
    return (
      <div className={`rounded-full flex-shrink-0 bg-[#0f2d4a] flex items-center justify-center overflow-hidden ${className ?? ""}`}>
        <img
          src={logo}
          alt={team}
          onError={() => setImgErr(true)}
          className="w-full h-full object-contain p-1.5"
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${className ?? ""}`}
      style={{ backgroundColor: teamColor(team) }}
    >
      {teamAbbrev(team)}
    </div>
  );
}

// ── Featured (next-up) card ────────────────────────────────────────────────────

function FeaturedCard({ game }: { game: GameEvent }) {
  const countdown = daysUntil(game.date).toUpperCase();
  const teamStyle  = cardStyle(game);

  if (game.sport === "formula1") {
    return (
      <div className="bg-[#071e38] border border-blue-500/30 rounded-2xl p-6 mb-4" style={teamStyle}>
        <div className="flex justify-between items-start mb-6">
          <Badge label={`NEXT UP · ${countdown}`} />
          <span className="text-gray-500 text-sm">Formula 1</span>
        </div>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🏎️</div>
          <div>
            <p className="text-white font-bold text-2xl">{game.homeTeam}</p>
            <p className="text-gray-400 text-sm mt-0.5">{game.awayTeam}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-[#0f2d4a] text-sm text-gray-400">
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 flex-shrink-0" />{formatDate(game.date)} · {formatTime(game.date)}</div>
          {game.venue && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 flex-shrink-0" />{game.venue}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#071e38] border border-blue-500/30 rounded-2xl p-6 mb-4" style={teamStyle}>
      {/* Top row */}
      <div className="flex justify-between items-start mb-8">
        <Badge label={`NEXT UP · ${countdown}`} />
        <span className="text-gray-500 text-sm text-right">
          {[leagueDisplay(game), SPORT_LABEL[game.sport]].filter(Boolean).join(" · ")}
        </span>
      </div>

      {/* Teams row */}
      <div className="flex items-center justify-between gap-4 mb-8">
        {/* Home */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="text-right flex-1 min-w-0">
            <p className="text-white font-bold text-xl leading-tight">{game.homeTeam}</p>
          </div>
          <TeamCircle team={game.homeTeam} logo={game.homeLogo} className="w-16 h-16 text-base" />
        </div>

        {/* VS + time */}
        <div className="text-center flex-shrink-0 px-2">
          <p className="text-gray-500 text-xs font-semibold mb-1">VS</p>
          <p className="text-white font-bold">{formatTime(game.date)}</p>
        </div>

        {/* Away */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <TeamCircle team={game.awayTeam} logo={game.awayLogo} className="w-16 h-16 text-base" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-xl leading-tight">{game.awayTeam}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-[#0f2d4a] text-sm text-gray-400">
        <div className="flex items-center gap-2"><Calendar className="w-4 h-4 flex-shrink-0" />{formatDate(game.date)}</div>
        {game.venue && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 flex-shrink-0" />{game.venue}</div>}
      </div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 bg-blue-500/15 border border-blue-500/25 rounded-full px-3 py-1.5">
      <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
      <span className="text-blue-400 text-xs font-bold tracking-wide">{label}</span>
    </div>
  );
}

// ── Small game card ────────────────────────────────────────────────────────────

function GameCard({ game, i }: { game: GameEvent; i: number }) {
  const style = cardStyle(game);

  if (game.sport === "formula1") {
    return (
      <motion.div
        className="rounded-2xl p-4 bg-[#071e38] border border-[#0f2d4a]"
        style={style}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.4, ease: "easeOut", delay: (i % 2) * 0.08 }}
      >
        <div className="flex justify-between items-center mb-4">
          <span className={`text-xs font-bold tracking-widest ${SPORT_TEXT["formula1"]}`}>FORMULA 1</span>
          <span className="text-gray-500 text-xs">{formatDate(game.date)} · {formatTime(game.date)}</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center text-xl flex-shrink-0">🏎️</div>
          <div>
            <p className="text-white font-bold">{game.homeTeam}</p>
            <p className="text-gray-500 text-xs mt-0.5">{game.awayTeam} · 2026 Season</p>
          </div>
        </div>
        {game.venue && (
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />{game.venue}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="rounded-2xl p-4 bg-[#071e38] border border-[#0f2d4a]"
      style={style}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut", delay: (i % 2) * 0.08 }}
    >
      {/* Sport + date */}
      <div className="flex justify-between items-center mb-4">
        <span className={`text-xs font-bold tracking-widest ${SPORT_TEXT[game.sport]}`}>
          {SPORT_LABEL[game.sport].toUpperCase()}
        </span>
        <span className="text-gray-500 text-xs">{formatDate(game.date)} · {formatTime(game.date)}</span>
      </div>

      {/* Teams */}
      <div className="flex items-center gap-2 mb-4">
        <TeamCircle team={game.homeTeam} logo={game.homeLogo} className="w-10 h-10 text-xs" />
        <p className="text-white font-semibold text-sm flex-1 leading-tight">{game.homeTeam}</p>
        <span className="text-gray-500 text-xs font-semibold flex-shrink-0">VS</span>
        <p className="text-white font-semibold text-sm flex-1 text-right leading-tight">{game.awayTeam}</p>
        <TeamCircle team={game.awayTeam} logo={game.awayLogo} className="w-10 h-10 text-xs" />
      </div>

      {/* Venue */}
      {game.venue && (
        <div className="flex items-center gap-2 text-gray-500 text-xs">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />{game.venue}
        </div>
      )}
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
    ]).then(([gamesData, cricketData]) => {
      const sportGames: GameEvent[]   = gamesData.games?.length ? gamesData.games : buildFallbackGames();
      const cricketGames: GameEvent[] = (cricketData.matches ?? []).map(cricketMatchToEvent);
      const all = [...sportGames, ...cricketGames].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setGames(all);
    }).finally(() => setLoading(false));
  }, []);

  const sports   = ["all", "football", "basketball", "cricket", "formula1"];
  const filtered = filter === "all" ? games : games.filter((g) => g.sport === filter);
  const [featured, ...rest] = filtered;

  return (
    <section id="games" className="py-20 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <Trophy className="w-6 h-6 text-blue-400" />
          <h3 className="text-white font-bold text-2xl">Upcoming Fixtures</h3>
        </div>
        {!loading && (
          <p className="text-gray-500 text-sm mb-8 pl-9">{filtered.length} event{filtered.length !== 1 ? "s" : ""}</p>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-8">
          {sports.map((sport) => (
            <button
              key={sport}
              onClick={() => setFilter(sport)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all border ${
                filter === sport
                  ? "bg-[#0f2d4a] text-white border-blue-500/40"
                  : "bg-transparent text-gray-400 border-[#0f2d4a] hover:text-white"
              }`}
            >
              {sport !== "all" && (
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${SPORT_DOT[sport]}`} />
              )}
              {sport === "all" ? "All" : sport === "formula1" ? "F1" : SPORT_LABEL[sport]}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-52 bg-[#071e38] rounded-2xl animate-pulse" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-36 bg-[#071e38] rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No upcoming fixtures found.</p>
          </div>
        ) : (
          <>
            {featured && <FeaturedCard game={featured} />}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rest.map((game, i) => (
                  <GameCard key={game.id} game={game} i={i} />
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </section>
  );
}
