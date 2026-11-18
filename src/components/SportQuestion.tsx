"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Lightbulb, X } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import type { SportQuestion as Question } from "@/app/api/sport-question/route";

const LETTERS = ["A", "B", "C", "D"];

const DIFFICULTY_COLOR: Record<Question["difficulty"], string> = {
  easy:   "text-green-400",
  medium: "text-yellow-400",
  hard:   "text-red-400",
};

// The visitor's answer is remembered per question, so a reload doesn't reset it
const STORAGE_KEY = "sport-question-answer";

function readSavedAnswer(id: string): string | null {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    return saved?.id === id && typeof saved.picked === "string" ? saved.picked : null;
  } catch {
    return null;
  }
}

function saveAnswer(id: string, picked: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, picked }));
  } catch {
    // Private mode or blocked storage: the answer just won't survive a reload
  }
}

export default function SportQuestion() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading]   = useState(true);
  const [picked, setPicked]     = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    fetch("/api/sport-question")
      .then((r) => r.json())
      .catch(() => ({ question: null }))
      .then((d: { question: Question | null }) => {
        setQuestion(d.question ?? null);
        if (d.question) setPicked(readSavedAnswer(d.question.id));
      })
      .finally(() => setLoading(false));
  }, []);

  const answered = picked !== null;
  const correct  = answered && picked === question?.answer;

  const choose = (choice: string) => {
    if (!question || answered) return;
    setPicked(choice);
    saveAnswer(question.id, choice);
  };

  return (
    <section id="sport-quiz" className="py-12 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <SectionHeading eyebrow="Half-time quiz" title="Sport Question of the Day" />
          {question?.date && (
            <span className="text-gray-400 text-xs font-semibold tracking-[0.25em] uppercase">{question.date}</span>
          )}
        </div>

        {loading ? (
          <div className="h-72 bg-[color:var(--tone-2,#071e38)] rounded-2xl animate-pulse" />
        ) : !question ? (
          <p className="text-gray-400 text-sm">Could not load today&apos;s question.</p>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="rounded-2xl border-2 border-[color:var(--tone-6,#1a3d5c)] bg-[color:var(--tone-2,#071e38)]/70 p-5 sm:p-8 md:p-10 grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8 md:gap-14"
          >

            {/* Question */}
            <div className="min-w-0 flex flex-col gap-5">
              <p className="font-mono text-xs font-bold tracking-[0.2em] uppercase text-gray-300">
                {/* The sport can be the answer itself ("Which sport is … associated with?"), so it stays hidden until answered */}
                {answered && (
                  <>
                    {question.sport}
                    <span className="text-gray-500"> · </span>
                  </>
                )}
                <span className={DIFFICULTY_COLOR[question.difficulty]}>{question.difficulty}</span>
              </p>
              <p className="text-white text-2xl sm:text-3xl font-bold leading-snug">{question.text}</p>

              {question.hint && !answered && (
                showHint ? (
                  <p className="flex gap-2 text-gray-300 text-[15px] leading-relaxed">
                    <Lightbulb className="w-4 h-4 mt-1 flex-shrink-0 text-yellow-400" />
                    {question.hint}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowHint(true)}
                    className="self-start flex items-center gap-2 min-h-11 font-mono text-xs font-bold tracking-[0.2em] uppercase text-yellow-400 hover:text-yellow-300 transition-colors"
                  >
                    <Lightbulb className="w-4 h-4" />
                    Need a hint?
                  </button>
                )
              )}
            </div>

            {/* Answers */}
            <div className="min-w-0 flex flex-col gap-3">
              {question.choices.map((choice, i) => {
                const isAnswer = choice === question.answer;
                const isPicked = choice === picked;
                const state = !answered
                  ? "border-[color:var(--tone-6,#1a3d5c)] text-white hover:border-blue-400 hover:bg-blue-500/10 cursor-pointer"
                  : isAnswer
                    ? "border-green-400 bg-green-400/15 text-white"
                    : isPicked
                      ? "border-red-400 bg-red-400/15 text-white"
                      : "border-[color:var(--tone-4,#0f2d4a)] text-gray-500";
                return (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => choose(choice)}
                    disabled={answered}
                    className={`flex items-center gap-4 min-h-[52px] px-4 py-2 rounded-xl border-2 text-left text-base font-semibold transition-colors ${state}`}
                  >
                    <span className="font-mono text-sm font-bold text-blue-400 w-4 flex-shrink-0">{LETTERS[i]}</span>
                    <span className="flex-1 min-w-0">{choice}</span>
                    {answered && isAnswer && <Check className="w-5 h-5 flex-shrink-0 text-green-400" aria-label="Correct answer" />}
                    {answered && isPicked && !isAnswer && <X className="w-5 h-5 flex-shrink-0 text-red-400" aria-label="Your answer" />}
                  </button>
                );
              })}

              {/* Result */}
              <div aria-live="polite" className="min-h-6">
                {answered && (
                  <div className="pt-2">
                    <p className={`font-mono text-xs font-bold tracking-[0.2em] uppercase ${correct ? "text-green-400" : "text-red-400"}`}>
                      {correct ? "Correct" : `Not quite — it's ${question.answer}`}
                    </p>
                    {question.explanation && (
                      <p className="text-gray-300 text-[15px] leading-relaxed mt-2">{question.explanation}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* The licence (CC BY-NC 4.0) asks for attribution */}
        <p className="text-gray-400 text-xs mt-4">
          Question from{" "}
          <a
            href="https://the-trivia-api.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-white transition-colors"
          >
            The Trivia API
          </a>
          , CC BY-NC 4.0. A new one every day.
        </p>
      </div>
    </section>
  );
}
