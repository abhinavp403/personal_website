import { Hero1 } from "@/components/ui/hero-1";
import { FallingPattern } from "@/components/ui/falling-pattern";
import AIProjects from "@/components/AIProjects";
import Interests from "@/components/Interests";
import LinkWebsites from "@/components/LinkWebsites";
import UpcomingGames from "@/components/UpcomingGames";
import WordOfDay from "@/components/WordOfDay";
import SiteNav from "@/components/SiteNav";

function Divider() {
  return (
    <div className="flex items-center gap-4 px-8 max-w-6xl mx-auto">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#0f2d4a]" />
      <div className="w-1 h-1 rounded-full bg-blue-500/40 flex-shrink-0" />
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#0f2d4a]" />
    </div>
  );
}

export default function Home() {
  return (
    <main className="bg-[#020d1c]">
      <SiteNav />
      <Hero1 />

      {/* All sections below hero share a single FallingPattern background */}
      <div className="relative">
        {/* Pattern pinned behind all content */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <FallingPattern
            color="#3b82f6"
            backgroundColor="#020d1c"
            duration={120}
            blurIntensity="0.6em"
            density={1}
            className="h-full w-full"
          />
        </div>

        {/* Content sits above the pattern */}
        <div className="relative z-10">
          <AIProjects />
          <Divider />
          <Interests />
          <Divider />
          <UpcomingGames />
          <Divider />
          <WordOfDay />
          <Divider />
          <LinkWebsites />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#071e38] py-8 px-4 text-center bg-[#020d1c]">
        <p className="text-gray-600 text-sm">
          Built with Next.js · shadcn/ui · Tailwind CSS · Firebase
        </p>
        <p className="text-gray-700 text-xs mt-1" suppressHydrationWarning>
          © {new Date().getFullYear()} Abhinav P
        </p>
      </footer>
    </main>
  );
}
