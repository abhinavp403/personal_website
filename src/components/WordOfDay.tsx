"use client";

import { useEffect, useState } from "react";
import { BookOpen, ExternalLink } from "lucide-react";
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
    <section className="py-12 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-6 h-6 text-blue-400" />
          <h3 className="text-white font-bold text-2xl">Word of the Day</h3>
        </div>

        {loading ? (
          <div className="h-40 bg-[#071e38] rounded-2xl animate-pulse" />
        ) : !word ? (
          <div className="bg-[#071e38] border border-[#0f2d4a] rounded-2xl p-6 text-gray-500 text-sm">
            Could not load today&apos;s word.
          </div>
        ) : (
          <motion.div
            className="bg-[#071e38] border border-[#0f2d4a] rounded-2xl p-6 hover:border-blue-500/30 transition-all"
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
                    className="text-3xl font-bold text-white hover:text-blue-400 transition-colors"
                  >
                    {word.word}
                  </a>
                  <span className="text-gray-400 text-base">{word.phonetics}</span>
                </div>

                {/* Part of speech badge */}
                <span className="inline-block text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-0.5 mb-4 capitalize">
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
                  <div className="border-l-2 border-blue-500/40 pl-4">
                    <p className="text-gray-400 text-sm italic">&ldquo;{word.example}&rdquo;</p>
                  </div>
                )}
              </div>

              {/* Right — link */}
              <a
                href={word.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-400 transition-colors self-start sm:mt-1 whitespace-nowrap"
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
