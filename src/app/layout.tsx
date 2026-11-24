import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Body and label faces — globals.css points --font-sans / --font-mono at these
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const title       = "Abhinav Prakash — Software Developer";
const description = "Personal website of Abhinav Prakash, a software developer specializing in Android — projects, sport, music and a word of the day.";

export const metadata: Metadata = {
  // Base for the share-preview image URL; override with NEXT_PUBLIC_SITE_URL if the domain changes
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://abhinavprakash.dev"),
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
