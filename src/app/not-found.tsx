import type { Metadata } from "next";
import Link from "next/link";
import { SystemScreen, sysGhost, sysPrimary } from "@/components/app/SystemScreen";

export const metadata: Metadata = { title: "Page introuvable", robots: { index: false } };

export default function NotFound() {
  return (
    <SystemScreen code="404" eyebrow="Pas à l'antenne" title="Cette page n'est pas diffusée." text="Le lien est peut-être ancien, ou l'adresse contient une faute de frappe. Revenez sur une page qui émet.">
      <Link href="/app" className={sysPrimary}>
        Mon tableau de bord <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 18l6-6M13 6l6 6" /></svg>
      </Link>
      <Link href="/" className={sysGhost}>
        Accueil KAMPLY
      </Link>
    </SystemScreen>
  );
}
