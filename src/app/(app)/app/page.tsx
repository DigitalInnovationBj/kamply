import type { Metadata } from "next";
import Link from "next/link";
import { IconChevronRight, IconClick, IconCoins, IconEye, IconSpeakerphone, IconTargetArrow } from "@tabler/icons-react";
import { requireUser } from "@/lib/session";
import { getDashboard } from "@/lib/server/queries";
import { Kpi, delta } from "@/components/app/Kpi";
import { PerformanceChart } from "@/components/app/PerformanceChart";
import { PageHeader, PrimaryLink, EmptyState } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { CHANNELS, formatNumber } from "@/lib/campaigns";
import { formatEuros } from "@/lib/plans";

export const metadata: Metadata = { title: "Accueil" };

function greeting() {
  const h = Number(new Intl.DateTimeFormat("fr-FR", { hour: "numeric", hour12: false, timeZone: "Europe/Paris" }).format(new Date()));
  return h < 5 || h >= 18 ? "Bonsoir" : "Bonjour";
}

export default async function DashboardPage() {
  const { user } = await requireUser();
  const { stats, campaigns, wallet, counts } = await getDashboard(user.id);
  const { current: c, previous: p } = stats;
  const first = user.name.split(" ")[0];
  const active = counts.ACTIVE ?? 0;
  const pending = counts.PENDING_REVIEW ?? 0;

  return (
    <>
      <PageHeader
        eyebrow={active ? `${active} campagne${active > 1 ? "s" : ""} en direct` : pending ? `${pending} campagne${pending > 1 ? "s" : ""} en validation` : "Tableau de bord"}
        title={`${greeting()}, ${first}.`}
        description={campaigns.length ? "Vos résultats des 30 derniers jours, mis à jour chaque jour." : "Lancez votre première campagne : elle est prête en 5 minutes."}
        actions={<PrimaryLink href="/app/campagnes/nouvelle">Nouvelle campagne</PrimaryLink>}
      />

      <div className="rise grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" style={{ animationDelay: ".05s" }}>
        <Kpi label="Personnes touchées" value={formatNumber(c.reach)} icon={<IconEye size={18} stroke={2} />} change={stats.hasData ? delta(c.reach, p.reach) : undefined} hint="Aucune diffusion" />
        <Kpi label="Clics" value={formatNumber(c.clicks)} icon={<IconClick size={18} stroke={2} />} change={stats.hasData ? delta(c.clicks, p.clicks) : undefined} hint="Aucune diffusion" />
        <Kpi
          tone="signal"
          label="Conversions"
          value={formatNumber(c.conversions)}
          icon={<IconTargetArrow size={18} stroke={2} />}
          change={stats.hasData ? delta(c.conversions, p.conversions) : undefined}
          hint="Appels, messages, ventes"
        />
        <Kpi
          tone="dark"
          label="Coût par conversion"
          value={c.conversions ? formatEuros(Math.round(c.spend / c.conversions), { decimals: true }) : "–"}
          icon={<IconCoins size={18} stroke={2} />}
          hint={c.spend ? `${formatEuros(c.spend, { decimals: true })} dépensés` : "Rien de dépensé"}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rise min-w-0" style={{ animationDelay: ".1s" }}>
          <PerformanceChart series={stats.series} hasData={stats.hasData} />
        </div>

        <div className="rise grid min-w-0 content-start gap-4" style={{ animationDelay: ".15s" }}>
          <Link href="/app/portefeuille" className="group block rounded-[24px] bg-black p-5 text-[#f5f5f3] no-underline transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#a3a3a0]">Solde disponible</span>
              <IconChevronRight size={18} className="text-[#a3a3a0] transition-transform group-hover:translate-x-1" />
            </div>
            <div className="mt-6 font-display text-[54px] leading-[0.85] tabular-nums">{formatEuros(wallet.balance)}</div>
            <p className="mt-3 text-sm text-[#a3a3a0]">{wallet.balance < 14900 ? "Rechargez pour lancer une campagne." : "Prêt à financer votre prochaine campagne."}</p>
          </Link>

          <section className="rounded-[24px] bg-card p-5" aria-label="Campagnes récentes">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-black tracking-[-0.02em]">Campagnes récentes</h2>
              <Link href="/app/campagnes" className="text-sm font-bold text-muted-foreground no-underline hover:text-foreground">
                Tout voir
              </Link>
            </div>
            {campaigns.length ? (
              <ul className="-mx-2 grid">
                {campaigns.map((cp) => (
                  <li key={cp.id}>
                    <Link href={`/app/campagnes/${cp.id}`} className="flex items-center gap-3 rounded-2xl px-2 py-2.5 no-underline transition-colors hover:bg-muted">
                      <span className="grid size-10 flex-none place-items-center rounded-xl bg-muted text-[11px] font-black">{cp.channel === "GOOGLE" ? "G" : "M"}</span>
                      <span className="grid min-w-0 flex-1">
                        <span className="truncate text-sm font-bold text-foreground">{cp.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{CHANNELS[cp.channel].label}</span>
                      </span>
                      <StatusBadge status={cp.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune campagne pour l&apos;instant.</p>
            )}
          </section>
        </div>
      </div>

      {!campaigns.length && (
        <div className="mt-4">
          <EmptyState
            icon={<IconSpeakerphone size={26} stroke={1.8} />}
            title="Votre première campagne vous attend"
            action={<PrimaryLink href="/app/campagnes/nouvelle">Créer ma campagne</PrimaryLink>}
          >
            Choisissez Google Ads ou Meta Ads, l&apos;IA vous aide à écrire l&apos;annonce, et notre équipe la met en ligne.
          </EmptyState>
        </div>
      )}
    </>
  );
}
