import { SiteNav } from "@/components/navigation/SiteNav";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/app/providers";
import "@/styles/globals.css";
export const metadata = {
    title: "Wonderlust — Curated Travel Experiences",
    description: "Wonderlust crafts personal journeys across the world's most beautiful destinations. Book unforgettable travel experiences with a team that loves to travel as much as you do.",
};
export const viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#ffffff",
};
export default function RootLayout({ children }) {
    return (<html lang="en">
      <body>
        <Providers>
          <SiteNav user={null}/>
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>);
}
