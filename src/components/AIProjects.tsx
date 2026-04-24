"use client";

import { Download, ExternalLink, GitBranch } from "lucide-react";

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

// Replace these with your actual projects
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

export default function AIProjects() {
  return (
    <section id="projects" className="py-20 px-4 bg-[#0c0414]">
      <div className="max-w-6xl mx-auto">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center">
          {projects.map((project) => (
            <div
              key={project.title}
              className="w-full max-w-lg bg-[#1c1528] border border-[#2a1f3d] rounded-2xl overflow-hidden group hover:border-purple-500/50 transition-all duration-300"
            >
              {/* Preview GIF — natural aspect ratio, no crop */}
              <div className="w-full bg-[#120d1e]">
                <img
                  src={project.gifUrl}
                  alt={project.title}
                  className="w-full h-auto block"
                />
              </div>

              {/* Divider */}
              <div className="border-t border-[#2a1f3d]" />

              {/* Content */}
              <div className="p-5 space-y-3">
                <h3 className="text-white font-semibold text-lg">{project.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{project.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-[#2a1f3d] text-purple-300 rounded-full px-3 py-1"
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
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-[#2a1f3d] hover:bg-[#3a2f4d] rounded-full px-4 py-2"
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
                      className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-[#2a1f3d] hover:bg-[#3a2f4d] rounded-full px-4 py-2"
                    >
                      <Download className="w-4 h-4" />
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View all link */}
        <div className="text-center mt-10">
          <a
            href="https://github.com/abhinavp403"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View all projects on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
