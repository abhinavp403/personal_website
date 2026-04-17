"use client";

import { useEffect, useState } from "react";
import { Calendar, MapPin, Trophy } from "lucide-react";
import type { GameEvent } from "@/lib/sports";
import type { CricketMatch } from "@/app/api/cricket/route";

const SPORT_ICONS: Record<string, string> = {
  football:  "⚽",
  cricket:   "🏏",
  basketball:"🏀",
  formula1:  "🏎️",
};

const SPORT_COLORS: Record<string, string> = {
  football:   "bg-green-500/10 text-green-400 border-green-500/20",
  cricket:    "bg-blue-500/10 text-blue-400 border-blue-500/20",
  basketball: "bg-orange-600/10 text-orange-500 border-orange-600/20",
  formula1:   "bg-red-500/10 text-red-400 border-red-500/20",
};

const SPORT_LABEL: Record<string, string> = {
  football:   "Football",
  cricket:    "Cricket",
  basketball: "Basketball",
  formula1:   "Formula 1",
};

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
    { id:"1", homeTeam:"Manchester United", awayTeam:"Chelsea",            date:d(1), league:"Premier League",      sport:"football",   venue:"Old Trafford"         },
    { id:"2", homeTeam:"Barcelona",         awayTeam:"Real Madrid",        date:d(2), league:"La Liga",             sport:"football",   venue:"Camp Nou"             },
    { id:"4", homeTeam:"Boston Celtics",    awayTeam:"Miami Heat",         date:d(3), league:"NBA",                 sport:"basketball", venue:"TD Garden"            },
    { id:"5", homeTeam:"Miami Grand Prix",  awayTeam:"Round 6",            date:d(4), league:"Formula 1",           sport:"formula1",   venue:"Miami International Autodrome"},
    { id:"6", homeTeam:"Inter Miami",       awayTeam:"LA Galaxy",          date:d(5), league:"MLS",                 sport:"football",   venue:"Chase Stadium"        },
  ];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
function daysUntil(iso: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const match = new Date(iso);
  match.setHours(0, 0, 0, 0);
  const days = Math.round((match.getTime() - today.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

function TeamLogo({ logo, name }: { logo?: string; name: string }) {
  const [err, setErr] = useState(false);
  if (logo && !err) {
    return (
      <img
        src={logo}
        alt={name}
        onError={() => setErr(true)}
        className="w-10 h-10 object-contain mx-auto mb-1"
      />
    );
  }
  return (
    <div className="w-10 h-10 bg-[#2a1f3d] rounded-full mx-auto mb-1 flex items-center justify-center text-white font-bold">
      {name[0]}
    </div>
  );
}

export default function UpcomingGames() {
  const [games, setGames]   = useState<GameEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<string>("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/games").then((r) => r.json()).catch(() => ({ games: [] })),
      fetch("/api/cricket").then((r) => r.json()).catch(() => ({ matches: [] })),
    ]).then(([gamesData, cricketData]) => {
      const sportGames: GameEvent[] = gamesData.games?.length ? gamesData.games : buildFallbackGames();
      const cricketGames: GameEvent[] = (cricketData.matches ?? []).map(cricketMatchToEvent);
      const all = [...sportGames, ...cricketGames].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setGames(all);
    }).finally(() => setLoading(false));
  }, []);

  const sports = ["all", "football", "basketball", "cricket", "formula1"];
  const filtered = filter === "all" ? games : games.filter((g) => g.sport === filter);

  return (
    <section id="games" className="py-20 px-4 bg-[#0a0312]">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#1c1528] rounded-full px-4 py-2 text-xs text-gray-400 mb-4">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            Sports
          </div>
          <h2 className="text-4xl font-bold text-white">Next Games</h2>
          <p className="text-gray-400 mt-3 max-w-xl mx-auto">
            Next scheduled fixture for each of my favourite teams.
          </p>
        </div>

        {/* Sport filter */}
        <div className="flex gap-2 flex-wrap justify-center mb-8">
          {sports.map((sport) => (
            <button
              key={sport}
              onClick={() => setFilter(sport)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                filter === sport
                  ? "bg-purple-600 text-white"
                  : "bg-[#1c1528] text-gray-400 hover:text-white"
              }`}
            >
              {sport !== "all" && <span>{SPORT_ICONS[sport]}</span>}
              {sport === "all" ? "All Sports" : SPORT_LABEL[sport]}
            </button>
          ))}
        </div>

        {/* Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-44 bg-[#1c1528] rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No upcoming fixtures found for this sport.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((game) => (
              <div
                key={game.id}
                className="bg-[#1c1528] border border-[#2a1f3d] rounded-2xl p-5 hover:border-purple-500/30 transition-all"
              >
                {/* Badge + countdown */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-semibold rounded-full px-3 py-1 border ${SPORT_COLORS[game.sport] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
                    {SPORT_ICONS[game.sport]} {SPORT_LABEL[game.sport] ?? game.sport}
                  </span>
                  <span className="text-xs text-purple-400 font-semibold">{daysUntil(game.date)}</span>
                </div>

                {/* Teams / Race */}
                {game.sport === "formula1" ? (
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                      🏎️
                    </div>
                    <div>
                      <p className="text-white font-semibold">{game.homeTeam}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{game.awayTeam}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex-1 text-center">
                      <TeamLogo logo={game.homeLogo} name={game.homeTeam} />
                      <p className="text-white text-sm font-semibold leading-tight">{game.homeTeam}</p>
                    </div>
                    <div className="text-gray-500 font-bold text-sm flex-shrink-0">VS</div>
                    <div className="flex-1 text-center">
                      <TeamLogo logo={game.awayLogo} name={game.awayTeam} />
                      <p className="text-white text-sm font-semibold leading-tight">{game.awayTeam}</p>
                    </div>
                  </div>
                )}

                {/* Date / venue */}
                <div className="border-t border-[#2a1f3d] pt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-gray-400 text-xs">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                    {formatDate(game.date)} · {formatTime(game.date)}
                  </div>
                  {game.venue && (
                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      {game.venue}
                    </div>
                  )}
                  <p className="text-gray-600 text-xs">{game.league}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
