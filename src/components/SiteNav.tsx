"use client";

const NAV_LINKS = [
  { label: "Projects",             href: "#projects"  },
  { label: "Entertainment & Music", href: "#interests" },
  { label: "Upcoming Matches",     href: "#games"     },
  { label: "Let's Connect",        href: "#connect"   },
];

export default function SiteNav() {
  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="flex items-center gap-1 bg-[#071e38]/50 backdrop-blur-md border border-[#0f2d4a] rounded-full px-3 py-2 pointer-events-auto">
        {NAV_LINKS.map(({ label, href }) => (
          <a
            key={href}
            href={href}
            onClick={(e) => scrollTo(e, href)}
            className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-1.5 rounded-full hover:bg-[#0f2d4a]"
          >
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}
