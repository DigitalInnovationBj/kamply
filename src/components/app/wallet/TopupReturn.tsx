"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { checkTopup } from "@/app/actions/wallet";
import { formatEuros } from "@/lib/plans";
import type { TopupState } from "@/lib/server/topups";

const POLL_MS = 2500;
const MAX_MS = 90_000;

/** Page de retour après le paiement par carte : vérifie la recharge jusqu'à sa confirmation. */
export function TopupReturn({ id, campaignId, failedHint }: { id: string; campaignId?: string; failedHint: boolean }) {
  const [status, setStatus] = useState<TopupState | "ERROR">("PENDING");
  const [amount, setAmount] = useState(0);
  const [balance, setBalance] = useState(0);
  const [slow, setSlow] = useState(false);
  const started = useRef(0);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    started.current = Date.now();
    const tick = async () => {
      const r = await checkTopup(id);
      if (!alive) return;
      if (!r.ok) return setStatus("ERROR");
      setAmount(r.data!.amount);
      setBalance(r.data!.balance);
      if (r.data!.status !== "PENDING") return setStatus(r.data!.status);
      const elapsed = Date.now() - started.current;
      if (elapsed > 20_000) setSlow(true);
      if (elapsed < MAX_MS) timer = setTimeout(tick, POLL_MS);
    };
    void tick();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [id]);

  const ok = status === "COMPLETED";
  const ko = status === "REJECTED" || status === "CANCELLED" || status === "ERROR";

  return (
    <div className="grid min-h-[70svh] place-items-center py-8">
      <div className="pay w-full max-w-[460px] text-center" data-state={ok ? "ok" : ko ? "ko" : "wait"} role="status" aria-live="polite">
        <div className="pay-mark mx-auto" aria-hidden="true">
          <svg viewBox="0 0 120 120" className="size-full">
            <circle className="pay-track" cx="60" cy="60" r="52" />
            <circle className="pay-ring" cx="60" cy="60" r="52" />
            <path className="pay-check" d="M38 62l15 15 30-32" />
            <path className="pay-cross" d="M44 44l32 32M76 44L44 76" />
          </svg>
        </div>

        {ok ? (
          <>
            <p className="mt-8 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#08787a]">Paiement confirmé</p>
            <h1 className="mt-2 font-display text-[64px] leading-[0.85] tabular-nums">+{formatEuros(amount)}</h1>
            <p className="mt-4 text-[15px] text-muted-foreground">
              Nouveau solde : <strong className="text-foreground">{formatEuros(balance, { decimals: true })}</strong>. Un reçu vous a été envoyé par e-mail.
            </p>
          </>
        ) : ko ? (
          <>
            <p className="mt-8 text-[11px] font-extrabold uppercase tracking-[0.16em] text-destructive">Paiement non abouti</p>
            <h1 className="mt-2 text-[30px] font-black leading-tight tracking-[-0.03em]">Votre carte n&apos;a pas été débitée.</h1>
            <p className="mt-3 text-[15px] text-muted-foreground">Le paiement a été refusé ou interrompu. Vous pouvez réessayer avec la même carte ou une autre.</p>
          </>
        ) : (
          <>
            <p className="mt-8 text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">{failedHint ? "Vérification" : "Confirmation en cours"}</p>
            <h1 className="mt-2 text-[30px] font-black leading-tight tracking-[-0.03em]">Nous vérifions votre paiement…</h1>
            <p className="mt-3 text-[15px] text-muted-foreground">
              {slow ? "La banque met un peu plus de temps que d'habitude. Vous pouvez quitter cette page : votre solde sera crédité automatiquement." : "Quelques secondes, ne fermez pas cette page."}
            </p>
          </>
        )}

        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          {ok && campaignId && (
            <Link href={`/app/campagnes/${campaignId}`} className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-7 text-[16px] font-extrabold text-black no-underline hover:bg-black hover:text-[#f5f5f3]">
              Lancer ma campagne
            </Link>
          )}
          {ko && (
            <Link href={`/app/portefeuille${campaignId ? `?campagne=${campaignId}` : ""}`} className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-7 text-[16px] font-extrabold text-black no-underline hover:bg-black hover:text-[#f5f5f3]">
              Réessayer
            </Link>
          )}
          {(ok || ko || slow) && (
            <Link href="/app/portefeuille" className="inline-flex h-14 items-center justify-center rounded-full bg-card px-7 text-[16px] font-bold text-foreground no-underline shadow-[inset_0_0_0_1.5px_var(--border)] hover:bg-black hover:text-[#f5f5f3]">
              Mon portefeuille
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
