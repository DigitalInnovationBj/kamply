import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import "./globals.css";

const robinco = localFont({
  src: "./fonts/Robinco-Regular.otf",
  variable: "--font-robinco",
  weight: "400",
  display: "swap",
});

const satoshi = localFont({
  src: "./fonts/Satoshi-Variable.ttf",
  variable: "--font-satoshi",
  weight: "300 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KAMPLY — Vos pubs Google & Meta en 5 minutes",
  description:
    "KAMPLY crée vos campagnes Google Ads ou Meta Ads avec l'IA, les lance pour vous et vous montre les résultats en direct. Sans agence, sans expertise.",
  openGraph: {
    title: "KAMPLY — Vos pubs Google & Meta en 5 minutes",
    description: "Campagnes Google Ads et Meta Ads créées par l'IA, lancées en 5 minutes, suivies en direct.",
    siteName: "KAMPLY",
    locale: "fr_FR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${robinco.variable} ${satoshi.variable}`}>
      <body>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
