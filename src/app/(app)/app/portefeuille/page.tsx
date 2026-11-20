import type { Metadata } from "next";
import { IconArrowDownLeft, IconArrowUpRight, IconClockHour4, IconReceipt } from "@tabler/icons-react";
import { requireUser } from "@/lib/session";
import { getWallet } from "@/lib/server/queries";
import { PageHeader } from "@/components/app/PageHeader";
import { TopupDialog } from "@/components/app/wallet/TopupDialog";
import { TransactionList } from "@/components/app/wallet/TransactionList";
import { formatEuros } from "@/lib/plans";

export const metadata: Metadata = { title: "Portefeuille" };

export default async function WalletPage() {
  const { user } = await requireUser();
  const { wallet, transactions, pending } = await getWallet(user.id);
  const spent = transactions.filter((t) => t.type === "DEBIT" && t.status === "COMPLETED").reduce((s, t) => s + t.amount, 0);
  const added = transactions.filter((t) => (t.type === "TOPUP" || t.type === "REFUND") && t.status === "COMPLETED").reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <PageHeader eyebrow="Portefeuille" title="Votre solde" description="Rechargez votre solde par virement : il finance vos campagnes, mois après mois." />

      <div className="rise grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="flex flex-col justify-between gap-8 rounded-[28px] bg-black p-6 text-[#f5f5f3] sm:p-8" aria-label="Solde disponible">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#a3a3a0]">Solde disponible</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">EUR</span>
          </div>
          <div>
            <div className="font-display text-[clamp(64px,12vw,112px)] leading-[0.8] tabular-nums">{formatEuros(wallet.balance)}</div>
            {pending > 0 && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1.5 text-sm font-bold text-primary">
                <IconClockHour4 size={16} /> {formatEuros(pending)} en attente de validation
              </p>
            )}
          </div>
          <TopupDialog />
        </section>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          <div className="rounded-[24px] bg-card p-5">
            <span className="grid size-9 place-items-center rounded-xl bg-[#18cccd]/25 text-[#08787a]" aria-hidden="true">
              <IconArrowDownLeft size={18} />
            </span>
            <div className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Total crédité</div>
            <div className="mt-1 text-[28px] font-black tracking-[-0.04em] tabular-nums">{formatEuros(added)}</div>
          </div>
          <div className="rounded-[24px] bg-card p-5">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-[#bf3d0c]" aria-hidden="true">
              <IconArrowUpRight size={18} />
            </span>
            <div className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Total dépensé</div>
            <div className="mt-1 text-[28px] font-black tracking-[-0.04em] tabular-nums">{formatEuros(spent)}</div>
          </div>
        </div>
      </div>

      <section className="rise mt-6" style={{ animationDelay: ".1s" }} aria-label="Historique">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-black tracking-[-0.02em]">
          <IconReceipt size={20} /> Historique
        </h2>
        <TransactionList
          items={transactions.map((t) => ({
            id: t.id,
            type: t.type,
            status: t.status,
            amount: t.amount,
            label: t.label,
            reference: t.reference,
            note: t.note,
            createdAt: t.createdAt.toISOString(),
          }))}
        />
      </section>
    </>
  );
}
