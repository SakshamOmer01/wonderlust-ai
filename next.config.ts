import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Static optimization handling: Next.js 15 no longer
   * infers image domains from `next/image`; we declare them
   * explicitly so the production build compiles.
   */
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "source.unsplash.com" },
    ],
  },

};

export default nextConfig;
