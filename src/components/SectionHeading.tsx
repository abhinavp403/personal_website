// Same condensed display face as the About Me player card
import { barlowHeading as barlow } from "@/fonts";

// Shared section header: yellow mono eyebrow over a condensed uppercase title
export default function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="font-mono text-[13px] font-bold tracking-[0.3em] text-yellow-400 uppercase">{eyebrow}</p>
      <h2 className={`${barlow.className} text-white font-extrabold uppercase text-4xl sm:text-5xl leading-none mt-2`}>
        {title}
      </h2>
    </div>
  );
}
