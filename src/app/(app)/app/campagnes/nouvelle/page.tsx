import type { Metadata } from "next";
import { headers } from "next/headers";
import { COUNTRY_CODES } from "@/lib/targeting";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/PageHeader";
import { CampaignWizard } from "@/components/app/campaigns/CampaignWizard";
import { aiReady } from "@/lib/server/ai";

export const metadata: Metadata = { title: "Nouvelle campagne" };

export default async function NewCampaignPage() {
  const { user } = await requireUser();
  // Pays proposé par défaut : région de la langue du navigateur (ex. fr-BE → BE), sinon pays de connexion du visiteur (Vercel).
  const h = await headers();
  const region = (h.get("accept-language")?.match(/[a-z]{2}-([A-Z]{2})/)?.[1] ?? h.get("x-vercel-ip-country") ?? "").toUpperCase();
  const defaultCountry = (COUNTRY_CODES as readonly string[]).includes(region) ? region : "FR";
  const wallet = await db.wallet.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });
  return (
    <>
      <PageHeader eyebrow="Nouvelle campagne" title="Lancez votre diffusion" description="Environ 5 minutes. Votre saisie est conservée si vous revenez en arrière." />
      <CampaignWizard company={user.companyName || user.name} website={user.website} balance={wallet.balance} aiEnabled={aiReady()} defaultCountry={defaultCountry} />
    </>
  );
}
