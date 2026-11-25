import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { TopupReturn } from "@/components/app/wallet/TopupReturn";

export const metadata: Metadata = { title: "Paiement", robots: { index: false } };

export default async function TopupReturnPage({ searchParams }: PageProps<"/app/portefeuille/retour">) {
  const [, sp] = await Promise.all([requireUser(), searchParams]);
  const id = typeof sp.recharge === "string" ? sp.recharge : null;
  if (!id) redirect("/app/portefeuille");
  return <TopupReturn id={id} campaignId={typeof sp.campagne === "string" ? sp.campagne : undefined} failedHint={sp.echec === "1"} />;
}
