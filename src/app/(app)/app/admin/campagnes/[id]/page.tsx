import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconArrowLeft, IconChartBar, IconMail, IconPhone, IconShieldCheck, IconTable } from "@tabler/icons-react";
import { requireAdmin } from "@/lib/session";
import { getAdminCampaign } from "@/lib/server/queries";
import { PerformanceChart } from "@/components/app/PerformanceChart";
import { StatusBadge } from "@/components/app/StatusBadge";
import { AdPreview } from "@/components/app/campaigns/AdPreview";
import { StatForm, StatTable, StatusControl } from "@/components/app/admin/AdminCampaignTools";
import { CHANNELS, STATUS, formatDate } from "@/lib/campaigns";
import { formatEuros, planById } from "@/lib/plans";

export const metadata: Metadata = { title: "Campagne · Admin" };

export default async function AdminCampaignPage({ params }: PageProps<"/app/admin/campagnes/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const data = await getAdminCampaign(id);
  if (!data) notFound();
  const { campaign: c, stats, entries } = data;
  const canStat = c.status === "ACTIVE" || c.status === "PAUSED" || c.status === "ENDED";

  return (
    <>
      <Link href="/app/admin/campagnes" className="rise mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground no-underline hover:text-foreground">
        <IconArrowLeft size={16} stroke={2.4} /> Campagnes
      </Link>
      <div className="rise mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={c.status} />
          <span className="text-[13px] font-semibold text-muted-foreground">
            {CHANNELS[c.channel].label} · {planById(c.plan).name} · {formatEuros(c.monthlyPrice)} / mois
          </span>
        </div>
        <h1 className="mt-3 break-words text-[30px] font-black leading-[1.02] tracking-[-0.035em] sm:text-[38px]">{c.name}</h1>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="font-bold text-foreground">{c.user.companyName || c.user.name}</span>
          <a href={`mailto:${c.user.email}`} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <IconMail size={15} /> {c.user.email}
          </a>
          {c.user.phone && (
            <a href={`tel:${c.user.phone}`} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <IconPhone size={15} /> {c.user.phone}
            </a>
          )}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 content-start gap-4 [&>*]:min-w-0">
          <section className="rise rounded-[24px] bg-card p-5 sm:p-6" aria-label="Décision">
            <h2 className="mb-1 flex items-center gap-2 text-lg font-black tracking-[-0.02em]">
              <IconShieldCheck size={20} /> Décision
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">{STATUS[c.status].hint}</p>
            <StatusControl id={c.id} status={c.status} />
            {c.adminNote && <p className="mt-4 rounded-2xl bg-muted px-4 py-3 text-sm">Dernier message envoyé : « {c.adminNote} »</p>}
          </section>

          {!canStat && (
            <p className="rise rounded-[24px] bg-card px-5 py-4 text-sm text-muted-foreground">
              La saisie des résultats s&apos;ouvre dès que la campagne est validée et diffusée.
            </p>
          )}
          {canStat && (
            <section className="rise rounded-[24px] bg-card p-5 sm:p-6" aria-label="Saisie des résultats">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-black tracking-[-0.02em]">
                <IconChartBar size={20} /> Saisir les résultats d&apos;une journée
              </h2>
              <StatForm campaignId={c.id} />
            </section>
          )}

          <PerformanceChart series={stats.series} hasData={stats.hasData} title="Ce que voit le client" />

          <section className="rise rounded-[24px] bg-card p-5 sm:p-6" aria-label="Journées saisies">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-black tracking-[-0.02em]">
              <IconTable size={20} /> Journées saisies
            </h2>
            <StatTable entries={entries.map((e) => ({ id: e.id, date: e.date.toISOString(), impressions: e.impressions, reach: e.reach, clicks: e.clicks, conversions: e.conversions, spend: e.spend }))} />
          </section>
        </div>

        <aside className="grid min-w-0 content-start gap-4">
          <AdPreview channel={c.channel} company={c.user.companyName || c.user.name} headline={c.headline} description={c.description} landingUrl={c.landingUrl} imageUrl={c.imageUrl} />
          <dl className="grid gap-px overflow-hidden rounded-[24px] bg-border text-sm">
            {[
              ["Objectif", c.objective],
              ["Zone", c.targeting ? c.location : c.radiusKm ? `${c.location} · ${c.radiusKm} km` : c.location],
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
        </aside>
      </div>
    </>
  );
}
