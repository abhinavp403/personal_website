import { Hero1 } from "@/components/ui/hero-1";
import { FallingPattern } from "@/components/ui/falling-pattern";
import AIProjects from "@/components/AIProjects";
import Interests from "@/components/Interests";
import LinkWebsites from "@/components/LinkWebsites";
import UpcomingGames from "@/components/UpcomingGames";
import ATPSchedule from "@/components/ATPSchedule";
import WordOfDay from "@/components/WordOfDay";
import SportQuestion from "@/components/SportQuestion";
import SiteNav from "@/components/SiteNav";
import MotionPrefs from "@/components/MotionPrefs";
import BackdropColorCycle from "@/components/BackdropColorCycle";

function Divider() {
  return (
    <div className="flex items-center gap-4 px-8 max-w-6xl mx-auto">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[color:var(--tone-4)]" />
      <div className="w-1 h-1 rounded-full bg-blue-500/40 flex-shrink-0" />
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[color:var(--tone-4)]" />
    </div>
  );
}

export default function Home() {
  return (
    <MotionPrefs>
    <main className="bg-[var(--page-bg)]">
      {/* Hero shader and falling pattern share one colour: blue → violet → pink → amber → emerald */}
      <BackdropColorCycle
        colors={["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"]}
        interval={20}
        fade={4}
      />
      <SiteNav />
      {/* Hero background runs full width; Hero1 itself pads its content clear of the nav rail */}
      <div id="about"><Hero1 /></div>

      {/* All sections below hero share a single FallingPattern background */}
      <div className="relative">
        {/* Pattern pinned behind all content */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <FallingPattern
            // Colour comes from BackdropColorCycle, shared with the hero shader
            color="var(--fp-color)"
            backgroundColor="var(--page-bg)"
            duration={120}
            blurIntensity="0.6em"
            density={1}
            className="h-full w-full"
          />
        </div>

        {/* Content sits above the pattern */}
        {/* lg:pl clears the fixed left nav rail */}
        <div className="relative z-10 lg:pl-36">
          <AIProjects />
          <Divider />
          <Interests />
          <Divider />
          <UpcomingGames />
          <Divider />
          <ATPSchedule />
          <Divider />
          <WordOfDay />
          <Divider />
          <SportQuestion />
          <Divider />
          <LinkWebsites />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[color:var(--tone-2)] py-8 px-4 text-center bg-[var(--page-bg)]">
        <p className="text-gray-600 text-sm">
          Built with Next.js · shadcn/ui · Tailwind CSS · Firebase
        </p>
        <p className="text-gray-700 text-xs mt-1" suppressHydrationWarning>
          © {new Date().getFullYear()} Abhinav P
        </p>
      </footer>
    </main>
    </MotionPrefs>
  );
}
