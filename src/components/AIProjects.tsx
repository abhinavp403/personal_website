"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Code2, Download, GitBranch, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DownloadLink {
  label: string;
  url: string;
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
    title: "Tennis Calendar",
    description: "An interactive calendar that visualizes the full ATP and WTA seasons month by month — highlighting tournament finals with badges, revealing match results and details on hover, and providing quick-access summaries, player stats, and rankings.",
    videoUrl: "/tennis-calendar.mp4",
    githubUrl: "https://github.com/abhinavp403/tennis-calendar",
    downloads: [
      { label: "Mac", url: "https://github.com/abhinavp403/tennis-calendar/releases/download/v1.0.1/Tennis.Calendar-1.0.1-arm64.dmg" },
      { label: "Windows", url: "https://github.com/abhinavp403/tennis-calendar/releases/download/v1.0.1/Tennis.Calendar.Setup.1.0.1.exe" },
    ],
    tags: ["JavaScript", "Python", "Shell"],
  },
  {
    title: "Concert Tracklist Finder",
    description: "A desktop app where you paste a YouTube link for a concert and it finds the comment containing the tracklist ordered by timestamp. Each song is connected to your Spotify and SoundCloud accounts so you can find them with just 1 tap. It saves previously searched links so you can come back and listen to your favourite unreleased songs again.",
    gifUrl: "/concert-tracklist.gif",
    githubUrl: "https://github.com/abhinavp403/concert-tracklist-finder",
    downloads: [
      { label: "Mac", url: "https://github.com/abhinavp403/concert-tracklist-finder/releases/download/v1.0.0/Concert.Tracklist.Finder-1.0.0-arm64.dmg" },
      { label: "Windows", url: "https://github.com/abhinavp403/concert-tracklist-finder/releases/download/v1.0.0/Concert.Tracklist.Finder.Setup.1.0.0.exe" },
    ],
    tags: ["JavaScript"],
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

function renderTagIcon(tag: string) {
  switch (tag) {
    case "JavaScript": return <JSIcon className="w-3 h-3" />;
    case "Python":     return <PythonIcon className="w-3 h-3" />;
    case "Shell":      return <Terminal className="w-3 h-3" />;
    default:           return null;
  }
}

function getTagStyle(tag: string) {
  switch (tag) {
    case "JavaScript": return "text-yellow-300 bg-yellow-500/10 border border-yellow-500/20";
    case "Python":     return "text-sky-300 bg-sky-500/10 border border-sky-500/20";
    case "Shell":      return "text-gray-300 bg-gray-500/10 border border-gray-500/20";
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

  const project = projects[current];

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
              {/* Preview */}
              <div className="w-full bg-[#040f1e]">
                {project.videoUrl ? (
                  <video
                    src={project.videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-auto block pointer-events-none"
                  />
                ) : (
                  <img
                    src={project.gifUrl}
                    alt={project.title}
                    className="w-full h-auto block pointer-events-none"
                    draggable={false}
                  />
                )}
              </div>

              {/* Blue accent line */}
              <div className="h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />

              {/* Content */}
              <div className="p-5 space-y-3">
                <h3 className="text-white font-semibold text-lg">{project.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{project.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
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
                <div className="flex flex-wrap gap-3 pt-2">
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-[#0f2d4a] hover:bg-[#163d60] rounded-full px-4 py-2"
                  >
                    <GitBranch className="w-4 h-4" />
                    GitHub
                  </a>
                  {project.downloads?.map(({ label, url }) => (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-[#0f2d4a] hover:bg-[#163d60] rounded-full px-4 py-2"
                    >
                      <Download className="w-4 h-4" />
                      {label}
                    </a>
                  ))}
                </div>
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
