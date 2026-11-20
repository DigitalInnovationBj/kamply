import type { Metadata } from "next";
import Link from "next/link";
import { IconArrowRight, IconCash, IconClockHour4, IconPlayerPlay, IconUsers } from "@tabler/icons-react";
import { requireAdmin } from "@/lib/session";
import { getAdminOverview, getStatsSeries } from "@/lib/server/queries";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/PageHeader";
import { Kpi } from "@/components/app/Kpi";
import { PerformanceChart } from "@/components/app/PerformanceChart";
import { CHANNELS, formatDate, formatNumber } from "@/lib/campaigns";
import { formatEuros } from "@/lib/plans";

export const metadata: Metadata = { title: "Administration" };

export default async function AdminPage() {
  await requireAdmin();
  const [o, stats, queue] = await Promise.all([
    getAdminOverview(),
    getStatsSeries({ campaign: {} }),
    db.campaign.findMany({ where: { status: "PENDING_REVIEW" }, orderBy: { updatedAt: "asc" }, take: 6, include: { user: { select: { companyName: true, name: true } } } }),
  ]);

  return (
    <>
      <PageHeader eyebrow="Administration" title="Vue d'ensemble" description="Validez les campagnes, saisissez leurs résultats et créditez les recharges." />
      <div className="rise grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Kpi tone="signal" label="En validation" value={formatNumber(o.pendingCampaigns)} icon={<IconClockHour4 size={18} />} hint="Campagnes à vérifier" />
        <Kpi label="Recharges en attente" value={formatNumber(o.pendingTopups)} icon={<IconCash size={18} />} hint={formatEuros(o.pendingTopupsAmount)} />
        <Kpi label="En direct" value={formatNumber(o.activeCampaigns)} icon={<IconPlayerPlay size={18} />} hint="Campagnes diffusées" />
        <Kpi tone="dark" label="Comptes" value={formatNumber(o.users)} icon={<IconUsers size={18} />} hint="Utilisateurs inscrits" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rise min-w-0" style={{ animationDelay: ".05s" }}>
          <PerformanceChart series={stats.series} hasData={stats.hasData} title="Toutes campagnes confondues" />
        </div>
        <section className="rise rounded-[24px] bg-card p-5" style={{ animationDelay: ".1s" }} aria-label="File de validation">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black tracking-[-0.02em]">À valider</h2>
            <Link href="/app/admin/campagnes?statut=PENDING_REVIEW" className="text-sm font-bold text-muted-foreground no-underline hover:text-foreground">
              Tout voir
            </Link>
          </div>
          {queue.length ? (
            <ul className="grid gap-1">
              {queue.map((c) => (
                <li key={c.id}>
                  <Link href={`/app/admin/campagnes/${c.id}`} className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-foreground no-underline hover:bg-muted">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold">{c.name}</div>
                      <div className="truncate text-[12.5px] text-muted-foreground">
                        {c.user.companyName || c.user.name} · {CHANNELS[c.channel].label} · {formatDate(c.updatedAt, { day: "numeric", month: "short" })}
                      </div>
                    </div>
                    <IconArrowRight size={16} className="text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl bg-muted px-4 py-6 text-center text-sm text-muted-foreground">Aucune campagne en attente.</p>
          )}
          {o.pendingTopups > 0 && (
            <Link href="/app/admin/recharges" className="mt-3 flex items-center justify-between rounded-2xl bg-primary/15 px-4 py-3 text-sm font-bold text-foreground no-underline hover:bg-primary/25">
              {o.pendingTopups} recharge{o.pendingTopups > 1 ? "s" : ""} à traiter <IconArrowRight size={16} />
            </Link>
          )}
        </section>
      </div>
    </>
  );
}
