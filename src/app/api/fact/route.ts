import { NextResponse } from "next/server";

export const revalidate = 604800; // revalidate once per week

export async function GET() {
  try {
    const res = await fetch("https://uselessfacts.jsph.pl/api/v2/facts/random?language=en", {
      next: { revalidate: 604800 },
    });
    const data = await res.json();
    return NextResponse.json({ fact: data.text || "Did you know? Honey never spoils." });
  } catch {
    return NextResponse.json({
      fact: "A day on Venus is longer than a year on Venus — it takes 243 Earth days to rotate once, but only 225 days to orbit the Sun.",
    });
  }
}
