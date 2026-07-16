"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Code2, Download, ExternalLink, GitBranch, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DownloadLink {
  label: string;
  url: string;
  filename?: string;
  type?: "download" | "link";
}

interface Project {
  title: string;
  description: string;
  gifUrl?: string;
  videoUrl?: string;
  githubUrl: string;
  downloads?: DownloadLink[];
  tags: string[];
}

const projects: Project[] = [
  {
    title: "FIFA World Cup 26",
    description: "A real-time dashboard for the FIFA World Cup 2026 — live group standings, a dynamic knockout bracket, deep match analytics, per-player stat sheets, head-to-head team comparison, squad rosters, and host-city information.",
    videoUrl: "/fifa-world-cup-26.mov",
    githubUrl: "https://github.com/abhinavp403/fifa-world-cup-26",
    downloads: [
      { label: "Live Site", url: "https://fifa-world-cup-26-nu.vercel.app", type: "link" },
    ],
    tags: ["JavaScript", "CSS", "SQL"],
  },
  {
    title: "Tennis Calendar",
    description: "An interactive calendar that visualizes the full ATP and WTA seasons month by month — highlighting tournament finals with badges, revealing match results and details on hover, and providing quick-access summaries, player stats, and rankings.",
    videoUrl: "/tennis-calendar.mp4",
    githubUrl: "https://github.com/abhinavp403/tennis-calendar",
    downloads: [
      { label: "Live Site", url: "https://tennis-calendar-ivory.vercel.app", type: "link" },
      { label: "Mac", url: "https://github.com/abhinavp403/tennis-calendar/releases/download/v1.0.6/Tennis.Calendar-1.0.6-arm64.dmg" },
      { label: "Windows", url: "https://github.com/abhinavp403/tennis-calendar/releases/download/v1.0.6/Tennis.Calendar.Setup.1.0.6.exe" },
      { label: ".ics", url: "https://raw.githubusercontent.com/abhinavp403/tennis-calendar/main/tennis_calendar.ics", filename: "tennis_calendar.ics" },
    ],
    tags: ["JavaScript", "Python", "Shell"],
  },
  {
    title: "Concert Tracklist Finder",
    description: "An app where you paste a YouTube concert link, and it automatically finds the timestamped tracklist from the comments. Each song can be linked to your Spotify and SoundCloud accounts, so you can access it in a single tap. It also saves previously searched links, letting you rewatch your favorite sets on YouTube anytime instantly.",
    gifUrl: "/concert-tracklist.gif",
    videoUrl: "/concert-tracklist.mp4",
    githubUrl: "https://github.com/abhinavp403/concert-tracklist-finder",
    downloads: [
      { label: "Mac", url: "https://github.com/abhinavp403/concert-tracklist-finder/releases/download/v1.0.0/Concert.Tracklist.Finder-1.0.0-arm64.dmg" },
      { label: "Windows", url: "https://github.com/abhinavp403/concert-tracklist-finder/releases/download/v1.0.0/Concert.Tracklist.Finder.Setup.1.0.0.exe" },
    ],
    tags: ["JavaScript"],
  },
  {
    title: "World Map",
    description: "An interactive desktop app for exploring the world — browse about 200 countries on a zoomable map with hover tooltips showing flag, name, and capital. Toggle between a map view and a collapsible country list organized by continent, filter and search in real time, and hear the correct pronunciation of any country or capital via text-to-speech.",
    videoUrl: "/world-map.mov",
    githubUrl: "https://github.com/abhinavp403/world-map-list",
    downloads: [
      { label: "Mac", url: "https://github.com/abhinavp403/world-map-list/releases/download/v1.1.0/World.Map-1.1.0.dmg" },
      { label: "Windows", url: "https://github.com/abhinavp403/world-map-list/releases/download/v1.1.0/World.Map.Setup.1.1.0.exe" },
    ],
    tags: ["HTML", "Python", "Shell"],
  },
];

/* ── Tag helpers ───────────────────────────────────────────────────────── */

function JSIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z" />
    </svg>
  );
}

function PythonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.9979 0C5.8656 0 6.2 2.6561 6.2 2.6561L6.207 5.408H12.0211V6.234H3.8951S0 5.789 0 11.9695c0 6.18 3.4035 5.963 3.4035 5.963h2.0313V15.064s-.1097-3.408 3.3498-3.408h5.7625s3.2399.0522 3.2399-3.1298V3.2913S18.2776 0 11.9979 0zM8.7975 1.9022a1.0783 1.0783 0 0 1 1.078 1.0783 1.0783 1.0783 0 0 1-1.078 1.0783 1.0783 1.0783 0 0 1-1.0782-1.0783A1.0783 1.0783 0 0 1 8.7975 1.9022z" />
      <path d="M12.0021 23.9979c6.1323 0 5.7979-2.6561 5.7979-2.6561L17.793 18.59H11.9789v-.826H20.105s3.8951.4449 3.8951-5.7356c0-6.1804-3.4034-5.9633-3.4034-5.9633h-2.0313v2.8687s.1097 3.408-3.3498 3.408H9.2681s-3.24-.0521-3.24 3.1298v5.1313S5.537 24 12.0021 24zm3.2004-1.9022a1.0783 1.0783 0 0 1-1.0781-1.0783 1.0783 1.0783 0 0 1 1.0781-1.0782 1.0783 1.0783 0 0 1 1.0782 1.0782 1.0783 1.0783 0 0 1-1.0782 1.0783z" />
    </svg>
  );
}

function HTMLIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.565-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z"/>
    </svg>
  );
}

function CSSIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.565-2.438L1.5 0zm17.09 4.413L5.41 4.41l.213 2.622 10.125.002-.255 2.716h-6.64l.24 2.573h6.182l-.366 3.523-2.91.804-2.956-.81-.188-2.11h-2.61l.29 3.855L12 19.288l5.373-1.53L18.59 4.414z"/>
    </svg>
  );
}

function SQLIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 4.03 2 6.5v11C2 19.97 6.477 22 12 22s10-2.03 10-4.5v-11C22 4.03 17.523 2 12 2zm0 2c4.755 0 8 1.71 8 2.5S16.755 9 12 9 4 7.29 4 6.5 7.245 4 12 4zm-8 4.24C5.407 9.35 8.469 10 12 10s6.593-.65 8-1.76V10.5c0 .79-3.245 2.5-8 2.5s-8-1.71-8-2.5V8.24zm0 5.5C5.407 14.85 8.469 15.5 12 15.5s6.593-.65 8-1.76v1.76c0 .79-3.245 2.5-8 2.5s-8-1.71-8-2.5v-1.76zm0 5.5C5.407 20.35 8.469 21 12 21s6.593-.65 8-1.76V17.5c0 .79-3.245 2.5-8 2.5s-8-1.71-8-2.5v2.24z"/>
    </svg>
  );
}

function renderTagIcon(tag: string) {
  switch (tag) {
    case "JavaScript": return <JSIcon className="w-3 h-3" />;
    case "Python":     return <PythonIcon className="w-3 h-3" />;
    case "Shell":      return <Terminal className="w-3 h-3" />;
    case "HTML":       return <HTMLIcon className="w-3 h-3" />;
    case "CSS":        return <CSSIcon className="w-3 h-3" />;
    case "SQL":        return <SQLIcon className="w-3 h-3" />;
    default:           return null;
  }
}

function getTagStyle(tag: string) {
  switch (tag) {
    case "JavaScript": return "text-yellow-300 bg-yellow-500/10 border border-yellow-500/20";
    case "Python":     return "text-sky-300 bg-sky-500/10 border border-sky-500/20";
    case "Shell":      return "text-gray-300 bg-gray-500/10 border border-gray-500/20";
    case "HTML":       return "text-orange-300 bg-orange-500/10 border border-orange-500/20";
    case "CSS":        return "text-blue-300 bg-blue-500/10 border border-blue-500/20";
    case "SQL":        return "text-emerald-300 bg-emerald-500/10 border border-emerald-500/20";
    default:           return "text-blue-300 bg-[#0f2d4a]";
  }
}

/* ── Main component ────────────────────────────────────────────────────── */

export default function AIProjects() {
  const [current, setCurrent] = useState(0);
  const n = projects.length;

  const navigate = (dir: number) => {
    setCurrent((c) => (c + dir + n) % n);
  };

  return (
    <section id="projects" className="py-20 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header row — title left, counter right */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <Code2 className="w-6 h-6 text-blue-400" />
            <h3 className="text-white font-bold text-2xl">Check out my Projects</h3>
          </div>

          {/* 01 / 02 counter */}
          <div className="flex items-center gap-1 font-mono text-sm select-none">
            <AnimatePresence mode="wait">
              <motion.span
                key={current}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="text-blue-400 font-bold"
              >
                {String(current + 1).padStart(2, "0")}
              </motion.span>
            </AnimatePresence>
            <span className="text-gray-600 mx-0.5">/</span>
            <span className="text-gray-500">{String(n).padStart(2, "0")}</span>
          </div>
        </div>

        {/* Card */}
        <div className="relative rounded-2xl">
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80)     navigate(1);
              else if (info.offset.x > 80) navigate(-1);
            }}
            className="w-full bg-[#071e38] border border-[#0f2d4a] rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing"
            style={{ boxShadow: "0 0 60px rgba(59,130,246,0.12)" }}
          >
            {/* All project cards rendered in the same grid cell — only opacity animates,
                so the container height never collapses and sections below never shift. */}
            <div style={{ display: "grid" }}>
              {projects.map((p, i) => (
                <motion.div
                  key={p.title}
                  style={{ gridArea: "1 / 1" }}
                  animate={{ opacity: i === current ? 1 : 0 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className={`flex flex-col${i !== current ? " pointer-events-none select-none" : ""}`}
                >
                  {/* Preview */}
                  <div className="w-full bg-[#040f1e] overflow-hidden" style={{ aspectRatio: "3024/1964" }}>
                    {p.videoUrl ? (
                      <video
                        src={p.videoUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover block pointer-events-none"
                      />
                    ) : (
                      <img
                        src={p.gifUrl}
                        alt={p.title}
                        className="w-full h-full object-cover block pointer-events-none"
                        draggable={false}
                      />
                    )}
                  </div>

                  {/* Blue accent line */}
                  <div className="h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />

                  {/* Content */}
                  <div className="p-5 flex flex-col gap-3 flex-1">
                    <h3 className="text-white font-semibold text-lg">{p.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-4">{p.description}</p>

                    {/* Tags + Links pinned to bottom */}
                    <div className="mt-auto flex flex-col gap-3">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {p.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`flex items-center gap-1.5 text-xs rounded-full px-3 py-1 ${getTagStyle(tag)}`}
                          >
                            {renderTagIcon(tag)}
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Links */}
                      <div className="flex flex-wrap gap-3">
                        <a
                          href={p.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-[#0f2d4a] hover:bg-[#163d60] rounded-full px-4 py-2"
                        >
                          <GitBranch className="w-4 h-4" />
                          GitHub
                        </a>
                        {p.downloads?.map(({ label, url, filename, type }) => (
                          <a
                            key={label}
                            href={url}
                            download={filename}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-[#0f2d4a] hover:bg-[#163d60] rounded-full px-4 py-2"
                          >
                            {type === "link" ? <ExternalLink className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                            {label}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Navigation + thumbnail strip */}
        <div className="flex items-center justify-between mt-5 gap-4">

          {/* Left arrow */}
          <button
            onClick={() => navigate(-1)}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-[#071e38] border border-[#0f2d4a] flex items-center justify-center text-white hover:border-blue-500/50 hover:text-blue-400 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Project name strip */}
          <div className="flex gap-3 flex-1 justify-center">
            {projects.map((p, i) => (
              <button
                key={p.title}
                onClick={() => setCurrent(i)}
                className={`text-sm font-semibold px-4 py-2 rounded-full transition-all duration-300 ${
                  i === current
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                    : "text-gray-500 hover:text-gray-300 border border-transparent"
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>

          {/* Right arrow */}
          <button
            onClick={() => navigate(1)}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-[#071e38] border border-[#0f2d4a] flex items-center justify-center text-white hover:border-blue-500/50 hover:text-blue-400 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </section>
  );
}
