import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { getPendingTopups } from "@/lib/server/queries";
import { PageHeader } from "@/components/app/PageHeader";
import { TopupRows } from "@/components/app/admin/AdminLists";

export const metadata: Metadata = { title: "Recharges · Admin" };

export default async function AdminTopupsPage() {
  await requireAdmin();
  const list = await getPendingTopups();
  return (
    <>
      <PageHeader eyebrow="Administration" title="Recharges" description="Paiements par carte GeniusPay : le solde est crédité automatiquement après vérification du paiement." />
      <div className="rise">
        <TopupRows
          items={list.map((t) => ({ id: t.id, amount: t.amount, reference: t.reference, status: t.status, note: t.note, method: t.method, fee: t.fee, chargedAmount: t.chargedAmount, createdAt: t.createdAt.toISOString(), user: t.wallet.user }))}
        />
      </div>
    </>
  );
}
