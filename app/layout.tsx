import type { Metadata, Viewport } from "next";
import { SiteNav } from "@/components/navigation/SiteNav";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Wonderlust — Curated Travel Experiences",
  description:
    "Wonderlust crafts personal journeys across the world's most beautiful destinations. Book unforgettable travel experiences with a team that loves to travel as much as you do.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteNav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

import { Footer } from "@/components/layout/Footer";
