"use client";

import { Download, ExternalLink, GitBranch } from "lucide-react";
import Image from "next/image";

interface Project {
  title: string;
  description: string;
  gifUrl: string;
  githubUrl: string;
  installUrl?: string;
  tags: string[];
}

// Replace these with your actual projects
const projects: Project[] = [
  {
    title: "AI Chat Assistant",
    description: "A conversational AI assistant built with Claude API featuring context-aware responses and real-time streaming.",
    gifUrl: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&h=340&fit=crop",
    githubUrl: "https://github.com/abhinavp403",
    installUrl: "https://github.com/abhinavp403",
    tags: ["Python", "Claude API", "FastAPI"],
  },
  {
    title: "Image Recognition App",
    description: "Real-time object detection and classification using computer vision models deployed on mobile.",
    gifUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600&h=340&fit=crop",
    githubUrl: "https://github.com/abhinavp403",
    tags: ["TensorFlow", "Android", "Kotlin"],
  },
  {
    title: "NLP Text Summarizer",
    description: "Automatic document summarization using transformer-based models with a clean web interface.",
    gifUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=340&fit=crop",
    githubUrl: "https://github.com/abhinavp403",
    installUrl: "https://github.com/abhinavp403",
    tags: ["HuggingFace", "React", "Node.js"],
  },
];

export default function AIProjects() {
  return (
    <section id="projects" className="py-20 px-4 bg-[#0c0414]">
      <div className="max-w-6xl mx-auto">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.title}
              className="bg-[#1c1528] border border-[#2a1f3d] rounded-2xl overflow-hidden group hover:border-purple-500/50 transition-all duration-300"
            >
              {/* Preview image / GIF */}
              <div className="relative w-full h-44 overflow-hidden bg-[#120d1e]">
                <Image
                  src={project.gifUrl}
                  alt={project.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1c1528] via-transparent to-transparent" />
              </div>

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
                <div className="flex gap-3 pt-2">
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-[#2a1f3d] hover:bg-[#3a2f4d] rounded-full px-4 py-2"
                  >
                    <GitBranch className="w-4 h-4" />
                    GitHub
                  </a>
                  {project.installUrl && (
                    <a
                      href={project.installUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-[#2a1f3d] hover:bg-[#3a2f4d] rounded-full px-4 py-2"
                    >
                      <Download className="w-4 h-4" />
                      Install
                    </a>
                  )}
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
