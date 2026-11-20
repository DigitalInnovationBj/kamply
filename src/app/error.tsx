"use client";

import { useEffect } from "react";
import Link from "next/link";
import { SystemScreen, sysGhost, sysPrimary } from "@/components/app/SystemScreen";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const digest = error instanceof Error && "digest" in error ? String((error as Error & { digest?: string }).digest ?? "") : "";
  return (
    <SystemScreen code="OFF" eyebrow="Signal perdu" title="Quelque chose a coupé la diffusion." text="Une erreur inattendue est survenue de notre côté. Vos données ne sont pas touchées : réessayez dans un instant.">
      <button type="button" onClick={() => retry()} className={sysPrimary}>
        Réessayer <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 18l6-6M13 6l6 6" /></svg>
      </button>
      <Link href="/app" className={sysGhost}>
        Tableau de bord
      </Link>
      {digest && <p className="sys-digest w-full">Référence : {digest}</p>}
    </SystemScreen>
  );
}
