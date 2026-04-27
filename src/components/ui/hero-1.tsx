"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ShaderAnimation } from "@/components/ui/shader-lines";

const ROLES = ["Software Developer", "DJ", "Sports Enthusiast", "Philosopher"];

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

  return (
    <span className="text-blue-400 font-semibold">
      {displayed}
    </span>
  );
}

const Hero1 = () => {
  return (
    <div className="min-h-screen bg-[#020d1c] text-white flex flex-col relative overflow-x-hidden">
      {/* Shader background */}
      <ShaderAnimation />
      {/* Dark overlay so text/cards stay readable */}
      <div className="absolute inset-0 bg-[#020d1c]/70 z-[1]" />

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 py-20 z-[2]">
        <div className="max-w-6xl w-full mx-auto flex flex-col md:flex-row items-center gap-12">

          {/* Left — photo */}
          <motion.div
            className="flex-shrink-0"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <img
              src="/profile.jpg"
              alt="Abhinav Prakash"
              className="w-72 h-96 object-cover object-top rounded-2xl shadow-2xl ring-1 ring-[#0f2d4a]"
            />
          </motion.div>

          {/* Right — About Me box */}
          <motion.div
            className="flex-1 bg-[#071e38] border border-[#0f2d4a] rounded-2xl p-8"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          >
            <h2 className="text-2xl font-bold text-white mb-1">About Me</h2>
            <p className="text-gray-400 text-sm mb-6 h-5">
              <TypingText />
            </p>
            <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
              <p>
                Hi, I&apos;m <span className="text-white font-semibold">Abhinav Prakash</span> — a software developer specializing in Android application development. I&apos;m driven by a curiosity for building thoughtful, user-centric solutions, particularly those that address niche problems in meaningful ways. With the rapid evolution of AI, I&apos;m focused on creating tools and applications that blend innovation with practical impact. Many of these take shape as passion projects, where I experiment, learn, and push creative boundaries.
              </p>
              <p>
                Beyond development, I have a strong interest in sports, especially tennis and football, and I enjoy unwinding with the occasional film or series. I&apos;m also actively exploring the art of DJing, working to refine my skills in music curation and mixing. I have a natural curiosity for knowledge — from collecting random facts to following the dynamics of the stock market — and I&apos;m currently on a journey to learn every country and its capital.
              </p>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
};

export { Hero1 };
