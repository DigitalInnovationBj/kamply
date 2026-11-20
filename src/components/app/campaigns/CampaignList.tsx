"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { IconBrandGoogle, IconBrandMeta, IconChevronRight, IconMapPin } from "@tabler/icons-react";
import { StatusBadge } from "@/components/app/StatusBadge";
import { CHANNELS, STATUS, formatDate, type CampaignStatusKey, type ChannelKey } from "@/lib/campaigns";
import { formatEuros, planById } from "@/lib/plans";
import { adImageUrl } from "@/lib/images";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  name: string;
  channel: ChannelKey;
  status: CampaignStatusKey;
  plan: string;
  monthlyPrice: number;
  location: string;
  createdAt: string;
  imageUrl: string | null;
};

const FILTERS: { id: string; label: string; match: (s: CampaignStatusKey) => boolean }[] = [
  { id: "all", label: "Toutes", match: () => true },
  { id: "live", label: "En direct", match: (s) => s === "ACTIVE" },
  { id: "review", label: "En validation", match: (s) => s === "PENDING_REVIEW" },
  { id: "draft", label: "Brouillons", match: (s) => s === "DRAFT" || s === "REJECTED" },
  { id: "done", label: "En pause / terminées", match: (s) => s === "PAUSED" || s === "ENDED" },
];

export function CampaignList({ campaigns }: { campaigns: Row[] }) {
  const [filter, setFilter] = useState("all");
  const list = useMemo(() => campaigns.filter((c) => FILTERS.find((f) => f.id === filter)!.match(c.status)), [campaigns, filter]);

  return (
    <div className="rise grid gap-4" style={{ animationDelay: ".05s" }}>
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Filtrer les campagnes">
        {FILTERS.map((f) => {
          const n = campaigns.filter((c) => f.match(c.status)).length;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "inline-flex h-10 flex-none items-center gap-2 rounded-full px-4 text-sm font-bold transition-colors",
                filter === f.id ? "bg-black text-[#f5f5f3]" : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
              <span className={cn("rounded-full px-1.5 text-xs tabular-nums", filter === f.id ? "bg-white/15" : "bg-muted")}>{n}</span>
            </button>
          );
        })}
      </div>

      {list.length ? (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => {
            const img = adImageUrl(c.imageUrl, 160);
            return (
              <li key={c.id}>
                <Link
                  href={`/app/campagnes/${c.id}`}
                  className="group flex h-full flex-col gap-4 rounded-[24px] bg-card p-4 no-underline transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-1 hover:shadow-[0_24px_40px_-24px_rgba(0,0,0,.35)] sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    <span className="relative grid size-14 flex-none place-items-center overflow-hidden rounded-2xl bg-black text-[#f5f5f3]">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element -- miniature Cloudinary déjà optimisée
                        <img src={img} alt="" className="size-full object-cover" />
                      ) : c.channel === "GOOGLE" ? (
                        <IconBrandGoogle size={24} stroke={2} />
                      ) : (
                        <IconBrandMeta size={24} stroke={2} />
                      )}
                    </span>
                    <span className="grid min-w-0 flex-1 gap-0.5">
                      <span className="truncate text-[16px] font-black tracking-[-0.01em] text-foreground">{c.name}</span>
                      <span className="truncate text-[13px] text-muted-foreground">
                        {CHANNELS[c.channel].label} · {planById(c.plan).name}
                      </span>
                    </span>
                    <IconChevronRight size={20} className="mt-1 flex-none text-muted-foreground transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                    <StatusBadge status={c.status} />
                    <span className="inline-flex items-center gap-1 text-[13px] text-muted-foreground">
                      <IconMapPin size={15} /> {c.location}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3 text-[13px]">
                    <span className="text-muted-foreground">Créée le {formatDate(c.createdAt)}</span>
                    <span className="font-bold tabular-nums">{formatEuros(c.monthlyPrice)} / mois</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-[24px] bg-card px-5 py-10 text-center text-sm text-muted-foreground">
          Aucune campagne « {FILTERS.find((f) => f.id === filter)!.label.toLowerCase()} ». {filter === "review" && STATUS.PENDING_REVIEW.hint}
        </p>
      )}
    </div>
  );
}
