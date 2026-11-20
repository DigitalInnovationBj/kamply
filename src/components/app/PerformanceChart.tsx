"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { IconChartAreaLine } from "@tabler/icons-react";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import type { DayPoint } from "@/lib/server/queries";
import { cn } from "@/lib/utils";

const METRICS = {
  clicks: { label: "Clics", unit: "", color: "#ff5b23", desc: "Nombre de personnes ayant cliqué sur l'annonce" },
  reach: { label: "Personnes touchées", unit: "", color: "#18cccd", desc: "Personnes différentes ayant vu l'annonce" },
  conversions: { label: "Conversions", unit: "", color: "#0a0a0a", desc: "Appels, formulaires, messages ou ventes" },
  spend: { label: "Dépense", unit: "€", color: "#bf3d0c", desc: "Budget publicitaire dépensé, en euros" },
} as const;

type MetricKey = keyof typeof METRICS;

const nf = new Intl.NumberFormat("fr-FR");
const fmtVal = (k: MetricKey, v: number) => (k === "spend" ? `${nf.format(Math.round(v / 100))} €` : nf.format(v));
const fmtDay = (iso: string, long = false) =>
  new Intl.DateTimeFormat("fr-FR", long ? { weekday: "long", day: "numeric", month: "long" } : { day: "numeric", month: "short" }).format(new Date(`${iso}T12:00:00Z`));

/**
 * Graphique de performance sur 30 jours : une métrique à la fois, axes nommés,
 * valeurs en clair dans l'infobulle, total de la période au-dessus.
 */
export function PerformanceChart({ series, hasData, title = "Performance sur 30 jours" }: { series: DayPoint[]; hasData: boolean; title?: string }) {
  const [metric, setMetric] = useState<MetricKey>("clicks");
  const m = METRICS[metric];
  const total = useMemo(() => series.reduce((s, p) => s + p[metric], 0), [series, metric]);
  const config = { [metric]: { label: m.label, color: m.color } } satisfies ChartConfig;
  const data = useMemo(() => series.map((p) => ({ ...p, spendEuros: p.spend / 100 })), [series]);
  const key = metric === "spend" ? "spendEuros" : metric;

  return (
    <section className="rounded-[24px] bg-card p-4 sm:p-6" aria-label={title}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-black tracking-[-0.02em]">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{m.desc}.</p>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Total {m.label.toLowerCase()}</div>
          <div className="text-[28px] font-black leading-tight tracking-[-0.04em] tabular-nums">{fmtVal(metric, total)}</div>
        </div>
      </div>

      <div className="-mx-1 mt-4 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Choisir la métrique">
        {(Object.keys(METRICS) as MetricKey[]).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={metric === k}
            onClick={() => setMetric(k)}
            className={cn(
              "inline-flex h-9 flex-none items-center gap-2 rounded-full px-3.5 text-[13px] font-bold transition-colors",
              metric === k ? "bg-black text-[#f5f5f3]" : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="size-2 rounded-full" style={{ background: METRICS[k].color }} aria-hidden="true" />
            {METRICS[k].label}
          </button>
        ))}
      </div>

      <div className="relative mt-4">
        <ChartContainer config={config} className="aspect-auto h-[240px] w-full sm:h-[280px]">
          <AreaChart data={data} margin={{ left: 4, right: 8, top: 12, bottom: 0 }}>
            <defs>
              <linearGradient id={`fill-${metric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={m.color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={m.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#ebebe7" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              minTickGap={28}
              tickFormatter={(v) => fmtDay(v)}
              tick={{ fill: "#5c5c58", fontSize: 12, fontWeight: 600 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={44}
              allowDecimals={false}
              tickFormatter={(v) => (metric === "spend" ? `${nf.format(v)} €` : nf.format(v))}
              tick={{ fill: "#5c5c58", fontSize: 12, fontWeight: 600 }}
            />
            <ChartTooltip
              cursor={{ stroke: "#0a0a0a", strokeWidth: 1, strokeDasharray: "4 4" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as DayPoint;
                return (
                  <div className="rounded-2xl bg-black px-3.5 py-3 text-[#f5f5f3] shadow-xl">
                    <div className="text-xs font-semibold capitalize text-[#a3a3a0]">{fmtDay(p.date, true)}</div>
                    <div className="mt-1 flex items-center gap-2 text-sm font-bold">
                      <span className="size-2.5 rounded-full" style={{ background: m.color === "#0a0a0a" ? "#f5f5f3" : m.color }} />
                      {m.label} : <span className="tabular-nums">{fmtVal(metric, p[metric])}</span>
                    </div>
                    <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] text-[#a3a3a0]">
                      {(Object.keys(METRICS) as MetricKey[])
                        .filter((k) => k !== metric)
                        .map((k) => (
                          <span key={k}>
                            {METRICS[k].label} : <b className="text-[#f5f5f3] tabular-nums">{fmtVal(k, p[k])}</b>
                          </span>
                        ))}
                    </div>
                  </div>
                );
              }}
            />
            <Area
              dataKey={key}
              type="monotone"
              stroke={m.color}
              strokeWidth={2.5}
              fill={`url(#fill-${metric})`}
              activeDot={{ r: 5, strokeWidth: 3, stroke: "#fff", fill: m.color }}
              animationDuration={700}
            />
          </AreaChart>
        </ChartContainer>

        {!hasData && (
          <div className="absolute inset-0 grid place-items-center rounded-2xl bg-card/85 backdrop-blur-[2px]">
            <div className="max-w-xs text-center">
              <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-muted" aria-hidden="true">
                <IconChartAreaLine size={24} stroke={1.8} />
              </span>
              <p className="font-bold">Pas encore de données</p>
              <p className="mt-1 text-sm text-muted-foreground">Les résultats apparaissent ici dès que votre campagne est diffusée. Ils sont mis à jour chaque jour.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
