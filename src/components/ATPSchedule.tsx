"use client";

import { useEffect, useState } from "react";
import { CalendarDays, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import type { ATPTournament } from "@/app/api/atp-schedule/route";

// ── Helpers ────────────────────────────────────────────────────────────────────

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sMonth = s.toLocaleString("en-US", { month: "short" });
  const eMonth = e.toLocaleString("en-US", { month: "short" });
  const sDay   = s.getDate();
  const eDay   = e.getDate();
  if (sMonth === eMonth) return `${sMonth} ${sDay}–${eDay}`;
  return `${sMonth} ${sDay} – ${eMonth} ${eDay}`;
}

function getMonth(iso: string): number {
  return new Date(iso).getMonth();
}

// ── Grouping ───────────────────────────────────────────────────────────────────

interface TournamentGroup {
  key:       string;
  name:      string;
  surface:   ATPTournament["surface"];
  venue:     string;
  startDate: string;
  endDate:   string;
  status:    ATPTournament["status"];
  major:     boolean;
  atp?:      ATPTournament;
  wta?:      ATPTournament;
}

function groupTournaments(list: ATPTournament[]): TournamentGroup[] {
  const map = new Map<string, TournamentGroup>();
  for (const t of list) {
    const key = t.name.toLowerCase().trim();
    if (map.has(key)) {
      const g = map.get(key)!;
      g[t.tour] = t;
      if (t.startDate < g.startDate) g.startDate = t.startDate;
      if (t.endDate   > g.endDate)   g.endDate   = t.endDate;
      if (t.status === "live") g.status = "live";
    } else {
      map.set(key, {
        key,
        name:      t.name,
        surface:   t.surface,
        venue:     t.venue,
        startDate: t.startDate,
        endDate:   t.endDate,
        status:    t.status,
        major:     t.major,
        [t.tour]:  t,
      });
    }
  }
  return [...map.values()].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
}

// ── Badges ─────────────────────────────────────────────────────────────────────

const TIER_STYLES: Record<ATPTournament["tier"], string> = {
  "tour-finals": "text-emerald-300 bg-emerald-500/15 border border-emerald-500/30",
  "grand-slam":  "text-yellow-300  bg-yellow-500/15  border border-yellow-500/30",
  "masters-1000":"text-purple-300  bg-purple-500/10  border border-purple-500/25",
  "atp-500":     "text-blue-300    bg-blue-500/10    border border-blue-500/20",
  "atp-250":     "text-gray-400    bg-gray-500/10    border border-gray-500/20",
};

const TIER_LABELS: Record<ATPTournament["tier"], { atp: string; wta: string }> = {
  "tour-finals": { atp: "ATP Finals",   wta: "WTA Finals"  },
  "grand-slam":  { atp: "Grand Slam",   wta: "Grand Slam"  },
  "masters-1000":{ atp: "Masters 1000", wta: "WTA 1000"    },
  "atp-500":     { atp: "ATP 500",      wta: "WTA 500"     },
  "atp-250":     { atp: "ATP 250",      wta: "WTA 250"     },
};

const SURFACE_STYLES: Record<ATPTournament["surface"], string> = {
  clay:  "text-orange-300 bg-orange-500/10 border border-orange-500/20",
  grass: "text-green-300  bg-green-500/10  border border-green-500/20",
  hard:  "text-sky-300    bg-sky-500/10    border border-sky-500/20",
};

const SURFACE_LABELS: Record<ATPTournament["surface"], string> = {
  clay: "Clay", grass: "Grass", hard: "Hard",
};

// ── Tournament card ────────────────────────────────────────────────────────────

function TournamentCard({ g, i }: { g: TournamentGroup; i: number }) {
  const isLive = g.status === "live";
  const isPast = g.status === "past";
  const isBig  = g.major || g.atp?.tier === "tour-finals" || g.wta?.tier === "tour-finals";

  // Pick the "primary" entry for tier badge (ATP if present, else WTA)
  const primary = g.atp ?? g.wta!;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.35, ease: "easeOut", delay: (i % 3) * 0.06 }}
      className={`relative flex flex-col justify-between rounded-2xl p-5 min-h-[200px] border transition-all duration-200 ${
        isLive
          ? "bg-[#071e38] border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
          : "bg-[#071e38] border-[#0f2d4a] hover:border-[#1a3d5c]"
      } ${isPast ? "opacity-45" : ""}`}
    >
      {/* Live pulse */}
      {isLive && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-blue-400 text-[10px] font-bold tracking-widest">LIVE</span>
        </div>
      )}

      {/* Grand Slam star */}
      {g.major && (
        <div className="absolute top-3 right-3 text-yellow-400 text-sm">★</div>
      )}

      {/* Top: badges + name */}
      <div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {g.atp && (
            <span className="text-xs font-bold rounded-full px-2.5 py-0.5 text-blue-300 bg-blue-500/15 border border-blue-500/25">
              ATP
            </span>
          )}
          {g.wta && (
            <span className="text-xs font-bold rounded-full px-2.5 py-0.5 text-pink-300 bg-pink-500/15 border border-pink-500/25">
              WTA
            </span>
          )}
          {g.atp && (
            <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${TIER_STYLES[g.atp.tier]}`}>
              {TIER_LABELS[g.atp.tier].atp}
            </span>
          )}
          {g.wta && (!g.atp || g.wta.tier !== g.atp.tier) && (
            <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${TIER_STYLES[g.wta.tier]}`}>
              {TIER_LABELS[g.wta.tier].wta}
            </span>
          )}
          <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${SURFACE_STYLES[g.surface]}`}>
            {SURFACE_LABELS[g.surface]}
          </span>
        </div>

        <p className={`font-bold leading-snug ${isBig ? "text-xl" : "text-lg"} text-white`}>
          {g.name}
        </p>
      </div>

      {/* Bottom: dates + venue */}
      <div className="mt-3">
        <p className="text-gray-400 text-[13px] font-mono mb-1">
          {formatDateRange(g.startDate, g.endDate)}
        </p>
        {g.venue && (
          <div className="flex items-center gap-1 text-gray-500 text-[13px]">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            {g.venue}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Tour filter ────────────────────────────────────────────────────────────────

type TourFilter = "all" | "atp" | "wta";

// ── Main component ─────────────────────────────────────────────────────────────

export default function ATPSchedule() {
  const [tournaments, setTournaments] = useState<ATPTournament[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState<TourFilter>("all");
  const currentMonth = new Date().getMonth();

  useEffect(() => {
    fetch("/api/atp-schedule")
      .then((r) => r.json())
      .then((d) => setTournaments(d.tournaments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const thisMonth = tournaments.filter((t) => {
    const startsThisMonth = getMonth(t.startDate) === currentMonth;
    const endsThisMonthOrLater =
      new Date(t.endDate).getMonth() >= currentMonth &&
      new Date(t.endDate).getFullYear() === new Date().getFullYear();
    return startsThisMonth || (endsThisMonthOrLater && getMonth(t.startDate) < currentMonth);
  });

  const filtered = filter === "all" ? thisMonth : thisMonth.filter((t) => t.tour === filter);
  const displayed = groupTournaments(filtered);

  return (
    <section id="atp-schedule" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-6 h-6 text-yellow-400" />
            <div>
              <h3 className="text-white font-bold text-2xl">ATP / WTA Tour 2026</h3>
              <p className="text-gray-500 text-sm mt-0.5">{MONTH_NAMES[currentMonth]} tournaments</p>
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex gap-1 bg-[#071e38] border border-[#0f2d4a] rounded-full p-1">
            {(["all", "atp", "wta"] as TourFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all duration-200 ${
                  filter === f
                    ? f === "wta"
                      ? "bg-pink-500/20 text-white border border-pink-500/40"
                      : "bg-blue-500/20 text-white border border-blue-500/40"
                    : "text-gray-400 hover:text-white border border-transparent"
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-36 bg-[#071e38] rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Tournament cards */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {displayed.map((g, i) => (
              <TournamentCard key={g.key} g={g} i={i} />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
