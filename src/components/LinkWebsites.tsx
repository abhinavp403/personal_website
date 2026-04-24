"use client";

import { ExternalLink, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23a11.52 11.52 0 0 1 3-.405 11.52 11.52 0 0 1 3 .405c2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const links = [
  {
    label: "GitHub",
    description: "Code, projects & contributions",
    url: "https://github.com/abhinavp403",
    icon: GithubIcon,
    color: "from-gray-700 to-gray-900",
    badge: "abhinavp403",
  },
  {
    label: "Play Store",
    description: "Android apps I've published",
    url: "https://play.google.com/store/apps/developer?id=Abhinav+Prakash",
    icon: Smartphone,
    color: "from-green-700 to-emerald-900",
    badge: "Apps",
  },
  {
    label: "LinkedIn",
    description: "Professional profile & experience",
    url: "https://www.linkedin.com/in/abhinav-prakash-05/",
    icon: LinkedinIcon,
    color: "from-blue-700 to-blue-900",
    badge: "Connect",
  },
];

export default function LinkWebsites() {
  return (
    <section id="connect" className="py-20 px-4 bg-[#0c0414]">
      <div className="max-w-4xl mx-auto">

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {links.map(({ label, description, url, icon: Icon, color, badge }, i) => (
            <motion.a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative bg-[#1c1528] border border-[#2a1f3d] rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.45, ease: "easeOut", delay: i * 0.1 }}
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

              <div className="relative flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-[#2a1f3d] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-purple-400 transition-colors" />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-semibold">{label}</span>
                    <span className="text-xs bg-[#2a1f3d] text-purple-300 rounded-full px-2 py-0.5">{badge}</span>
                  </div>
                  <p className="text-gray-400 text-sm">{description}</p>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
