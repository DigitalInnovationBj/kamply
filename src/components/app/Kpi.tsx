import type { ReactNode } from "react";
import { IconArrowDownRight, IconArrowUpRight, IconMinus } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

/** Variation en % entre deux périodes (null si pas de base de comparaison). */
export function delta(current: number, previous: number) {
  if (!previous) return current ? null : 0;
  return ((current - previous) / previous) * 100;
}

type Props = {
  label: string;
  value: string;
  icon: ReactNode;
  change?: number | null;
  hint?: string;
  tone?: "default" | "signal" | "dark" | "brand";
  className?: string;
};

/** Carte de chiffre clé : un seul gros chiffre, une variation explicite. */
export function Kpi({ label, value, icon, change, hint, tone = "default", className }: Props) {
  const up = change != null && change > 0.5;
  const down = change != null && change < -0.5;
  const toneCls = {
    default: "bg-card text-foreground",
    signal: "bg-[#18cccd] text-black",
    dark: "bg-black text-[#f5f5f3]",
    brand: "bg-primary text-black",
  }[tone];
  const sub = tone === "dark" ? "text-[#a3a3a0]" : tone === "default" ? "text-muted-foreground" : "text-black/70";

  return (
    <div className={cn("flex min-h-[148px] flex-col justify-between gap-5 rounded-[24px] p-5 transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-1", toneCls, className)}>
      <div className="flex items-center justify-between gap-3">
        <span className={cn("text-[11px] font-bold uppercase tracking-[0.14em]", sub)}>{label}</span>
        <span className={cn("grid size-9 place-items-center rounded-xl", tone === "default" ? "bg-muted text-foreground" : tone === "dark" ? "bg-white/10" : "bg-black/10")} aria-hidden="true">
          {icon}
        </span>
      </div>
      <div>
        <div className="text-[clamp(30px,4vw,40px)] font-black leading-none tracking-[-0.04em] tabular-nums">{value}</div>
        <div className={cn("mt-2 flex items-center gap-1 text-[13px] font-bold", sub)}>
          {change === undefined ? (
            <span>{hint}</span>
          ) : change === null ? (
            <span>Nouveau sur la période</span>
          ) : (
            <>
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5",
                  up && (tone === "default" ? "bg-[#18cccd]/25 text-[#08787a]" : "bg-black/15"),
                  down && (tone === "default" ? "bg-destructive/10 text-destructive" : "bg-black/15"),
                )}
              >
                {up ? <IconArrowUpRight size={14} stroke={2.6} /> : down ? <IconArrowDownRight size={14} stroke={2.6} /> : <IconMinus size={14} stroke={2.6} />}
                {Math.abs(change).toFixed(change !== 0 && Math.abs(change) < 10 ? 1 : 0).replace(".", ",")} %
              </span>
              <span>vs 30 jours précédents</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
