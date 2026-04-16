"use client";

import { useState, useCallback, useEffect } from "react";
import { Globe, CheckCircle2, XCircle, Trophy, RotateCcw } from "lucide-react";

interface Question {
  type: "capital" | "country";
  prompt: string;
  answer: string;
  options: string[];
  flag?: string;
}

const GEO_DATA: Array<{ country: string; capital: string; flag: string }> = [
  { country: "France", capital: "Paris", flag: "🇫🇷" },
  { country: "Japan", capital: "Tokyo", flag: "🇯🇵" },
  { country: "Brazil", capital: "Brasília", flag: "🇧🇷" },
  { country: "Australia", capital: "Canberra", flag: "🇦🇺" },
  { country: "India", capital: "New Delhi", flag: "🇮🇳" },
  { country: "Canada", capital: "Ottawa", flag: "🇨🇦" },
  { country: "Germany", capital: "Berlin", flag: "🇩🇪" },
  { country: "Egypt", capital: "Cairo", flag: "🇪🇬" },
  { country: "Argentina", capital: "Buenos Aires", flag: "🇦🇷" },
  { country: "South Africa", capital: "Pretoria", flag: "🇿🇦" },
  { country: "Mexico", capital: "Mexico City", flag: "🇲🇽" },
  { country: "Nigeria", capital: "Abuja", flag: "🇳🇬" },
  { country: "Spain", capital: "Madrid", flag: "🇪🇸" },
  { country: "Italy", capital: "Rome", flag: "🇮🇹" },
  { country: "China", capital: "Beijing", flag: "🇨🇳" },
  { country: "Russia", capital: "Moscow", flag: "🇷🇺" },
  { country: "USA", capital: "Washington D.C.", flag: "🇺🇸" },
  { country: "UK", capital: "London", flag: "🇬🇧" },
  { country: "Indonesia", capital: "Jakarta", flag: "🇮🇩" },
  { country: "Pakistan", capital: "Islamabad", flag: "🇵🇰" },
  { country: "Bangladesh", capital: "Dhaka", flag: "🇧🇩" },
  { country: "Kenya", capital: "Nairobi", flag: "🇰🇪" },
  { country: "Thailand", capital: "Bangkok", flag: "🇹🇭" },
  { country: "Vietnam", capital: "Hanoi", flag: "🇻🇳" },
  { country: "Turkey", capital: "Ankara", flag: "🇹🇷" },
  { country: "Saudi Arabia", capital: "Riyadh", flag: "🇸🇦" },
  { country: "Ukraine", capital: "Kyiv", flag: "🇺🇦" },
  { country: "Sweden", capital: "Stockholm", flag: "🇸🇪" },
  { country: "Norway", capital: "Oslo", flag: "🇳🇴" },
  { country: "Portugal", capital: "Lisbon", flag: "🇵🇹" },
];

const TOTAL_QUESTIONS = 10;

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function generateQuestions(): Question[] {
  const shuffled = shuffle(GEO_DATA).slice(0, TOTAL_QUESTIONS);
  return shuffled.map((item) => {
    const isCapitalQ = Math.random() > 0.5;
    const wrongPool = GEO_DATA.filter((d) => d.country !== item.country);
    const wrongs = shuffle(wrongPool).slice(0, 3);

    if (isCapitalQ) {
      const options = shuffle([item.capital, ...wrongs.map((w) => w.capital)]);
      return {
        type: "capital",
        prompt: `What is the capital of ${item.country}?`,
        answer: item.capital,
        options,
        flag: item.flag,
      };
    } else {
      const options = shuffle([item.country, ...wrongs.map((w) => w.country)]);
      return {
        type: "country",
        prompt: `${item.capital} is the capital of which country?`,
        answer: item.country,
        options,
        flag: item.flag,
      };
    }
  });
}

export default function GeoGame() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  // Generate questions client-side only to avoid hydration mismatch with Math.random()
  useEffect(() => {
    setQuestions(generateQuestions());
  }, []);

  const q = questions[current];

  const handleAnswer = (option: string) => {
    if (!q || selected) return;
    setSelected(option);
    if (option === q.answer) setScore((s) => s + 1);
    setTimeout(() => {
      if (current + 1 >= TOTAL_QUESTIONS) {
        setFinished(true);
      } else {
        setCurrent((c) => c + 1);
        setSelected(null);
      }
    }, 1000);
  };

  const restart = useCallback(() => {
    setQuestions(generateQuestions());
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setFinished(false);
  }, []);

  const grade = () => {
    if (score >= 9) return { label: "Geography Master!", color: "text-yellow-400" };
    if (score >= 7) return { label: "Well Traveled!", color: "text-green-400" };
    if (score >= 5) return { label: "Getting There!", color: "text-blue-400" };
    return { label: "Keep Exploring!", color: "text-purple-400" };
  };

  return (
    <section className="py-20 px-4 bg-[#0a0312]">
      <div className="max-w-2xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[#1c1528] rounded-full px-4 py-2 text-xs text-gray-400 mb-4">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            Mini Game
          </div>
          <h2 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
            <Globe className="w-8 h-8 text-teal-400" />
            Guess the Capital
          </h2>
          <p className="text-gray-400 mt-3">Test your geography knowledge — {TOTAL_QUESTIONS} questions.</p>
        </div>

        <div className="bg-[#1c1528] border border-[#2a1f3d] rounded-2xl overflow-hidden">
          {!q && !finished ? (
            <div className="p-6 space-y-4">
              <div className="h-4 bg-[#2a1f3d] rounded-full animate-pulse w-1/3 mx-auto" />
              <div className="h-32 bg-[#2a1f3d] rounded-xl animate-pulse" />
              <div className="grid grid-cols-2 gap-3">
                {[1,2,3,4].map(i => <div key={i} className="h-12 bg-[#2a1f3d] rounded-xl animate-pulse" />)}
              </div>
            </div>
          ) : !finished ? (
            <div className="p-6 space-y-6">
              {/* Progress */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{current + 1} / {TOTAL_QUESTIONS}</span>
                <span className="text-purple-400 font-semibold">Score: {score}</span>
              </div>
              <div className="w-full h-1.5 bg-[#2a1f3d] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all duration-300"
                  style={{ width: `${((current + 1) / TOTAL_QUESTIONS) * 100}%` }}
                />
              </div>

              {/* Question */}
              <div className="text-center py-4">
                {q.flag && <div className="text-6xl mb-4">{q.flag}</div>}
                <p className="text-white text-xl font-semibold">{q.prompt}</p>
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-3">
                {q.options.map((option) => {
                  let style =
                    "bg-[#2a1f3d] border-[#3a2f4d] text-white hover:border-purple-500/50 hover:bg-[#3a2f4d]";
                  if (selected) {
                    if (option === q.answer) {
                      style = "bg-green-500/10 border-green-500 text-green-400";
                    } else if (option === selected && selected !== q.answer) {
                      style = "bg-red-500/10 border-red-500 text-red-400";
                    } else {
                      style = "bg-[#2a1f3d] border-[#3a2f4d] text-gray-500 opacity-50";
                    }
                  }
                  return (
                    <button
                      key={option}
                      onClick={() => handleAnswer(option)}
                      disabled={!!selected}
                      className={`border rounded-xl p-3.5 text-sm font-medium transition-all duration-200 text-left flex items-center justify-between ${style}`}
                    >
                      {option}
                      {selected && option === q.answer && (
                        <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                      )}
                      {selected && option === selected && selected !== q.answer && (
                        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-10 text-center space-y-6">
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto" />
              <div>
                <p className={`text-2xl font-bold ${grade().color}`}>{grade().label}</p>
                <p className="text-white text-5xl font-bold mt-2">{score}<span className="text-gray-500 text-2xl">/{TOTAL_QUESTIONS}</span></p>
              </div>
              <div className="flex justify-center gap-3 flex-wrap">
                {questions.map((_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      i < score ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {i < score ? "✓" : "✗"}
                  </div>
                ))}
              </div>
              <button
                onClick={restart}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6 py-3 font-semibold transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Play Again
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
