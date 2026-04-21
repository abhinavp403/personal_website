import { Hero1 } from "@/components/ui/hero-1";
import AIProjects from "@/components/AIProjects";
import Interests from "@/components/Interests";
import LinkWebsites from "@/components/LinkWebsites";
import UpcomingGames from "@/components/UpcomingGames";
import WordOfDay from "@/components/WordOfDay";

export default function Home() {
  return (
    <main className="bg-[#0c0414]">
      <Hero1 />
      <AIProjects />
      <Interests />
      <UpcomingGames />
      <WordOfDay />
      <LinkWebsites />

      {/* Footer */}
      <footer className="border-t border-[#1c1528] py-8 px-4 text-center bg-[#0c0414]">
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
