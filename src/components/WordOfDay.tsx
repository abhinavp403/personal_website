"use client";

import { useEffect, useState } from "react";
import { Cormorant_Garamond } from "next/font/google";
import { BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import type { WordOfDay } from "@/app/api/wordofday/route";

// Classic dictionary serif for the entry itself
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

// Muted gold used for rules, sense number and part of speech
const GOLD = "#d9c08a";

// Scale the headword down for long words so it never overflows its column
function headwordSize(word: string): string {
  const n = word.length;
  if (n <= 7)  return "text-7xl sm:text-8xl md:text-7xl lg:text-[128px]";
  if (n <= 10) return "text-6xl sm:text-7xl md:text-6xl lg:text-[96px]";
  if (n <= 13) return "text-5xl sm:text-6xl md:text-5xl lg:text-7xl";
  return "text-4xl sm:text-5xl md:text-4xl lg:text-6xl";
}

function Rule() {
  return <div aria-hidden="true" className="h-px" style={{ background: GOLD, opacity: 0.55 }} />;
}

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
    <section id="word-of-the-day" className="py-12 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-400" />
            <h3 className="text-white font-bold text-2xl">Word of the Day</h3>
          </div>
          {word?.date && (
            <span className="text-gray-400 text-xs font-semibold tracking-[0.25em] uppercase">{word.date}</span>
          )}
        </div>

        {loading ? (
          <div className="h-64 bg-[#071e38] rounded-2xl animate-pulse" />
        ) : !word ? (
          <p className="text-gray-500 text-sm">Could not load today&apos;s word.</p>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Rule />

            <div className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8 md:gap-14 py-8 md:py-10">

              {/* Headword */}
              <div className="min-w-0">
                <a
                  href={word.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${cormorant.className} ${headwordSize(word.word)} block font-semibold leading-[0.95] tracking-tight text-white hover:text-[#f0deb0] transition-colors break-words`}
                >
                  {word.word}
                </a>
                {word.phonetics && (
                  <p className={`${cormorant.className} italic text-2xl text-gray-300 mt-4`}>{word.phonetics}</p>
                )}
                {word.partOfSpeech && (
                  <p className={`${cormorant.className} italic font-medium text-2xl mt-1 lowercase`} style={{ color: GOLD }}>
                    {word.partOfSpeech}
                  </p>
                )}
              </div>

              {/* Sense */}
              <div className="min-w-0 flex flex-col gap-4 md:pt-3">
                <div className="grid grid-cols-[2rem_minmax(0,1fr)]">
                  <span className={`${cormorant.className} font-medium text-2xl sm:text-3xl leading-snug`} style={{ color: GOLD }}>1.</span>
                  <p className={`${cormorant.className} font-medium text-2xl sm:text-3xl leading-snug text-white`}>
                    {word.definition}
                  </p>
                </div>

                {word.explanation && (
                  <p className="ml-8 text-gray-400 text-[15px] leading-relaxed">{word.explanation}</p>
                )}

                {word.example && (
                  <p className={`${cormorant.className} ml-8 italic text-xl sm:text-[22px] leading-normal text-white`}>
                    &mdash; &ldquo;{word.example}&rdquo;
                  </p>
                )}

                <a
                  href={word.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-8 self-start py-3 text-xs font-semibold tracking-[0.25em] underline underline-offset-[6px] transition-colors hover:text-[#f0deb0]"
                  style={{ color: GOLD }}
                >
                  FULL DEFINITION
                </a>
              </div>
            </div>

            <Rule />
          </motion.div>
        )}
      </div>
    </section>
  );
}
