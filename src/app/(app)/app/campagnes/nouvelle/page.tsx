import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/PageHeader";
import { CampaignWizard } from "@/components/app/campaigns/CampaignWizard";

export const metadata: Metadata = { title: "Nouvelle campagne" };

export default async function NewCampaignPage() {
  const { user } = await requireUser();
  const wallet = await db.wallet.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });
  return (
    <>
      <PageHeader eyebrow="Nouvelle campagne" title="Lancez votre diffusion" description="Six étapes, environ 5 minutes. Votre saisie est conservée si vous revenez en arrière." />
      <CampaignWizard company={user.companyName || user.name} website={user.website} balance={wallet.balance} />
    </>
  );
}
