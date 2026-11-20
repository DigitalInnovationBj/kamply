import Link from "next/link";
import type { ReactNode } from "react";

/** Écran système (404, erreur) : grand code en Robinco qui grésille comme un signal perdu. */
export function SystemScreen({ code, eyebrow, title, text, children }: { code: string; eyebrow: string; title: string; text: ReactNode; children?: ReactNode }) {
  return (
    <main className="sys">
      <Link href="/" className="sys-logo" aria-label="KAMPLY, accueil">
        KAMPLY
      </Link>
      <div className="sys-body">
        <p className="sys-eyebrow">
          <span className="sys-dot" aria-hidden="true" /> {eyebrow}
        </p>
        <div className="sys-code" aria-hidden="true" data-text={code}>
          {code}
        </div>
        <h1 className="sys-title">{title}</h1>
        <p className="sys-text">{text}</p>
        <div className="sys-actions">{children}</div>
      </div>
    </main>
  );
}

export const sysPrimary = "sys-btn sys-btn--primary";
export const sysGhost = "sys-btn";
