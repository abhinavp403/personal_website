"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "About Me",             href: "#about"     },
  { label: "Projects",             href: "#projects"  },
  { label: "Entertainment & Music", href: "#interests" },
  { label: "Upcoming Fixtures",    href: "#games"         },
  { label: "Tennis Schedule",       href: "#atp-schedule"  },
  { label: "Word of the Day",      href: "#word-of-the-day" },
  { label: "Sport Question",       href: "#sport-quiz"      },
  { label: "Let's Connect",        href: "#connect"       },
];

// How long the active label stays up after scrolling stops
const LABEL_LINGER_MS = 1200;

export default function SiteNav() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress]       = useState(0);
  const [scrolling, setScrolling]     = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
  const lingerRef                     = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Scroll progress + active section ─────────────────────────────────────
  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const scrolled  = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(maxScroll > 0 ? scrolled / maxScroll : 0);

      // Active = the last section whose top has crossed the middle of the screen.
      // Measured live because sections grow as their data loads.
      const mid = window.innerHeight / 2;
      let index = 0;
      NAV_LINKS.forEach(({ href }, i) => {
        const el = document.querySelector(href);
        if (el && el.getBoundingClientRect().top <= mid) index = i;
      });
      // The last section is too short to reach the middle, so the page bottom selects it
      if (maxScroll > 0 && scrolled >= maxScroll - 2) index = NAV_LINKS.length - 1;
      setActiveIndex(index);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
      setScrolling(true);
      if (lingerRef.current) clearTimeout(lingerRef.current);
      lingerRef.current = setTimeout(() => setScrolling(false), LABEL_LINGER_MS);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // Sections change height when their data arrives, which moves them without a scroll event
    const resized = new ResizeObserver(() => { if (!frame) frame = requestAnimationFrame(measure); });
    resized.observe(document.body);
    return () => {
      resized.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
      if (lingerRef.current) clearTimeout(lingerRef.current);
    };
  }, []);

  // ── Close the phone menu on Escape ───────────────────────────────────────
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMenuOpen(false);
    // Wait for the phone menu to unmount first — removing the tapped link mid-scroll cancels a smooth scroll
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    setTimeout(() => document.querySelector(href)?.scrollIntoView({ behavior }), 50);
  };

  return (
    <>
      {/* ── Scroll progress bar ─────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-[2px] pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 transition-none"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* ── Menu button + dropdown (small screens) ───────────────────────── */}
      <nav aria-label="Sections" className="lg:hidden fixed top-4 right-4 z-50 flex flex-col items-end">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="site-nav-menu"
          className="flex items-center gap-2 h-11 pl-4 pr-3 rounded-full bg-[#071e38]/85 backdrop-blur-md border border-[#1a3d5c] text-white text-sm font-semibold"
        >
          <span className="max-w-[55vw] truncate">{NAV_LINKS[activeIndex].label}</span>
          {menuOpen ? <X className="w-5 h-5 text-blue-400" /> : <Menu className="w-5 h-5 text-blue-400" />}
          <span className="sr-only">{menuOpen ? "Close section menu" : "Open section menu"}</span>
        </button>

        {menuOpen && (
          <>
            {/* Tap outside to close */}
            <div aria-hidden="true" className="fixed inset-0 -z-10" onClick={() => setMenuOpen(false)} />
            <div
              id="site-nav-menu"
              className="mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-2xl bg-[#071e38]/95 backdrop-blur-md border border-[#1a3d5c] p-2 flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
            >
              {NAV_LINKS.map(({ label, href }, i) => {
                const isActive = i === activeIndex;
                return (
                  <a
                    key={href}
                    href={href}
                    onClick={(e) => scrollTo(e, href)}
                    aria-current={isActive ? "true" : undefined}
                    className={`flex items-center gap-3 min-h-11 px-3 rounded-xl text-sm transition-colors ${
                      isActive ? "text-white font-bold bg-blue-500/20" : "text-gray-300 hover:text-white hover:bg-[#0f2d4a]"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isActive ? "bg-blue-400" : "bg-[#1a3d5c]"}`} />
                    {label}
                  </a>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* ── Dot rail (lg and up) ──────────────────────────────────────────── */}
      <nav aria-label="Sections" className="hidden lg:block fixed left-6 top-1/2 -translate-y-1/2 z-50">
        <div className="relative flex flex-col">
          {/* Track + filled portion up to the active dot (rows are 44px; dots centre at 22px) */}
          <div aria-hidden="true" className="absolute left-[11px] top-[22px] bottom-[22px] w-0.5 bg-[#0f2d4a]" />
          <div
            aria-hidden="true"
            className="absolute left-[11px] top-[22px] w-0.5 bg-blue-400 shadow-[0_0_8px_#60a5fa] transition-[height] duration-300"
            style={{ height: `${activeIndex * 44}px` }}
          />
          {NAV_LINKS.map(({ label, href }, i) => {
            const isActive = i === activeIndex;
            const passed   = i <= activeIndex;
            return (
              <a
                key={href}
                href={href}
                onClick={(e) => scrollTo(e, href)}
                aria-current={isActive ? "true" : undefined}
                aria-label={label}
                className="group relative flex items-center gap-2 h-11 outline-none"
              >
                <span className="w-6 flex justify-center">
                  <span
                    className={`rounded-full border-2 transition-all duration-300 ${
                      isActive
                        ? "w-4 h-4 bg-blue-400 border-blue-400 shadow-[0_0_12px_#60a5fa]"
                        : passed
                          ? "w-2.5 h-2.5 bg-blue-400 border-blue-400"
                          : "w-2.5 h-2.5 bg-[#020d1c] border-[#1a3d5c] group-hover:border-blue-400"
                    }`}
                  />
                </span>
                {/* Labels show on hover/focus; the active one also shows while scrolling, then steps aside so it never sits on content */}
                <span
                  className={`whitespace-pre-line leading-tight rounded-xl px-3 py-1 bg-[#071e38]/90 backdrop-blur-md border pointer-events-none transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 ${
                    isActive
                      ? `text-white text-sm font-bold border-blue-500/40 ${scrolling ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"}`
                      : "opacity-0 -translate-x-1 text-gray-300 text-[13px] font-medium border-[#0f2d4a]"
                  }`}
                >
                  {/* Break the long label onto two lines to keep the pill narrow */}
                  {label.replace(" & ", " &\n")}
                </span>
              </a>
            );
          })}
        </div>
      </nav>
    </>
  );
}
