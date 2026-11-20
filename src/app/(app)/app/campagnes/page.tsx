import type { Metadata } from "next";
import { IconSpeakerphone } from "@tabler/icons-react";
import { requireUser } from "@/lib/session";
import { getCampaigns } from "@/lib/server/queries";
import { PageHeader, PrimaryLink, EmptyState } from "@/components/app/PageHeader";
import { CampaignList } from "@/components/app/campaigns/CampaignList";

export const metadata: Metadata = { title: "Campagnes" };

export default async function CampaignsPage() {
  const { user } = await requireUser();
  const campaigns = await getCampaigns(user.id);
  return (
    <>
      <PageHeader
        eyebrow={`${campaigns.length} campagne${campaigns.length > 1 ? "s" : ""}`}
        title="Campagnes"
        description="Suivez l'état de chaque campagne, mettez-la en pause ou lancez-en une nouvelle."
        actions={<PrimaryLink href="/app/campagnes/nouvelle">Nouvelle campagne</PrimaryLink>}
      />
      {campaigns.length ? (
        <CampaignList
          campaigns={campaigns.map((c) => ({
            id: c.id,
            name: c.name,
            channel: c.channel,
            status: c.status,
            plan: c.plan,
            monthlyPrice: c.monthlyPrice,
            location: c.location,
            createdAt: c.createdAt.toISOString(),
            imageUrl: c.imageUrl,
          }))}
        />
      ) : (
        <EmptyState icon={<IconSpeakerphone size={26} stroke={1.8} />} title="Aucune campagne" action={<PrimaryLink href="/app/campagnes/nouvelle">Créer ma première campagne</PrimaryLink>}>
          Votre première campagne Google Ads ou Meta Ads est prête en 5 minutes.
        </EmptyState>
      )}
    </>
  );
}
