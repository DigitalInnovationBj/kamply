import type { Metadata } from "next";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { MetaAd, PhotoVisual, FLOWERS } from "@/components/site/Ads";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Écrans d'authentification : formulaire à gauche, affiche KAMPLY à droite (desktop). */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="app-surface grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex min-h-svh flex-col px-5 pb-8 pt-5 sm:px-10">
        <header className="flex items-center justify-between">
          <Link href="/" className="font-display text-[30px] leading-none text-foreground no-underline" aria-label="KAMPLY, retour au site">
            KAMPLY
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground no-underline transition-colors hover:bg-muted hover:text-foreground"
          >
            <IconArrowLeft size={16} stroke={2.2} /> Retour au site
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[440px]">{children}</div>
        </main>
        <p className="text-center text-xs text-muted-foreground">© 2026 KAMPLY · Vos données restent les vôtres.</p>
      </div>

      <aside className="relative hidden overflow-hidden bg-black text-[#f5f5f3] lg:flex lg:flex-col lg:justify-between lg:p-12" aria-hidden="true">
        <span className="font-display uppercase leading-[0.82] text-[clamp(72px,8vw,132px)]">
          Vos pubs
          <br />
          <span className="text-primary">Google</span>
          <br />
          <span className="text-primary">&amp; Meta</span>
        </span>
        <div className="absolute right-[8%] top-[22%] rotate-[5deg]">
          <MetaAd
            name="Maison Lune"
            initials="ML"
            avatar={{ background: "#ff5b23", color: "#000" }}
            ai
            hover={false}
            visual={<PhotoVisual src={FLOWERS.whitePink} alt="" kicker="Fleuriste · Livré en 3 h" title="Le bouquet qui dit tout." />}
            url="maisonlune.com"
            cta="Composer mon bouquet"
            button="Acheter"
          />
        </div>
        <p className="max-w-sm text-lg font-medium leading-snug text-[#a3a3a0]">
          Une campagne créée par l&apos;IA, lancée en 5 minutes, suivie en direct.
        </p>
      </aside>
    </div>
  );
}
