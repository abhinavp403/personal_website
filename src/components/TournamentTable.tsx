"use client";

import { useEffect, useState } from "react";
import { TableProperties } from "lucide-react";
import { motion } from "framer-motion";
import type { ATPTournament } from "@/app/api/atp-schedule/route";

// ── Helpers ────────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sMonth = s.toLocaleString("en-US", { month: "short" });
  const eMonth = e.toLocaleString("en-US", { month: "short" });
  const sDay = s.getDate();
  const eDay = e.getDate();
  if (sMonth === eMonth) return `${sMonth} ${sDay}–${eDay}`;
  return `${sMonth} ${sDay} – ${eMonth} ${eDay}`;
}

// ── Badge styles ───────────────────────────────────────────────────────────────

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
  clay:  "text-orange-300",
  grass: "text-green-300",
  hard:  "text-sky-300",
};

const SURFACE_LABELS: Record<ATPTournament["surface"], string> = {
  clay: "Clay", grass: "Grass", hard: "Hard",
};

// ── Filter tabs ────────────────────────────────────────────────────────────────

type TourFilter = "all" | "atp" | "wta";

const FILTER_TABS: { value: TourFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "atp", label: "ATP" },
  { value: "wta", label: "WTA" },
];

// ── Main component ─────────────────────────────────────────────────────────────

export default function TournamentTable() {
  const [tournaments, setTournaments] = useState<ATPTournament[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState<TourFilter>("all");

  useEffect(() => {
    fetch("/api/atp-schedule")
      .then((r) => r.json())
      .then((d) => setTournaments(d.tournaments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Exclude Grand Slams, apply tour filter
  const filtered = tournaments.filter(
    (t) => t.tier !== "grand-slam" && (filter === "all" || t.tour === filter),
  );

  // Group by month
  const byMonth = filtered.reduce<Record<number, ATPTournament[]>>((acc, t) => {
    const m = new Date(t.startDate).getMonth();
    (acc[m] ??= []).push(t);
    return acc;
  }, {});

  const months = Object.keys(byMonth)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <section id="tournament-table" className="py-12 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <TableProperties className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-bold text-xl">2026 Full Schedule</h3>
            <span className="text-gray-500 text-sm">(excl. Grand Slams)</span>
          </div>

          {/* Tour filter tabs */}
          <div className="flex gap-1 bg-[#071e38] border border-[#0f2d4a] rounded-full p-1">
            {FILTER_TABS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all ${
                  filter === value
                    ? "bg-blue-500/20 text-white border border-blue-500/40"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-[#071e38] rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className="space-y-8">
            {months.map((month) => (
              <motion.div
                key={month}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {/* Month header */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    {MONTH_NAMES[month]}
                  </span>
                  <div className="flex-1 h-px bg-[#0f2d4a]" />
                  <span className="text-xs text-gray-600">{byMonth[month].length} events</span>
                </div>

                {/* Rows */}
                <div className="rounded-2xl border border-[#0f2d4a] overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {byMonth[month].map((t, i) => {
                        const isLive = t.status === "live";
                        const isPast = t.status === "past";
                        return (
                          <tr
                            key={t.id}
                            className={`border-b border-[#0a2236] last:border-b-0 transition-colors ${
                              isLive
                                ? "bg-blue-500/5"
                                : i % 2 === 0
                                ? "bg-[#071e38]"
                                : "bg-[#061828]"
                            } ${isPast ? "opacity-40" : ""} hover:bg-[#0f2d4a]/50`}
                          >
                            {/* Dates */}
                            <td className="pl-4 pr-3 py-2.5 text-gray-500 font-mono text-xs whitespace-nowrap w-[110px]">
                              {formatDateRange(t.startDate, t.endDate)}
                            </td>

                            {/* Tournament name */}
                            <td className="px-3 py-2.5 text-white font-medium">
                              <div className="flex items-center gap-2">
                                {isLive && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
                                )}
                                {t.name}
                              </div>
                            </td>

                            {/* Tour */}
                            <td className="px-3 py-2.5 hidden sm:table-cell">
                              <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
                                t.tour === "atp"
                                  ? "text-blue-300 bg-blue-500/15 border border-blue-500/25"
                                  : "text-pink-300 bg-pink-500/15 border border-pink-500/25"
                              }`}>
                                {t.tour.toUpperCase()}
                              </span>
                            </td>

                            {/* Level */}
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${TIER_STYLES[t.tier]}`}>
                                {TIER_LABELS[t.tier][t.tour]}
                              </span>
                            </td>

                            {/* Surface */}
                            <td className="px-3 pr-4 py-2.5 hidden md:table-cell">
                              <span className={`text-xs font-medium ${SURFACE_STYLES[t.surface]}`}>
                                {SURFACE_LABELS[t.surface]}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
