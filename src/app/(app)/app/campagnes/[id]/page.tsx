import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconAlertTriangle, IconArrowLeft, IconChartBar, IconClick, IconCoins, IconEye, IconInfoCircle, IconTargetArrow } from "@tabler/icons-react";
import { requireUser } from "@/lib/session";
import { getCampaign } from "@/lib/server/queries";
import { db } from "@/lib/db";
import { Kpi, delta } from "@/components/app/Kpi";
import { PerformanceChart } from "@/components/app/PerformanceChart";
import { StatusBadge } from "@/components/app/StatusBadge";
import { AdPreview } from "@/components/app/campaigns/AdPreview";
import { CampaignActions } from "@/components/app/campaigns/CampaignActions";
import { CHANNELS, STATUS, formatDate, formatNumber } from "@/lib/campaigns";
import { formatEuros, planById } from "@/lib/plans";

export const metadata: Metadata = { title: "Campagne" };

export default async function CampaignPage({ params }: PageProps<"/app/campagnes/[id]">) {
  const [{ id }, { user }] = await Promise.all([params, requireUser()]);
  const data = await getCampaign(user.id, id);
  if (!data) notFound();
  const { campaign: c, stats } = data;
  const wallet = await db.wallet.findUnique({ where: { userId: user.id } });
  const { current: cur, previous: prev } = stats;

  return (
    <>
      <Link href="/app/campagnes" className="rise mb-4 inline-flex items-center gap-1.5 rounded-full py-1 text-sm font-bold text-muted-foreground no-underline hover:text-foreground">
        <IconArrowLeft size={16} stroke={2.4} /> Campagnes
      </Link>

      <div className="rise mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={c.status} />
            <span className="text-[13px] font-semibold text-muted-foreground">
              {CHANNELS[c.channel].label} · {planById(c.plan).name} · {formatEuros(c.monthlyPrice)} / mois
            </span>
          </div>
          <h1 className="mt-3 break-words text-[30px] font-black leading-[1.02] tracking-[-0.035em] sm:text-[38px]">{c.name}</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">{STATUS[c.status].hint}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user.role === "admin" && (
            <Link href={`/app/admin/campagnes/${c.id}`} className="inline-flex h-12 items-center gap-2 rounded-full bg-card px-5 text-[15px] font-bold text-foreground no-underline shadow-[inset_0_0_0_1.5px_var(--border)] hover:bg-black hover:text-[#f5f5f3]">
              <IconChartBar size={18} /> Saisir les statistiques
            </Link>
          )}
          <CampaignActions id={c.id} name={c.name} status={c.status} price={c.monthlyPrice} balance={wallet?.balance ?? 0} />
        </div>
      </div>

      {c.adminNote && (
        <div className={`rise mb-5 flex gap-3 rounded-2xl px-4 py-3.5 text-sm ${c.status === "REJECTED" ? "bg-destructive/10 text-destructive" : "bg-[#18cccd]/20"}`} role="status">
          {c.status === "REJECTED" ? <IconAlertTriangle size={20} className="flex-none" /> : <IconInfoCircle size={20} className="flex-none" />}
          <span>
            <strong>Message de l&apos;équipe KAMPLY :</strong> {c.adminNote}
          </span>
        </div>
      )}

      <div className="rise grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" style={{ animationDelay: ".05s" }}>
        <Kpi label="Personnes touchées" value={formatNumber(cur.reach)} icon={<IconEye size={18} />} change={stats.hasData ? delta(cur.reach, prev.reach) : undefined} hint="Aucune diffusion" />
        <Kpi label="Clics" value={formatNumber(cur.clicks)} icon={<IconClick size={18} />} change={stats.hasData ? delta(cur.clicks, prev.clicks) : undefined} hint={cur.impressions ? `${((cur.clicks / cur.impressions) * 100).toFixed(1).replace(".", ",")} % de taux de clic` : "Aucune diffusion"} />
        <Kpi tone="signal" label="Conversions" value={formatNumber(cur.conversions)} icon={<IconTargetArrow size={18} />} change={stats.hasData ? delta(cur.conversions, prev.conversions) : undefined} hint={c.objective} />
        <Kpi tone="dark" label="Dépense (30 j)" value={formatEuros(cur.spend, { decimals: true })} icon={<IconCoins size={18} />} hint={cur.conversions ? `${formatEuros(Math.round(cur.spend / cur.conversions), { decimals: true })} par conversion` : "Coût par conversion : –"} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rise min-w-0" style={{ animationDelay: ".1s" }}>
          <PerformanceChart series={stats.series} hasData={stats.hasData} />
        </div>
        <div className="rise grid min-w-0 content-start gap-4" style={{ animationDelay: ".15s" }}>
          <AdPreview channel={c.channel} company={user.companyName || user.name} headline={c.headline} description={c.description} landingUrl={c.landingUrl} imageUrl={c.imageUrl} />
          <dl className="grid gap-px overflow-hidden rounded-[24px] bg-border text-sm">
            {[
              ["Objectif", c.objective],
              ["Zone", c.radiusKm ? `${c.location} · ${c.radiusKm} km` : c.location],
              [c.channel === "GOOGLE" ? "Mots-clés" : "Centres d'intérêt", c.channel === "GOOGLE" ? c.keywords.join(", ") : c.audience || "Ciblage automatique"],
              ["Destination", c.landingUrl],
              ["Créée le", formatDate(c.createdAt)],
              ["Diffusée depuis", c.startedAt ? formatDate(c.startedAt) : "Pas encore"],
            ].map(([k, v]) => (
              <div key={k} className="grid gap-0.5 bg-card px-4 py-3">
                <dt className="text-[12px] font-semibold text-muted-foreground">{k}</dt>
                <dd className="m-0 break-words font-bold">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </>
  );
}
