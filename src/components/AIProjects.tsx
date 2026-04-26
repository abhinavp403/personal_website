"use client";

import { Code2, Download, ExternalLink, GitBranch } from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

interface DownloadLink {
  label: string;
  url: string;
}

interface Project {
  title: string;
  description: string;
  gifUrl: string;
  githubUrl: string;
  downloads?: DownloadLink[];
  tags: string[];
}

const projects: Project[] = [
  {
    title: "Tennis Calendar",
    description: "A desktop app that displays the full 2026 ATP and WTA tour schedules on an interactive calendar, including final results for completed tournaments and keeps track of player rankings.",
    gifUrl: "/tennis-calendar.gif",
    githubUrl: "https://github.com/abhinavp403/tennis-calendar",
    downloads: [
      { label: "Mac", url: "https://github.com/abhinavp403/tennis-calendar/releases/download/v1.0.0/Tennis.Calendar-1.0.0-arm64.dmg" },
      { label: "Windows", url: "https://github.com/abhinavp403/tennis-calendar/releases/download/v1.0.0/Tennis.Calendar.Setup.1.0.0.exe" },
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

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      key={project.title}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: "easeOut", delay: index * 0.15 }}
      className="w-full max-w-lg bg-[#071e38] border border-[#0f2d4a] rounded-2xl overflow-hidden group hover:border-blue-500/50 transition-all duration-300"
    >
      {/* Preview GIF */}
      <div className="w-full bg-[#040f1e]">
        <img
          src={project.gifUrl}
          alt={project.title}
          className="w-full h-auto block"
        />
      </div>

      {/* Divider */}
      <div className="border-t border-[#0f2d4a]" />

      {/* Content */}
      <div className="p-5 space-y-3">
        <h3 className="text-white font-semibold text-lg">{project.title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{project.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-[#0f2d4a] text-blue-300 rounded-full px-3 py-1"
            >
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
  );
}

export default function AIProjects() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="projects" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <Code2 className="w-6 h-6 text-blue-400" />
          <h3 className="text-white font-bold text-2xl">Check out my Projects</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center">
          {projects.map((project, i) => (
            <ProjectCard key={project.title} project={project} index={i} />
          ))}
        </div>

        {/* View all link */}
        <motion.div
          ref={ref}
          className="text-center mt-10"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <a
            href="https://github.com/abhinavp403"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View all projects on GitHub
          </a>
        </motion.div>
      </div>
    </section>
  );
}
