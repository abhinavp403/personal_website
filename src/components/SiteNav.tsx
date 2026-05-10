"use client";

import { useEffect, useRef, useState } from "react";

const NAV_LINKS = [
  { label: "Projects",             href: "#projects"  },
  { label: "Entertainment & Music", href: "#interests" },
  { label: "Upcoming Matches",     href: "#games"         },
  { label: "Tennis Schedule",       href: "#atp-schedule"  },
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

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <div className="flex items-center gap-1 bg-[#071e38]/50 backdrop-blur-md border border-[#0f2d4a] rounded-full px-3 py-2 pointer-events-auto">
          {NAV_LINKS.map(({ label, href }) => {
            const isActive = active === href;
            return (
              <a
                key={href}
                href={href}
                onClick={(e) => scrollTo(e, href)}
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
    </>
  );
}
