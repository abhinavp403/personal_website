import localFont from "next/font/local";

// Self-hosted copies of the site's Google Fonts (Latin subset, from Fontsource,
// all SIL Open Font License — see the *-OFL.txt files here). Loading them from
// the repo means builds never depend on downloading from Google Fonts, which
// failed intermittently on Vercel's build machines.

// Body text (variable weight)
export const inter = localFont({
  src: "./inter-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-inter",
});

// Labels and mono details (variable weight)
export const jetbrainsMono = localFont({
  src: "./jetbrains-mono-latin-wght-normal.woff2",
  weight: "100 800",
  variable: "--font-jetbrains-mono",
});

// Player card in the hero: condensed display face, bold and extra-bold, upright and italic
export const barlowCard = localFont({
  src: [
    { path: "./barlow-condensed-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "./barlow-condensed-latin-700-italic.woff2", weight: "700", style: "italic" },
    { path: "./barlow-condensed-latin-800-normal.woff2", weight: "800", style: "normal" },
    { path: "./barlow-condensed-latin-800-italic.woff2", weight: "800", style: "italic" },
  ],
});

// Section titles: the same face, extra-bold upright only
export const barlowHeading = localFont({
  src: "./barlow-condensed-latin-800-normal.woff2",
  weight: "800",
  style: "normal",
});

// Word of the Day dictionary serif
export const cormorant = localFont({
  src: [
    { path: "./cormorant-garamond-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./cormorant-garamond-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./cormorant-garamond-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./cormorant-garamond-latin-500-italic.woff2", weight: "500", style: "italic" },
    { path: "./cormorant-garamond-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./cormorant-garamond-latin-600-italic.woff2", weight: "600", style: "italic" },
  ],
});

// Upcoming Fixtures LED scoreboard
export const doto = localFont({
  src: [
    { path: "./doto-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "./doto-latin-900-normal.woff2", weight: "900", style: "normal" },
  ],
});
