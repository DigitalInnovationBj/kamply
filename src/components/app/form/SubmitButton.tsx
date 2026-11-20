"use client";

import { IconArrowRight } from "@tabler/icons-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SubmitState = "idle" | "loading" | "success" | "error";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { state?: SubmitState; children: ReactNode; arrow?: boolean };

/**
 * Bouton d'envoi à états :
 * chargement = le bouton se rétracte en cercle et tourne ;
 * succès = coche tracée au trait + halo turquoise ;
 * erreur = croix tracée + secousse.
 */
export function SubmitButton({ state = "idle", children, arrow = true, className, disabled, ...props }: Props) {
  const busy = state !== "idle";
  return (
    <button
      type="submit"
      className={cn("sbtn", className)}
      data-state={state}
      disabled={disabled || busy}
      aria-busy={state === "loading"}
      {...props}
    >
      <span className="sbtn-label">
        {children}
        {arrow && <IconArrowRight size={19} stroke={2.4} aria-hidden="true" />}
      </span>
      <span className="sbtn-spin" aria-hidden="true">
        <i />
      </span>
      <span className="sbtn-mark ok" aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l5 5l10 -10" />
        </svg>
      </span>
      <span className="sbtn-mark ko" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round">
          <path d="M6 6l12 12" />
          <path d="M18 6l-12 12" />
        </svg>
      </span>
      <span className="sbtn-halo" aria-hidden="true" />
      <span className="sr-only" aria-live="polite">
        {state === "loading" ? "Envoi en cours" : state === "success" ? "Réussi" : state === "error" ? "Échec" : ""}
      </span>
    </button>
  );
}

/** Enchaîne les états d'un bouton : succès / erreur visibles un instant avant de revenir au repos. */
export function pulseState(set: (s: SubmitState) => void, s: "success" | "error", ms = s === "success" ? 1400 : 1500) {
  set(s);
  return new Promise<void>((resolve) =>
    setTimeout(() => {
      if (s === "error") set("idle");
      resolve();
    }, ms),
  );
}
