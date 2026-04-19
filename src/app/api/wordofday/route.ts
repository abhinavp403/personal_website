import { NextResponse } from "next/server";

export const revalidate = 21600; // re-fetch every 6 hours

export interface WordOfDay {
  word: string;
  phonetics: string;
  partOfSpeech: string;
  definition: string;
  example: string;
  explanation: string;
  date: string;
  url: string;
}

function extract(html: string, classname: string, closingTag = "div"): string {
  const re = new RegExp(`class=["']${classname}["'][^>]*>([\\s\\S]*?)<\\/${closingTag}>`, "s");
  const m  = html.match(re);
  if (!m) return "";
  return m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export async function GET() {
  try {
    const res = await fetch("https://www.dictionary.com/word-of-the-day", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; personal-website-bot/1.0)" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    // Grab only the first wotd-entry-wrapper block (today's word)
    const blockMatch = html.match(/<div class="wotd-entry-wrapper">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/);
    const block = blockMatch ? blockMatch[0] : html;

    // Extract href for the word URL
    const hrefMatch = block.match(/href="(\/browse\/[^"]+)"/);
    const wordUrl   = hrefMatch ? `https://www.dictionary.com${hrefMatch[1]}` : "https://www.dictionary.com/word-of-the-day";

    const word         = extract(block, "wotd-entry-headword", "a");
    const date         = extract(block, "wotd-entry-date", "div");
    const phonetics    = extract(block, "wotd-entry-phonetics", "p");
    const partOfSpeech = extract(block, "wotd-entry-pos", "div");
    const definition   = extract(block, "wotd-entry-definition", "p");
    const example      = extract(block, "wotd-entry-example", "p");

    // Explanation is inside a <p> inside wotd-entry-explanation-section
    const explMatch = block.match(/class="wotd-entry-explanation-section"[^>]*>[\s\S]*?<p>([\s\S]*?)<\/p>/);
    const explanation = explMatch
      ? explMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
      : "";

    if (!word) throw new Error("Could not parse word");

    return NextResponse.json({
      word, phonetics, partOfSpeech, definition, example, explanation, date, url: wordUrl,
    } satisfies WordOfDay);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
