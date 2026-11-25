"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { IconCheck, IconCreditCard, IconRefresh, IconX } from "@tabler/icons-react";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { TxStatusBadge } from "@/components/app/StatusBadge";
import { UserAvatar } from "@/components/app/UserAvatar";
import { processTopup, recheckTopup } from "@/app/actions/admin";
import { formatDate, formatNumber } from "@/lib/campaigns";
import { formatEuros } from "@/lib/plans";

type Topup = {
  id: string;
  amount: number;
  reference: string;
  status: "PENDING" | "COMPLETED" | "REJECTED" | "CANCELLED";
  note: string | null;
  method: string | null;
  fee: number;
  chargedAmount: number | null;
  createdAt: string;
  user: { name: string; email: string; companyName: string | null; image: string | null };
};

/** Recharges : cartes vérifiées automatiquement ; virements (masqués) crédités à la main. */
export function TopupRows({ items }: { items: Topup[] }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  if (!items.length) return <p className="rounded-[24px] bg-card px-4 py-12 text-center text-sm text-muted-foreground">Aucune demande de recharge.</p>;

  const act = async (id: string, d: "approve" | "reject") => {
    const r = await processTopup(id, d, note || undefined);
    if (!r.ok) {
      toast.error(r.error);
      return false;
    }
    toast.success(d === "approve" ? "Solde crédité." : "Recharge refusée.");
    setNote("");
    router.refresh();
  };

  return (
    <ul className="grid gap-px overflow-hidden rounded-[24px] bg-border">
      {items.map((t) => (
        <li key={t.id} className="flex flex-wrap items-center gap-3 bg-card px-4 py-3.5 sm:flex-nowrap sm:px-5">
          <UserAvatar name={t.user.name} image={t.user.image} size={40} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-bold">{t.user.companyName || t.user.name}</div>
            <div className="truncate text-[12.5px] text-muted-foreground">
              {t.method === "CARD" && <IconCreditCard size={13} className="mr-1 inline align-[-2px]" />}
              <span className="font-mono font-bold text-foreground">{t.reference}</span>
              {t.chargedAmount ? ` · ${formatNumber(t.chargedAmount)} F CFA débités` : ""} · {formatDate(t.createdAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </div>
            {t.note && <div className="text-[12.5px] text-muted-foreground">« {t.note} »</div>}
          </div>
          <div className="text-[18px] font-black tabular-nums tracking-[-0.02em]">{formatEuros(t.amount, { decimals: true })}</div>
          {t.method === "CARD" ? (
            <div className="flex items-center gap-2">
              {t.status === "PENDING" && (
                <button
                  type="button"
                  onClick={async () => {
                    const r = await recheckTopup(t.id);
                    if (!r.ok) return void toast.error(r.error);
                    toast.message(r.data?.status === "PENDING" ? "Paiement toujours en attente chez GeniusPay." : "Statut mis à jour.");
                    router.refresh();
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-muted px-3 text-[13px] font-bold hover:bg-[#dcdcd6]"
                >
                  <IconRefresh size={15} /> Vérifier
                </button>
              )}
              <TxStatusBadge status={t.status} />
            </div>
          ) : t.status === "PENDING" ? (
            <div className="flex w-full gap-2 sm:w-auto">
              <ConfirmDialog
                title="Créditer ce virement ?"
                description={
                  <>
                    Confirmez avoir reçu <strong className="text-foreground">{formatEuros(t.amount, { decimals: true })}</strong> avec la référence <strong className="font-mono text-foreground">{t.reference}</strong>. Le solde de {t.user.companyName || t.user.name} sera crédité immédiatement.
                  </>
                }
                confirmLabel="Créditer"
                onConfirm={() => act(t.id, "approve")}
                trigger={
                  <button type="button" className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-bold text-black hover:bg-black hover:text-[#f5f5f3] sm:flex-none">
                    <IconCheck size={16} stroke={2.6} /> Créditer
                  </button>
                }
              />
              <ConfirmDialog
                tone="danger"
                title="Refuser cette recharge ?"
                description="Le client verra la demande comme refusée, avec votre message."
                confirmLabel="Refuser"
                disabled={note.trim().length < 5}
                onConfirm={() => act(t.id, "reject")}
                trigger={
                  <button type="button" className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-card px-4 text-sm font-bold text-destructive shadow-[inset_0_0_0_1.5px_var(--border)] hover:bg-destructive hover:text-white sm:flex-none">
                    <IconX size={16} stroke={2.6} /> Refuser
                  </button>
                }
              >
                <label className="grid gap-2">
                  <span className="kf-label">
                    Motif <span className="text-destructive">*</span>
                  </span>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={300} placeholder="Aucun virement reçu avec cette référence." className="w-full resize-none rounded-2xl bg-muted px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-primary" />
                </label>
              </ConfirmDialog>
            </div>
          ) : (
            <TxStatusBadge status={t.status} />
          )}
        </li>
      ))}
    </ul>
  );
}

