"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconArrowDownLeft, IconArrowUpRight, IconReceiptOff, IconX } from "@tabler/icons-react";
import { TxStatusBadge } from "@/components/app/StatusBadge";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { cancelTopup } from "@/app/actions/wallet";
import { TX_TYPE, formatDate } from "@/lib/campaigns";
import { formatEuros } from "@/lib/plans";
import { cn } from "@/lib/utils";

type Tx = {
  id: string;
  type: keyof typeof TX_TYPE;
  status: "PENDING" | "COMPLETED" | "REJECTED" | "CANCELLED";
  amount: number;
  label: string;
  reference: string;
  note: string | null;
  createdAt: string;
};

export function TransactionList({ items }: { items: Tx[] }) {
  const router = useRouter();
  if (!items.length) {
    return (
      <div className="grid place-items-center rounded-[24px] bg-card px-6 py-12 text-center">
        <IconReceiptOff size={30} stroke={1.6} className="text-muted-foreground" />
        <p className="mt-3 font-bold">Aucune opération</p>
        <p className="mt-1 text-sm text-muted-foreground">Vos recharges et paiements apparaîtront ici.</p>
      </div>
    );
  }
  return (
    <ul className="grid gap-px overflow-hidden rounded-[24px] bg-border">
      {items.map((t) => {
        const credit = t.type === "TOPUP" || t.type === "REFUND" || (t.type === "ADJUSTMENT" && t.amount > 0);
        const dim = t.status === "CANCELLED" || t.status === "REJECTED";
        return (
          <li key={t.id} className="flex items-center gap-3 bg-card px-4 py-3.5 sm:px-5">
            <span className={cn("grid size-10 flex-none place-items-center rounded-xl", credit ? "bg-[#18cccd]/25 text-[#08787a]" : "bg-primary/15 text-[#bf3d0c]")} aria-hidden="true">
              {credit ? <IconArrowDownLeft size={18} /> : <IconArrowUpRight size={18} />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-bold">{t.label}</div>
              <div className="flex flex-wrap items-center gap-x-2 text-[12.5px] text-muted-foreground">
                <span>{TX_TYPE[t.type]}</span>·<span>{formatDate(t.createdAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>·<span className="font-mono">{t.reference}</span>
              </div>
              {t.note && <div className="mt-0.5 text-[12.5px] text-muted-foreground">« {t.note} »</div>}
            </div>
            <div className="grid flex-none justify-items-end gap-1">
              <span className={cn("text-[16px] font-black tabular-nums tracking-[-0.02em]", dim && "text-muted-foreground line-through", !dim && credit && "text-[#08787a]")}>
                {credit ? "+" : "−"}
                {formatEuros(t.amount, { decimals: true })}
              </span>
              <div className="flex items-center gap-1">
                <TxStatusBadge status={t.status} />
                {t.type === "TOPUP" && t.status === "PENDING" && (
                  <ConfirmDialog
                    tone="danger"
                    title="Annuler cette recharge ?"
                    description={<>La demande {t.reference} de {formatEuros(t.amount, { decimals: true })} sera annulée. Si vous venez de payer, patientez : le paiement est vérifié automatiquement.</>}
                    confirmLabel="Annuler la recharge"
                    onConfirm={async () => {
                      const r = await cancelTopup(t.id);
                      if (!r.ok) {
                        toast.error(r.error);
                        return false;
                      }
                      toast.success("Recharge annulée.");
                      router.refresh();
                    }}
                    trigger={
                      <button type="button" className="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Annuler la recharge ${t.reference}`}>
                        <IconX size={15} stroke={2.6} />
                      </button>
                    }
                  />
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
