"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import type { WordOfDay } from "@/app/api/wordofday/route";

export default function WordOfDay() {
  const [word, setWord]       = useState<WordOfDay | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/wordofday")
      .then((r) => r.json())
      .then((d) => setWord(d.word ? d : null))
      .catch(() => setWord(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-12 px-4 bg-[#0c0414]">
      <div className="max-w-6xl mx-auto">


        {loading ? (
          <div className="h-40 bg-[#1c1528] rounded-2xl animate-pulse" />
        ) : !word ? (
          <div className="bg-[#1c1528] border border-[#2a1f3d] rounded-2xl p-6 text-gray-500 text-sm">
            Could not load today&apos;s word.
          </div>
        ) : (
          <motion.div
            className="bg-[#1c1528] border border-[#2a1f3d] rounded-2xl p-6 hover:border-purple-500/30 transition-all"
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

              {/* Left — word info */}
              <div className="flex-1">
                {/* Date */}
                <p className="text-gray-500 text-xs mb-2">{word.date}</p>

                {/* Word + phonetics */}
                <div className="flex flex-wrap items-baseline gap-3 mb-1">
                  <a
                    href={word.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-3xl font-bold text-white hover:text-purple-400 transition-colors"
                  >
                    {word.word}
                  </a>
                  <span className="text-gray-400 text-base">{word.phonetics}</span>
                </div>

                {/* Part of speech badge */}
                <span className="inline-block text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-0.5 mb-4 capitalize">
                  {word.partOfSpeech}
                </span>

                {/* Definition */}
                <p className="text-white text-base font-medium mb-3">{word.definition}</p>

                {/* Explanation */}
                {word.explanation && (
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">{word.explanation}</p>
                )}

                {/* Example */}
                {word.example && (
                  <div className="border-l-2 border-purple-500/40 pl-4">
                    <p className="text-gray-400 text-sm italic">&ldquo;{word.example}&rdquo;</p>
                  </div>
                )}
              </div>

              {/* Right — link */}
              <a
                href={word.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-purple-400 transition-colors self-start sm:mt-1 whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Full definition
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
