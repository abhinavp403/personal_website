"use client";

import { useEffect, useRef, useState } from "react";

const NAV_LINKS = [
  { label: "About Me",             href: "#about"     },
  { label: "Projects",             href: "#projects"  },
  { label: "Entertainment & Music", href: "#interests" },
  { label: "Upcoming Fixtures",    href: "#games"         },
  { label: "Tennis Schedule",       href: "#atp-schedule"  },
  { label: "Word of the Day",      href: "#word-of-the-day" },
  { label: "Let's Connect",        href: "#connect"       },
];

export default function SiteNav() {
  const [active, setActive]       = useState<string>("");
  const [progress, setProgress]   = useState(0);
  const observerRef               = useRef<IntersectionObserver | null>(null);

  // ── Scroll progress ──────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const scrolled  = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(maxScroll > 0 ? scrolled / maxScroll : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Active section via IntersectionObserver ───────────────────────────────
  useEffect(() => {
    // Track which sections are currently intersecting and pick the topmost one
    const visible = new Map<string, number>(); // id → top y position

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry.boundingClientRect.top);
          } else {
            visible.delete(entry.target.id);
          }
        });

        if (visible.size === 0) return;
        // Pick the section whose top is closest to (but still below) the top of viewport
        const topmost = [...visible.entries()].sort((a, b) => a[1] - b[1])[0][0];
        setActive(`#${topmost}`);
      },
      { threshold: 0.15 },
    );

    NAV_LINKS.forEach(({ href }) => {
      const el = document.querySelector(href);
      if (el) observerRef.current!.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  const activeIndex = NAV_LINKS.findIndex(({ href }) => href === active);

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
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

      {/* ── Top bar (small screens) ──────────────────────────────────────── */}
      <nav aria-label="Sections" className="lg:hidden fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <div className="flex items-center gap-1 bg-[#071e38]/50 backdrop-blur-md border border-[#0f2d4a] rounded-full px-3 py-2 pointer-events-auto">
          {NAV_LINKS.map(({ label, href }) => {
            const isActive = active === href;
            return (
              <a
                key={href}
                href={href}
                onClick={(e) => scrollTo(e, href)}
                aria-current={isActive ? "true" : undefined}
                className={`text-sm px-4 py-1.5 rounded-full transition-all duration-300 ${
                  isActive
                    ? "text-white bg-blue-500/20 border border-blue-500/40"
                    : "text-gray-400 hover:text-white hover:bg-[#0f2d4a] border border-transparent"
                }`}
              >
                {label}
              </a>
            );
          })}
        </div>
      </nav>

      {/* ── Dot rail (lg and up) ──────────────────────────────────────────── */}
      <nav aria-label="Sections" className="hidden lg:block fixed left-6 top-1/2 -translate-y-1/2 z-50">
        <div className="relative flex flex-col">
          {/* Track + filled portion up to the active dot (rows are 44px; dots centre at 22px) */}
          <div aria-hidden="true" className="absolute left-[11px] top-[22px] bottom-[22px] w-0.5 bg-[#0f2d4a]" />
          <div
            aria-hidden="true"
            className="absolute left-[11px] top-[22px] w-0.5 bg-blue-400 shadow-[0_0_8px_#60a5fa] transition-[height] duration-300"
            style={{ height: `${Math.max(activeIndex, 0) * 44}px` }}
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
                {/* Active label always shows; others appear on hover/focus — the gutter is too narrow for all six */}
                <span
                  className={`whitespace-pre-line leading-tight rounded-xl px-3 py-1 bg-[#071e38]/90 backdrop-blur-md border pointer-events-none transition-all duration-200 ${
                    isActive
                      ? "opacity-100 translate-x-0 text-white text-sm font-bold border-blue-500/40"
                      : "opacity-0 -translate-x-1 text-gray-300 text-[13px] font-medium border-[#0f2d4a] group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0"
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
