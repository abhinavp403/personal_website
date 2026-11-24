import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Preview card shown when the site link is shared (LinkedIn, WhatsApp, iMessage…)
export const alt = "Abhinav Prakash — software developer specializing in Android";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const photo = await readFile(join(process.cwd(), "public/profile.jpg"));
  const photoSrc = `data:image/jpeg;base64,${photo.toString("base64")}`;
  // The renderer takes TTF/OTF/WOFF, not WOFF2, so this one face is kept as .woff in src/fonts
  const display = await readFile(join(process.cwd(), "src/fonts/barlow-condensed-latin-800-normal.woff"));
  const displayFamily = "Barlow Condensed";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 72,
          padding: "0 90px",
          background: "#020d1c",
          color: "#ffffff",
        }}
      >
        {/* Player card, as in the About Me section */}
        <div
          style={{
            display: "flex",
            width: 330,
            height: 500,
            padding: 12,
            borderRadius: 28,
            background: "#facc15",
            transform: "rotate(-3deg)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
              borderRadius: 18,
              overflow: "hidden",
              background: "#071e38",
            }}
          >
            <div style={{ display: "flex", padding: "8px 16px 6px", color: "#facc15", fontSize: 40, fontWeight: 800, fontFamily: displayFamily }}>
              DEV
            </div>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <img src={photoSrc} width={306} height={418} style={{ objectFit: "cover", objectPosition: "top" }} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", color: "#facc15", fontSize: 24, fontWeight: 700, letterSpacing: 8 }}>
            SCOUTING REPORT
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 150, fontWeight: 800, fontFamily: displayFamily, lineHeight: 0.92, marginTop: 14 }}>
            <span>ABHINAV</span>
            <span>PRAKASH</span>
          </div>
          <div style={{ display: "flex", color: "#60a5fa", fontSize: 34, fontWeight: 700, marginTop: 26 }}>
            Software developer · Android
          </div>
          <div style={{ display: "flex", color: "#d1d5db", fontSize: 26, marginTop: 14 }}>
            Projects, sport, music and a word of the day
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Barlow Condensed", data: display, weight: 800, style: "normal" }],
    },
  );
}
