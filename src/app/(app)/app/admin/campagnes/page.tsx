import type { Metadata } from "next";
import Link from "next/link";
import { IconBrandGoogle, IconBrandMeta, IconChevronRight, IconSpeakerphone } from "@tabler/icons-react";
import { requireAdmin } from "@/lib/session";
import { getAdminCampaigns } from "@/lib/server/queries";
import { PageHeader, EmptyState } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { STATUS, formatDate, type CampaignStatusKey } from "@/lib/campaigns";
import { formatEuros, planById } from "@/lib/plans";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Campagnes · Admin" };

const FILTERS: (CampaignStatusKey | "")[] = ["", "PENDING_REVIEW", "ACTIVE", "PAUSED", "REJECTED", "DRAFT", "ENDED"];

export default async function AdminCampaignsPage({ searchParams }: PageProps<"/app/admin/campagnes">) {
  await requireAdmin();
  const sp = await searchParams;
  const statut = typeof sp.statut === "string" && sp.statut in STATUS ? (sp.statut as CampaignStatusKey) : "";
  const list = await getAdminCampaigns(statut || undefined);

  return (
    <>
      <PageHeader eyebrow="Administration" title="Campagnes" description="Ouvrez une campagne pour la valider et saisir ses résultats quotidiens." />
      <nav className="rise -mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" aria-label="Filtrer par statut">
        {FILTERS.map((f) => (
          <Link
            key={f || "all"}
            href={f ? `/app/admin/campagnes?statut=${f}` : "/app/admin/campagnes"}
            aria-current={statut === f ? "page" : undefined}
            className={cn("flex h-10 flex-none items-center rounded-full px-4 text-sm font-bold no-underline transition-colors", statut === f ? "bg-black text-[#f5f5f3]" : "bg-card text-muted-foreground hover:text-foreground")}
          >
            {f ? STATUS[f].label : "Toutes"}
          </Link>
        ))}
      </nav>
      {list.length ? (
        <ul className="rise grid gap-px overflow-hidden rounded-[24px] bg-border">
          {list.map((c) => (
            <li key={c.id}>
              <Link href={`/app/admin/campagnes/${c.id}`} className="group flex items-center gap-3 bg-card px-4 py-3.5 text-foreground no-underline transition-colors hover:bg-muted sm:px-5">
                <span className="grid size-10 flex-none place-items-center rounded-xl bg-black text-[#f5f5f3]" aria-hidden="true">
                  {c.channel === "GOOGLE" ? <IconBrandGoogle size={18} /> : <IconBrandMeta size={18} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-bold">{c.name}</div>
                  <div className="truncate text-[12.5px] text-muted-foreground">
                    {c.user.companyName || c.user.name} · {c.user.email}
                  </div>
                </div>
                <div className="hidden text-right text-[12.5px] text-muted-foreground sm:block">
                  <div className="font-bold text-foreground">
                    {planById(c.plan).name} · {formatEuros(c.monthlyPrice)}
                  </div>
                  <div>Mise à jour {formatDate(c.updatedAt, { day: "numeric", month: "short" })}</div>
                </div>
                <StatusBadge status={c.status} />
                <IconChevronRight size={18} className="flex-none text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={<IconSpeakerphone size={26} />} title="Aucune campagne">
          {statut ? `Aucune campagne « ${STATUS[statut].label} ».` : "Aucune campagne n'a encore été créée."}
        </EmptyState>
      )}
    </>
  );
}
