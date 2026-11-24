import type { Metadata } from "next";
// Body and label faces (self-hosted, see src/fonts) — globals.css points --font-sans / --font-mono at these
import { inter, jetbrainsMono } from "@/fonts";
import "./globals.css";

const title       = "Abhinav Prakash — Software Developer";
const description = "Personal website of Abhinav Prakash, a software developer specializing in Android — projects, sport, music and a word of the day.";

export const metadata: Metadata = {
  // Base for the share-preview image URL; override with NEXT_PUBLIC_SITE_URL if the domain changes
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abhinavprakash.dev"),
  title,
  description,
  openGraph: { title, description, type: "website" },
  twitter:   { card: "summary_large_image", title, description },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
