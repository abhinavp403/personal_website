"use client";

import * as React from "react";
import Image from "next/image";
import { Barlow_Condensed } from "next/font/google";
import { motion } from "framer-motion";
import { ShaderAnimation } from "@/components/ui/shader-lines";
import { GithubIcon, LinkedinIcon } from "@/components/LinkWebsites";

// Condensed display face for the trading-card type
const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700", "800"],
  style: ["normal", "italic"],
});

const ROLES = ["Software Developer", "DJ", "Sports Enthusiast", "Philosopher"];

// "Scouting report" rows — label, value, value colour
const REPORT: { label: string; value: string; color: string }[] = [
  { label: "Position", value: "Android dev",          color: "text-green-400"  },
  { label: "Side gig", value: "DJ",                   color: "text-purple-400" },
  { label: "Sports", value: "Tennis & football",    color: "text-yellow-400" },
  { label: "Off days", value: "Film & series",        color: "text-orange-400" },
  { label: "Learning", value: "Countries & capitals", color: "text-blue-400"   },
  { label: "Watches",  value: "The stock market",     color: "text-pink-400"   },
];

function TypingText() {
  const [roleIndex, setRoleIndex] = React.useState(0);
  const [displayed, setDisplayed] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    const current = ROLES[roleIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && displayed.length < current.length) {
      timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 80);
    } else if (!deleting && displayed.length === current.length) {
      timeout = setTimeout(() => setDeleting(true), 1800);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length - 1)), 40);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setRoleIndex((i) => (i + 1) % ROLES.length);
    }

    return () => clearTimeout(timeout);
  }, [displayed, deleting, roleIndex]);

  return <>{displayed}</>;
}

const Hero1 = () => {
  return (
    <div className="min-h-screen bg-[#020d1c] text-white flex flex-col relative overflow-x-hidden">
      {/* Shader background */}
      <ShaderAnimation />
      {/* Dark overlay so text/cards stay readable */}
      <div className="absolute inset-0 bg-[#020d1c]/70 z-[1]" />

      {/* Main content */}
      {/* lg:pl clears the fixed left nav rail while the background stays full-bleed */}
      <main className="flex-1 flex items-center justify-center px-6 py-20 z-[2] lg:pl-[10.5rem]">
        <div className="max-w-6xl w-full mx-auto flex flex-col md:flex-row items-center gap-12 lg:gap-16">

          {/* Left — player card */}
          <motion.div
            className="flex-shrink-0"
            initial={{ opacity: 0, x: -40, rotate: 0 }}
            animate={{ opacity: 1, x: 0, rotate: -3 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="w-[300px] sm:w-[380px] h-[480px] sm:h-[600px] rounded-[28px] bg-yellow-400 p-3 shadow-[0_30px_70px_rgba(0,0,0,0.6)]">
              <div className="h-full rounded-[18px] bg-[#071e38] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center px-4 py-3">
                  <span className={`${barlow.className} text-yellow-400 text-4xl font-extrabold leading-none`}>DEV</span>
                  <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-gray-300">
                    {new Date().getFullYear()} SEASON
                  </span>
                </div>
                <div className="relative flex-1 min-h-0">
                  <Image
                    src="/profile.jpg"
                    alt="Abhinav Prakash"
                    fill
                    preload
                    sizes="(min-width: 640px) 356px, 276px"
                    className="object-cover object-top"
                  />
                </div>
                <div className="bg-blue-600 px-4 pt-3 pb-4">
                  <p className={`${barlow.className} italic font-extrabold uppercase text-4xl sm:text-[46px] leading-[0.95]`}>
                    Abhinav Prakash
                  </p>
                  <div className="flex justify-between font-mono text-[11px] font-bold tracking-[0.2em] mt-2">
                    <span>SOFTWARE DEVELOPER</span>
                    <span>ANDROID</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right — scouting report */}
          <motion.div
            className="flex-1 min-w-0 flex flex-col gap-5"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          >
            <div>
              <h2 className="font-mono text-[13px] font-bold tracking-[0.3em] text-yellow-400">
                ABOUT ME · SCOUTING REPORT
              </h2>
              <p className="font-mono text-sm font-bold text-blue-400 mt-2 h-5">
                &gt; <TypingText />
              </p>
            </div>

            <p className="text-white text-lg leading-relaxed">
              Hi, I&apos;m <span className="font-semibold">Abhinav Prakash</span> — a software developer specializing in Android. I build thoughtful, user-centric tools for niche problems, and lately tools that put AI to practical use.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 border-b border-[#1a3d5c]">
              {REPORT.map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center gap-3 min-h-[52px] border-t border-[#1a3d5c]">
                  <span className="font-mono text-xs font-bold tracking-[0.2em] text-gray-400 uppercase">{label}</span>
                  <span className={`${barlow.className} ${color} text-2xl font-extrabold uppercase text-right`}>{value}</span>
                </div>
              ))}
            </div>

            <p className="text-gray-300 text-[15px] leading-relaxed">
              Known for a natural curiosity: collects random facts, experiments through passion projects and keeps pushing creative boundaries.
            </p>

            {/* Next steps — the full link cards live in Let's Connect at the bottom */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#projects"
                className="font-mono text-xs font-bold tracking-[0.2em] uppercase bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 py-3 transition-colors"
              >
                View projects
              </a>
              <a
                href="https://github.com/abhinavp403"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="w-11 h-11 rounded-full border border-[#1a3d5c] hover:border-blue-400 text-gray-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <GithubIcon className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/abhinav-prakash-05/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-11 h-11 rounded-full border border-[#1a3d5c] hover:border-blue-400 text-gray-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <LinkedinIcon className="w-5 h-5" />
              </a>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
};

export { Hero1 };
