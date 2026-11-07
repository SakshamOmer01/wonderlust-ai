import type { Metadata, Viewport } from "next";

export const SITE_METADATA = {
  title: "Wonderlust — Curated Travel Experiences",
  description:
    "Wonderlust crafts personal journeys across the world's most beautiful destinations. Book unforgettable travel experiences with a team that loves to travel as much as you do.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
} as const satisfies Metadata;

export const SITE_VIEWPORT: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export function metadata(title: string, description?: string) {
  return {
    title: `${title} | Wonderlust`,
    description: description ?? SITE_METADATA.description,
  } as Metadata;
}
