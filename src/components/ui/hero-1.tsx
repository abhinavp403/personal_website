"use client";

import * as React from "react";
import { Paperclip, Sparkles } from "lucide-react";

const Hero1 = () => {
  return (
    <div className="min-h-screen bg-[#0c0414] text-white flex flex-col relative overflow-x-hidden">
      {/* Gradient */}
      <div className="flex gap-[10rem] rotate-[-20deg] absolute top-[-40rem] right-[-30rem] z-[0] blur-[4rem] skew-[-40deg]  opacity-50">
        <div className="w-[10rem] h-[20rem]  bg-linear-90 from-white to-blue-300"></div>
        <div className="w-[10rem] h-[20rem]  bg-linear-90 from-white to-blue-300"></div>
        <div className="w-[10rem] h-[20rem]  bg-linear-90 from-white to-blue-300"></div>
      </div>
      <div className="flex gap-[10rem] rotate-[-20deg] absolute top-[-50rem] right-[-50rem] z-[0] blur-[4rem] skew-[-40deg]  opacity-50">
        <div className="w-[10rem] h-[20rem]  bg-linear-90 from-white to-blue-300"></div>
        <div className="w-[10rem] h-[20rem]  bg-linear-90 from-white to-blue-300"></div>
        <div className="w-[10rem] h-[20rem]  bg-linear-90 from-white to-blue-300"></div>
      </div>
      <div className="flex gap-[10rem] rotate-[-20deg] absolute top-[-60rem] right-[-60rem] z-[0] blur-[4rem] skew-[-40deg]  opacity-50">
        <div className="w-[10rem] h-[30rem]  bg-linear-90 from-white to-blue-300"></div>
        <div className="w-[10rem] h-[30rem]  bg-linear-90 from-white to-blue-300"></div>
        <div className="w-[10rem] h-[30rem]  bg-linear-90 from-white to-blue-300"></div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center py-20">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex-1 flex justify-center">
            <div className="bg-[#1c1528] rounded-full px-4 py-2 flex items-center gap-2  w-fit mx-4">
              <span className="text-xs flex items-center gap-2">
                <span className="bg-black p-1 rounded-full">👋</span>
                Welcome to my personal space
              </span>
            </div>
          </div>
          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Hi, I&apos;m <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Abhinav</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Developer · Builder · Explorer. I build AI projects, follow sports, watch films, and occasionally guess capitals wrong.
          </p>

          {/* CTA buttons */}
          <div className="flex gap-4 justify-center flex-wrap pt-4">
            <a href="#projects" className="bg-white text-black hover:bg-gray-200 rounded-full px-6 py-3 text-sm font-semibold transition-colors">
              View Projects
            </a>
            <a href="#connect" className="bg-[#1c1528] hover:bg-[#2a1f3d] border border-[#3a2f4d] rounded-full px-6 py-3 text-sm font-semibold transition-colors">
              Get in Touch
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

export { Hero1 };
