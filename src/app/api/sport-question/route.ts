import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // the question flips at a calendar boundary — never serve a stale ISR copy

export interface SportQuestion {
  id: string;
  date: string;        // "November 16, 2026" — the day this question belongs to
  sport: string;       // "Ice hockey", "Football", … or "Sport" when the source doesn't say
  difficulty: "easy" | "medium" | "hard";
  text: string;
  choices: string[];   // shuffled once per day, so every visitor sees the same order
  answer: string;      // one of `choices`
  hint: string;
  explanation: string;
}

// Shape of one item from The Trivia API (only the fields used here)
interface TriviaItem {
  id: string;
  correctAnswer: string;
  incorrectAnswers: string[];
  question: { text: string };
  tags?: string[];
  type: string;
  difficulty: SportQuestion["difficulty"];
  isNiche?: boolean;
  hint?: string;
  explanation?: string;
}

// The Trivia API (CC BY-NC 4.0, no key) returns a fresh random batch on every call,
// so the first pick of the day is kept in memory and served until the date changes.
const SOURCE = "https://the-trivia-api.com/v2/questions?categories=sport&types=text_choice&limit=20";
const DAY_ZONE = "America/New_York"; // same flip time as Word of the Day
let memCache: { day: string; data: SportQuestion } | null = null;

function today(): { key: string; label: string } {
  const now = new Date();
  return {
    key:   now.toLocaleDateString("en-CA", { timeZone: DAY_ZONE }), // YYYY-MM-DD
    label: now.toLocaleDateString("en-US", { timeZone: DAY_ZONE, month: "long", day: "numeric", year: "numeric" }),
  };
}

const SPORT_NAMES: Record<string, string> = {
  "football-soccer":   "Football",
  "american-football": "American football",
  "formula-one":       "Formula 1",
};

// "sport:ice-hockey" → "Ice hockey". Generic tags such as "sport:sports" say nothing useful.
function sportLabel(tags: string[] = []): string {
  const slug = tags
    .filter((t) => t.startsWith("sport:"))
    .map((t) => t.slice("sport:".length))
    .find((s) => s !== "sports" && !s.startsWith("sports-"));
  if (!slug) return "Sport";
  if (SPORT_NAMES[slug]) return SPORT_NAMES[slug];
  const words = slug.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export async function GET() {
  const { key, label } = today();
  if (memCache?.day === key) return NextResponse.json({ question: memCache.data });

  try {
    const res = await fetch(SOURCE, { cache: "no-store" });
    if (!res.ok) throw new Error(`Trivia API responded ${res.status}`);
    const items: TriviaItem[] = await res.json();

    // The category is "sport and leisure": keep real sport questions with a clean four-way choice
    const pick = items.find(
      (q) =>
        q.type === "text_choice" &&
        !q.isNiche &&
        q.incorrectAnswers?.length === 3 &&
        (q.tags ?? []).some((t) => t.startsWith("sport:")),
    );
    if (!pick) throw new Error("No usable sport question in the batch");

    const data: SportQuestion = {
      id:          pick.id,
      date:        label,
      sport:       sportLabel(pick.tags),
      difficulty:  pick.difficulty,
      text:        pick.question.text,
      choices:     shuffle([pick.correctAnswer, ...pick.incorrectAnswers]),
      answer:      pick.correctAnswer,
      hint:        pick.hint ?? "",
      explanation: pick.explanation ?? "",
    };
    memCache = { day: key, data };
    return NextResponse.json({ question: data });
  } catch {
    // Upstream trouble: yesterday's question beats an empty section; otherwise the empty shape
    return NextResponse.json({ question: memCache?.data ?? null });
  }
}
