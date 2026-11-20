"use client";

import { useEffect, useState } from "react";
import { IconRefresh } from "@tabler/icons-react";

/** Bouton « renvoyer le code » avec compte à rebours circulaire. */
export function ResendCode({ onResend, delay = 60, startCounting = true }: { onResend: () => Promise<boolean>; delay?: number; startCounting?: boolean }) {
  const [left, setLeft] = useState(startCounting ? delay : 0);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const click = async () => {
    setBusy(true);
    const ok = await onResend();
    setBusy(false);
    if (ok) {
      setSent(true);
      setLeft(delay);
      setTimeout(() => setSent(false), 2600);
    }
  };

  const pct = left > 0 ? left / delay : 0;
  const r = 9;
  const c = 2 * Math.PI * r;

  return (
    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground" aria-live="polite">
      <span>Pas reçu ?</span>
      <button
        type="button"
        onClick={click}
        disabled={left > 0 || busy}
        className="inline-flex items-center gap-2 rounded-full px-3 py-2 font-bold text-foreground transition-colors hover:bg-muted disabled:cursor-default disabled:text-muted-foreground disabled:hover:bg-transparent"
      >
        {left > 0 ? (
          <>
            <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" className="-rotate-90">
              <circle cx="11" cy="11" r={r} fill="none" stroke="#dcdcd6" strokeWidth="2.5" />
              <circle cx="11" cy="11" r={r} fill="none" stroke="#ff5b23" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset 1s linear" }} />
            </svg>
            Renvoyer dans {left} s
          </>
        ) : (
          <>
            <IconRefresh size={17} stroke={2.2} className={busy ? "animate-spin" : ""} /> {sent ? "Code envoyé" : "Renvoyer le code"}
          </>
        )}
      </button>
    </div>
  );
}
