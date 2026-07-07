---
name: website-design-system
description: The visual house style of this personal website, extracted from actual component code — color tokens, card/pill idioms, section anatomy, typography scale, Framer Motion patterns, imagery conventions, interaction states, and hard don'ts. Load BEFORE any visual or UI work — picking colors or spacing, adding or editing a card, building a new section, adding an animation, styling a badge/pill/button, or reviewing whether a change "looks native". When NOT to use — use website-new-section-campaign for the full end-to-end process of adding a new section (approval, data wiring, commit gates), and website-architecture-contract for structural rules (where files go, client/server boundaries, API route conventions). This skill is only the visual language.
---

# Website Design System

House style for Abhinav Prakash's personal site (Next.js 16, Tailwind CSS v4 CSS-first config, Framer Motion 12, lucide-react, some shadcn/ui). Every value below was extracted from real component code as of **2026-07-06** — sources are cited per item. OWNER HOUSE RULE: stay inside this design system; no new visual language without asking. The owner reviews all visual changes in the browser.

The theme is a **dark navy-blue monochrome with a blue accent**. Everything sits on near-black navy; cards are slightly lighter navy; blue-400/blue-500 is the single primary accent. Small doses of other hues are allowed ONLY in the specific places documented below (sport dots, language tags, surface/tier badges, Spotify green).

## 1. Color system

Note: components hardcode hex values in Tailwind arbitrary classes (`bg-[#071e38]`) rather than using the CSS variables. The `.dark` block in `src/app/globals.css` defines the same palette as variables (`--card: #071e38`, `--border: #0f2d4a`, `--background: #020d1c`) for shadcn components, but **the idiomatic pattern in section components is the literal hex class**. Match the surrounding file.

### Core surfaces

| Token | Value | Where used | Source |
|---|---|---|---|
| Page background | `#020d1c` | `<main className="bg-[#020d1c]">`, hero, footer, FallingPattern backgroundColor | `src/app/page.tsx`, `src/components/ui/hero-1.tsx` |
| Card surface | `#071e38` | Every card: `bg-[#071e38]`, loading skeletons, nav pill `bg-[#071e38]/50` | all section components |
| Border | `#0f2d4a` | `border border-[#0f2d4a]` on every card; also divider lines (`h-px bg-[#0f2d4a]`) and secondary button/chip background `bg-[#0f2d4a]` | all section components |
| Button hover surface | `#163d60` | `hover:bg-[#163d60]` on `bg-[#0f2d4a]` pill buttons (GitHub/download links) | `src/components/AIProjects.tsx` |
| Card hover border (subtle) | `#1a3d5c` | `hover:border-[#1a3d5c]` on tournament cards | `src/components/ATPSchedule.tsx` |
| Deep panel / media well | `#040f1e` | Video/GIF preview container behind project media | `src/components/AIProjects.tsx` |

### Accent + text

| Token | Value/class | Where used | Source |
|---|---|---|---|
| Primary accent | `text-blue-400` (#60a5fa) | Section header icons, active states, counters, links on hover | every section component |
| Accent fills | `bg-blue-500/10`..`/20`, `border-blue-500/20`..`/50` | Active pills, badges, hover borders | SiteNav, AIProjects, UpcomingGames, WordOfDay |
| Glow color | `rgba(59,130,246,…)` (blue-500) | Card glow shadows (see §2) | AIProjects, ATPSchedule |
| Heading text | `text-white` | All headings and primary content text | everywhere |
| Body text | `text-gray-400` | Descriptions, secondary info | AIProjects, WordOfDay, LinkWebsites |
| Muted text | `text-gray-500` | Captions, dates, venues, inactive pills, counts | everywhere |
| Faintest text | `text-gray-600` / `text-gray-700` | Footer, counter separator, dormant icons | page.tsx footer, AIProjects |
| Spotify green | `#1DB954` | Spotify icon, equalizer bars, hover ring — Spotify contexts ONLY | `src/components/Interests.tsx` |

### Per-sport accent dots (`src/components/UpcomingGames.tsx`, `SPORT_DOT` / `SPORT_TEXT`)

soccer `bg-green-400`, football `bg-indigo-400`, basketball `bg-orange-400`, cricket `bg-blue-400`, formula1 `bg-red-400`, tennis `bg-yellow-400` — with matching `text-*-400` for sport labels. Note the exception: the ATPSchedule header icon is `text-yellow-400` (tennis), not blue.

### Language tag colors (`src/components/AIProjects.tsx`, `getTagStyle`)

Pattern: `text-{hue}-300 bg-{hue}-500/10 border border-{hue}-500/20`.
JavaScript yellow, Python sky, Shell gray, HTML orange, CSS blue, SQL emerald; default `text-blue-300 bg-[#0f2d4a]`.

### Tennis badge palettes (`src/components/ATPSchedule.tsx`)

`TIER_STYLES`: tour-finals emerald (`/15` bg, `/30` border), grand-slam yellow (`/15`, `/30`), masters-1000 purple (`/10`, `/25`), atp-500 blue (`/10`, `/20`), atp-250 gray (`/10`, `/20`). `SURFACE_STYLES`: clay orange, grass green, hard sky, hard-indoor cyan (all `/10` bg, `/20` border). Tour badges: ATP `text-blue-300 bg-blue-500/15 border-blue-500/25`, WTA pink same opacities.

## 2. Surface & shape idioms

- **Cards**: `rounded-2xl` + `bg-[#071e38]` + `border border-[#0f2d4a]`. This trio is THE card. (hero-1, AIProjects, Interests, UpcomingGames, WordOfDay, LinkWebsites — 20 occurrences of `rounded-2xl` across section components.)
- **Pills**: `rounded-full` for ALL buttons, tags, filters, badges, nav links. There are no rectangular buttons anywhere. (SiteNav, AIProjects tags/links/name-strip, UpcomingGames filters/Badge, ATPSchedule filter group + badges.)
- **Icon squares**: `rounded-xl` for small icon containers — `w-12 h-12 bg-[#0f2d4a] rounded-xl flex items-center justify-center` (LinkWebsites), F1 emoji box `bg-red-500/10 border border-red-500/20 rounded-xl` (UpcomingGames). Posters also use `rounded-xl` (Interests).
- **Glow shadow** (featured elements only): inline `style={{ boxShadow: "0 0 60px rgba(59,130,246,0.12)" }}` on the project card (AIProjects), and the Tailwind form `shadow-[0_0_20px_rgba(59,130,246,0.15)]` on live tournaments (ATPSchedule). Always blue-500 rgba at ≤0.15 alpha.
- **Gradient scrim on image-backed cards** (ATPSchedule TournamentCard, exact formula):
  ```
  backgroundImage: `linear-gradient(rgba(2,13,28,0.78), rgba(7,30,56,0.82)), url(${backdrop})`,
  backgroundSize: "cover", backgroundPosition: "center"
  ```
  i.e. page-bg → card-bg tint over the photo. Album-art cards (Interests Spotify) use bottom-up scrims instead: `bg-gradient-to-t from-black/85 via-black/30 to-transparent`.
- **Team-color gradient wash** (UpcomingGames `cardStyle`): `linear-gradient(160deg, rgba(r,g,b,0.28) 0%, rgba(r,g,b,0.12) 100%), #071e38` (two-color variant: 0.45 → 0.30 → 0.15), with `borderColor` rgba at 0.35–0.45. Card base color always composited under the gradient.
- **Accent hairline**: `h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent` between media and content (AIProjects); the page `Divider` uses two `h-px` gradients fading into `#0f2d4a` around a `w-1 h-1 rounded-full bg-blue-500/40` dot (page.tsx).
- **Live pulse**: `w-2 h-2 rounded-full bg-blue-400 animate-pulse` inside a pill (UpcomingGames Badge; 1.5px variant in ATPSchedule LIVE tag).
- **Loading skeletons**: fixed-height `bg-[#071e38] rounded-2xl animate-pulse` blocks matching final layout (UpcomingGames, ATPSchedule, WordOfDay).

## 3. Section anatomy (verified against AIProjects, Interests, UpcomingGames, ATPSchedule, LinkWebsites, WordOfDay)

Standard skeleton — copy-paste this for a new section:

```tsx
<section id="my-section" className="py-20 px-4">
  <div className="max-w-6xl mx-auto">
    {/* Header row */}
    <div className="flex items-center gap-3 mb-10">
      <SomeLucideIcon className="w-6 h-6 text-blue-400" />
      <h3 className="text-white font-bold text-2xl">Section Title</h3>
    </div>
    {/* Content: cards on the bg-[#071e38] / border-[#0f2d4a] / rounded-2xl trio */}
  </div>
</section>
```

- **Outer**: `py-20 px-4` (WordOfDay is the one exception at `py-12`). `id` is required — SiteNav's IntersectionObserver targets it; add the section to `NAV_LINKS` in `src/components/SiteNav.tsx` if it should appear in nav.
- **Container width**: `max-w-6xl mx-auto` for grid/multi-column sections (Interests, UpcomingGames, ATPSchedule, WordOfDay, LinkWebsites). `max-w-2xl` ONLY for AIProjects, because it is a single centered carousel card — narrow keeps the 3024/1964 preview readable. Default to `max-w-6xl`.
- **Header**: lucide icon `w-6 h-6 text-blue-400` + `h3` `text-white font-bold text-2xl`, `gap-3`, margin below `mb-8`/`mb-10` (or `mb-1` + a `pl-9` subline, see UpcomingGames). Note all section headings are `<h3>` — follow that, don't "fix" the heading level.
- **Optional subline**: `text-gray-500 text-sm` under the title (UpcomingGames count, ATPSchedule month).
- **Wiring**: new sections mount in `src/app/page.tsx` inside the `relative z-10` content div, separated by `<Divider />`.

## 4. Typography scale in use

Fonts: Geist Sans / Geist Mono via `next/font` variables (`src/app/layout.tsx`); `font-mono` used for the 01/02 counter (AIProjects) and tournament date ranges (`text-[13px] font-mono`, ATPSchedule).

| Role | Classes | Source |
|---|---|---|
| Section heading | `text-white font-bold text-2xl` | all section headers |
| Hero/featured name | `text-white font-bold text-3xl` | WordOfDay word, FeaturedCard F1 name |
| Card title | `text-white font-semibold text-lg` (or `font-bold text-xl` for major items) | AIProjects, ATPSchedule |
| Body | `text-gray-400 text-sm leading-relaxed` | AIProjects description, WordOfDay explanation |
| Caption/meta | `text-gray-500 text-xs` (occasionally `text-[13px]`) | dates, venues, footers |
| Kicker label | `text-xs font-bold tracking-widest` in a sport/accent color, uppercase | UpcomingGames GameCard sport label |
| Micro label | `text-gray-500 text-[10px] font-bold uppercase tracking-widest` + `flex-1 h-px bg-[#0f2d4a]` rule beside it | Interests "TOP ARTISTS"/"TOP SONGS" |
| Pill text | `text-xs` (badges) or `text-sm font-semibold` (buttons/filters) | ATPSchedule, UpcomingGames |

## 5. Motion idioms (Framer Motion 12)

Rules of thumb from the code: entrances are **once-only** (`once: true`), durations **0.2–0.55s**, easing `easeOut` for entrances and `easeInOut` for crossfades, staggers of 0.06–0.1s. Entrances translate ≤30px.

- **FadeIn wrapper** (`src/components/FadeIn.tsx`): reusable `useInView(ref, { once: true, margin: "-80px" })` + `initial={{ opacity: 0, x, y }}` → animate to 0; direction map up/down/left/right/none (30–40px offsets); `transition={{ duration: 0.55, ease: "easeOut", delay }}`. Use it for simple one-off reveals.
- **Grid-card entrance** (UpcomingGames GameCard — the canonical pattern for cards in a grid):
  ```tsx
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-40px" }}
  transition={{ duration: 0.4, ease: "easeOut", delay: (i % 2) * 0.08 }}
  ```
  Stagger is modulo the column count: `(i % 2) * 0.08` for 2-col, `(i % 3) * 0.06` with `duration: 0.35`, `y: 16`, `margin: "-30px"` for the 3-col ATPSchedule grid. Modulo keeps delay bounded regardless of list length.
- **Counter swap** (AIProjects): `<AnimatePresence mode="wait">` around a keyed `motion.span`, `initial={{ opacity: 0, y: -10 }}` / `exit={{ opacity: 0, y: 10 }}`, `duration: 0.2`.
- **Grid-overlap crossfade for carousels** (AIProjects — IMPORTANT layout-stability trick): render ALL slides in one CSS grid with every child at `style={{ gridArea: "1 / 1" }}`, animate only `opacity` (`duration: 0.22, ease: "easeInOut"`), and add `pointer-events-none select-none` to inactive slides. The container height never collapses, so sections below never shift.
- **Drag navigation** (AIProjects): `drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.1}`, navigate on `info.offset.x` beyond ±80; pair with `cursor-grab active:cursor-grabbing`.
- **Train-in posters** (Interests): slide from `±100vw` with `ease: [0.22, 1, 0.36, 1]` (expo-out), `duration: 0.9`, 1s-per-item delays, gated by a 15-minute localStorage timestamp + IntersectionObserver. This is a bespoke set piece — do not copy for new sections; it is documented so you don't break it.
- **CSS-only motion**: `animate-pulse` for live dots and skeletons; `group-hover:scale-105 transition-transform duration-300` for images; typing effect in hero is plain setTimeout state.

## 6. Imagery conventions

- **TeamCircle fallback** (UpcomingGames): logo in a `rounded-full bg-[#0f2d4a]` circle with `object-contain p-1.5`; on `onError` switch state and render initials (`teamAbbrev`) on a deterministic hash-picked color from `PALETTE`. Any new remote-logo UI should reuse this fallback pattern.
- **Posters / album art**: `object-cover` in fixed-aspect containers — posters `aspect-[2/3] rounded-xl bg-[#0f2d4a]` (Interests), album art as CSS `backgroundImage` cover with bottom-up black scrim.
- **Project previews** (AIProjects): fixed `style={{ aspectRatio: "3024/1964" }}` container with `bg-[#040f1e]`, media `object-cover block pointer-events-none` (video: `autoPlay loop muted playsInline`). Fixed aspect keeps carousel height identical across slides.
- **Backdrop naming in `public/`** (verified via ls, 2026-07-06): `{surface}_{tier}.{ext}` — `clay_gs.jpg`, `clay_1000.jpg`, `clay_500.jpg`, `clay_250.jpg`, `grass_gs.jpg`, `grass_500.avif`, `grass_250.jpg`, `hard_gs.jpg`, `hard_1000.jpg`, `hard_500.jpg`, `hard_250.jpeg`, `indoor_hard_{1000,500,250}.jpg`. Mapped in `BACKDROP_MAP` (ATPSchedule) with explicit fallbacks for nonexistent combos. Project media at top level: `fifa-world-cup-26.mov`, `tennis-calendar.mp4`, etc.

## 7. Interaction states

- **Card hover**: `hover:border-blue-500/50 transition-all duration-300` (LinkWebsites), subtler `hover:border-blue-500/30` (WordOfDay) or `hover:border-[#1a3d5c]` (ATPSchedule). Borders shift, backgrounds mostly don't.
- **Active pill**: `bg-blue-500/20 text-blue-400 border border-blue-500/40` (AIProjects name strip; SiteNav uses `text-white` variant; WTA filter swaps blue→pink). **Inactive pill**: `text-gray-500` or `text-gray-400`, `border border-transparent` (keeps the border box so activation doesn't shift layout), `hover:text-white` or `hover:text-gray-300`.
- **Filter tab variant** (UpcomingGames): active `bg-[#0f2d4a] text-white border-blue-500/40`; inactive `bg-transparent text-gray-400 border-[#0f2d4a] hover:text-white`.
- **Secondary button**: `text-gray-400 hover:text-white bg-[#0f2d4a] hover:bg-[#163d60] rounded-full px-4 py-2 transition-colors` (AIProjects links).
- **Icon arrow button**: `w-10 h-10 rounded-full bg-[#071e38] border border-[#0f2d4a] text-white hover:border-blue-500/50 hover:text-blue-400 transition-all` (AIProjects).
- **Group hover choreography** (LinkWebsites): parent `group`, children do `group-hover:opacity-10` gradient, `group-hover:scale-110` icon, `group-hover:text-blue-400` arrow — all `duration-300`.
- Transitions: `transition-colors` for text/bg-only changes, `transition-all duration-200/300` when borders move too. Past/disabled items: `opacity-45` (ATPSchedule past tournaments).

## 8. Don'ts

- **No light theme.** Everything is authored against `#020d1c`; the `:root` light variables in globals.css are effectively unused by section components. Never add light-mode variants.
- **No new accent hues** outside the documented palettes (blue accent; sport dots; tag/tier/surface hues; Spotify green in Spotify context) without asking the owner first.
- **No layout-shifting animations.** Animate opacity/transform only; keep entrance offsets ≤30px; use the gridArea-overlap trick for anything that swaps content; keep skeleton heights matching final content; keep `border border-transparent` on inactive pills.
- **No unbounded card heights in grids** — use fixed aspect ratios, `min-h-[200px]` (ATPSchedule) or `line-clamp-*` (AIProjects `line-clamp-4`, Interests `line-clamp-2`) so rows stay even.
- **No repeat-on-scroll entrances** — always `once: true` (viewport or useInView). Re-firing animations was an explicit past complaint.
- **No rectangular buttons/tags** — pills are `rounded-full`, cards are `rounded-2xl`, icon boxes/posters `rounded-xl`. Nothing else.
- Don't replace hardcoded hexes with CSS variables (or vice versa) in passing — match the file you're editing.

## Provenance and maintenance

Extracted 2026-07-06 from Next.js 16.2.3 / Tailwind v4 / framer-motion 12 code. All classes/values quoted from: `src/app/globals.css`, `src/app/page.tsx`, `src/app/layout.tsx`, `src/components/{SiteNav,AIProjects,UpcomingGames,ATPSchedule,Interests,WordOfDay,LinkWebsites,FadeIn}.tsx`, `src/components/ui/hero-1.tsx`.

Re-verify before trusting volatile facts:

- Palette still in use: `grep -rl "071e38" src/` and `grep -rl "0f2d4a" src/` (expect ~10 files each incl. globals.css/page.tsx).
- Hover/deep-panel hexes: `grep -rn "163d60\|040f1e\|1a3d5c" src/components/`.
- Glow formula: `grep -rn "rgba(59,130,246" src/components/`.
- Section skeleton: `grep -n 'py-20 px-4' src/components/*.tsx` and `grep -n "max-w-6xl\|max-w-2xl" src/components/*.tsx`.
- Motion defaults: `grep -n "once: true" src/components/*.tsx`.
- Backdrop naming: `ls public/ | grep -E '^(clay|grass|hard|indoor)'`.
- Sport/tag palettes: read `SPORT_DOT` in UpcomingGames.tsx and `getTagStyle` in AIProjects.tsx.

If a grep count drops to zero or a cited component was rewritten, re-extract that section from code before relying on it.
