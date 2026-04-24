"use client";

import * as React from "react";
import { motion } from "framer-motion";

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
    <span className="text-purple-400 font-semibold">
      {displayed}
    </span>
  );
}

const Hero1 = () => {
  return (
    <div className="min-h-screen bg-[#0c0414] text-white flex flex-col relative overflow-x-hidden">
      {/* Background gradients */}
      <div className="flex gap-[10rem] rotate-[-20deg] absolute top-[-40rem] right-[-30rem] z-[0] blur-[4rem] skew-[-40deg] opacity-50">
        <div className="w-[10rem] h-[20rem] bg-linear-90 from-white to-blue-300"></div>
        <div className="w-[10rem] h-[20rem] bg-linear-90 from-white to-blue-300"></div>
        <div className="w-[10rem] h-[20rem] bg-linear-90 from-white to-blue-300"></div>
      </div>
      <div className="flex gap-[10rem] rotate-[-20deg] absolute top-[-50rem] right-[-50rem] z-[0] blur-[4rem] skew-[-40deg] opacity-50">
        <div className="w-[10rem] h-[20rem] bg-linear-90 from-white to-blue-300"></div>
        <div className="w-[10rem] h-[20rem] bg-linear-90 from-white to-blue-300"></div>
        <div className="w-[10rem] h-[20rem] bg-linear-90 from-white to-blue-300"></div>
      </div>
      <div className="flex gap-[10rem] rotate-[-20deg] absolute top-[-60rem] right-[-60rem] z-[0] blur-[4rem] skew-[-40deg] opacity-50">
        <div className="w-[10rem] h-[30rem] bg-linear-90 from-white to-blue-300"></div>
        <div className="w-[10rem] h-[30rem] bg-linear-90 from-white to-blue-300"></div>
        <div className="w-[10rem] h-[30rem] bg-linear-90 from-white to-blue-300"></div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 py-20 z-10">
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
              className="w-72 h-96 object-cover object-top rounded-2xl shadow-2xl ring-1 ring-[#2a1f3d]"
            />
          </motion.div>

          {/* Right — About Me box */}
          <motion.div
            className="flex-1 bg-[#1c1528] border border-[#2a1f3d] rounded-2xl p-8"
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
              <p>Feel free to explore my work and ideas.</p>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
};

export { Hero1 };
