import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 90 keeps the text in project screenshots crisp; 75 is the default for everything else
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "www.thesportsdb.com",
      },
    ],
  },
};

export default nextConfig;
