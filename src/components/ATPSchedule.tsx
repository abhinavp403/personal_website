"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import { motion } from "framer-motion";
import type { ATPTournament } from "@/app/api/atp-schedule/route";

// ── Helpers ────────────────────────────────────────────────────────────────────

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DOW_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

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
  // Live first, then upcoming, then finished — each by start date
  const rank = { live: 0, upcoming: 1, past: 2 };
  return [...map.values()].sort(
    (a, b) =>
      rank[a.status] - rank[b.status] ||
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
}

// ── Labels ─────────────────────────────────────────────────────────────────────

const TIER_LABELS: Record<ATPTournament["tier"], { atp: string; wta: string }> = {
  "tour-finals": { atp: "ATP Finals",   wta: "WTA Finals"  },
  "grand-slam":  { atp: "Grand Slam",   wta: "Grand Slam"  },
  "masters-1000":{ atp: "Masters 1000", wta: "WTA 1000"    },
  "atp-500":     { atp: "ATP 500",      wta: "WTA 500"     },
  "atp-250":     { atp: "ATP 250",      wta: "WTA 250"     },
};

const SURFACE_LABELS: Record<ATPTournament["surface"], string> = {
  clay:         "Clay",
  grass:        "Grass",
  hard:         "Hard",
  "hard-indoor":"Indoor Hard",
};

// ── Timeline bar styling ───────────────────────────────────────────────────────

const ATP_BLUE = "#60a5fa";
const WTA_PINK = "#f472b6";
const TODAY    = "#facc15";

// Bigger events get thicker bars
const TIER_BAR_HEIGHT: Record<ATPTournament["tier"], number> = {
  "tour-finals":  54,
  "grand-slam":   54,
  "masters-1000": 42,
  "atp-500":      36,
  "atp-250":      30,
};

function barBackground(g: TournamentGroup): string {
  if (g.atp && g.wta) return `linear-gradient(180deg, ${ATP_BLUE} 0%, ${ATP_BLUE} 50%, ${WTA_PINK} 50%, ${WTA_PINK} 100%)`;
  return g.wta ? WTA_PINK : ATP_BLUE;
}

function tierLabel(g: TournamentGroup): string {
  const labels: string[] = [];
  if (g.atp) labels.push(TIER_LABELS[g.atp.tier].atp);
  if (g.wta && (!g.atp || TIER_LABELS[g.wta.tier].wta !== TIER_LABELS[g.atp.tier].atp)) {
    labels.push(TIER_LABELS[g.wta.tier].wta);
  }
  return labels.join(" / ");
}

function statusLabel(g: TournamentGroup): string {
  if (g.status === "live") return "Live";
  if (g.status === "past") return "Done";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = new Date(g.startDate); start.setHours(0, 0, 0, 0);
  const days = Math.round((start.getTime() - today.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

const ROW_COLS = "md:grid md:grid-cols-[260px_minmax(0,1fr)]";

// Vertical "today" marker, drawn per row so the segments join into one line
function TodayLine({ today, daysInMonth }: { today: number; daysInMonth: number }) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-y-0 w-0.5 -ml-px"
      style={{
        left:       `${((today - 0.5) / daysInMonth) * 100}%`,
        background: TODAY,
        boxShadow:  "0 0 12px rgba(250,204,21,0.7)",
      }}
    />
  );
}

// ── Timeline row ───────────────────────────────────────────────────────────────

function TimelineRow({
  g, year, month, daysInMonth, today,
}: {
  g: TournamentGroup; year: number; month: number; daysInMonth: number; today: number;
}) {
  const isLive = g.status === "live";
  const isPast = g.status === "past";

  // Clamp the bar to this month — a tournament may have started in the previous one
  const start    = new Date(g.startDate);
  const end      = new Date(g.endDate);
  const startDay = start.getFullYear() === year && start.getMonth() === month ? start.getDate() : 1;
  const endDay   = end.getFullYear() === year && end.getMonth() === month ? end.getDate() : daysInMonth;
  const span     = endDay - startDay + 1;

  const primary = g.atp ?? g.wta!;
  const height  = Math.max(...[g.atp, g.wta].filter(Boolean).map((t) => TIER_BAR_HEIGHT[t!.tier]));
  const dates   = formatDateRange(g.startDate, g.endDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`${ROW_COLS} border-b border-[#0f2d4a]/60 last:border-b-0`}
    >
      {/* Label */}
      <div className={`pt-4 md:py-4 md:pr-4 ${isPast ? "opacity-75" : ""}`}>
        <p className={`text-white font-bold leading-tight ${g.major || primary.tier === "tour-finals" ? "text-lg" : "text-base"}`}>
          {g.name}
        </p>
        <p className="text-gray-400 text-xs mt-1">
          <span className={isLive ? "text-blue-400 font-bold" : "text-gray-300 font-semibold"}>{statusLabel(g)}</span>
          {" · "}
          {[tierLabel(g), SURFACE_LABELS[g.surface], g.venue].filter(Boolean).join(" · ")}
        </p>
        <p className="md:hidden text-gray-400 text-xs font-mono mt-1">{dates}</p>
      </div>

      {/* Track */}
      <div
        className="relative grid items-center min-h-[58px] md:min-h-[82px]"
        style={{ gridTemplateColumns: `repeat(${daysInMonth}, minmax(0, 1fr))` }}
      >
        <TodayLine today={today} daysInMonth={daysInMonth} />
        <div
          className={`relative rounded-full flex items-center justify-between gap-2 px-3.5 overflow-hidden whitespace-nowrap text-[#020d1c] ${isPast ? "opacity-75" : ""}`}
          style={{
            gridColumn: `${startDay} / ${endDay + 1}`,
            height,
            background: barBackground(g),
            boxShadow:  isLive ? "0 0 24px rgba(255,255,255,0.25)" : undefined,
          }}
        >
          {span >= 4 && <span className="hidden md:inline text-xs font-bold font-mono">{dates}</span>}
          {isLive && span >= 2 && (
            <span className="ml-auto flex items-center gap-1.5 text-[11px] font-bold font-mono tracking-wide">
              <span className="w-2 h-2 rounded-full bg-[#020d1c] animate-pulse" />
              {span >= 6 && <span className="hidden md:inline">LIVE</span>}
            </span>
          )}
        </div>
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
  const [showPast, setShowPast]       = useState(false);

  const now          = new Date();
  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth();
  const today        = now.getDate();
  const daysInMonth  = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDow     = new Date(currentYear, currentMonth, 1).getDay();

  useEffect(() => {
    fetch("/api/atp-schedule")
      .then((r) => r.json())
      .then((d) => setTournaments(d.tournaments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const thisMonth = tournaments.filter(
    (t) =>
      getMonth(t.endDate) === currentMonth &&
      new Date(t.endDate).getFullYear() === currentYear
  );

  const filtered  = filter === "all" ? thisMonth : thisMonth.filter((t) => t.tour === filter);
  const displayed = groupTournaments(filtered);
  const liveCount = displayed.filter((g) => g.status === "live").length;

  // Finished tournaments fold behind a toggle, unless they are all there is to show
  const current   = displayed.filter((g) => g.status !== "past");
  const finished  = displayed.filter((g) => g.status === "past");
  const foldPast  = current.length > 0 && finished.length > 0;
  const rows      = foldPast && !showPast ? current : displayed;

  return (
    <section id="atp-schedule" className="py-20 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <SectionHeading eyebrow="On tour" title={`ATP / WTA Tour ${currentYear}`} />
            <p className="text-gray-400 text-sm mt-2">
              {MONTH_NAMES[currentMonth]} tournaments
              {!loading && liveCount > 0 && ` · ${liveCount} live right now`}
            </p>
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
        {loading && <div className="h-96 bg-[#071e38] rounded-2xl animate-pulse" />}

        {/* Month timeline */}
        {!loading && (
          <div>

            {/* Day ruler */}
            <div className={`${ROW_COLS} items-end border-b border-[#0f2d4a]`}>
              <div className="hidden md:block pb-3 font-mono text-xs font-bold tracking-[0.25em] text-gray-400 uppercase">
                {now.toLocaleString("en-US", { month: "long" })}
              </div>
              <div
                className="relative grid pb-3"
                style={{ gridTemplateColumns: `repeat(${daysInMonth}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: daysInMonth }, (_, idx) => {
                  const n       = idx + 1;
                  const dow     = (firstDow + idx) % 7;
                  const isToday = n === today;
                  // On phones only a few day numbers fit
                  const keyDay  = isToday || ((n === 1 || n % 5 === 0) && Math.abs(n - today) > 2);
                  return (
                    <div key={n} className="text-center">
                      <div className={`hidden md:block font-mono text-[10px] font-medium text-gray-300`}>
                        {DOW_LETTERS[dow]}
                      </div>
                      <div
                        className={`font-mono text-[10px] md:text-[13px] font-bold rounded-full mt-1 py-0.5 ${
                          keyDay ? "" : "invisible md:visible"
                        } ${isToday ? "text-[#020d1c]" : "text-white"}`}
                        style={isToday ? { background: TODAY } : undefined}
                      >
                        {n}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {displayed.length === 0 ? (
              <p className="text-center text-gray-500 py-12">No tournaments this month.</p>
            ) : (
              rows.map((g) => (
                <TimelineRow
                  key={g.key}
                  g={g}
                  year={currentYear}
                  month={currentMonth}
                  daysInMonth={daysInMonth}
                  today={today}
                />
              ))
            )}

            {foldPast && (
              <button
                type="button"
                onClick={() => setShowPast((v) => !v)}
                aria-expanded={showPast}
                className="mt-4 flex items-center gap-2 font-mono text-xs font-bold tracking-[0.2em] uppercase text-gray-300 hover:text-white border border-[#0f2d4a] hover:border-blue-500/40 bg-[#071e38] rounded-full px-4 py-2 transition-colors"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showPast ? "rotate-180" : ""}`} />
                {showPast ? "Hide finished" : `Show ${finished.length} finished`}
              </button>
            )}
          </div>
        )}

      </div>
    </section>
  );
}
