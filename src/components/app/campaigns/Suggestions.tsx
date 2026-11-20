"use client";

import { IconCheck, IconLoader2, IconRefresh, IconSparkles } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

/** Propositions de KAMPLY pour un champ : un clic applique, « Autre proposition » en demande de nouvelles. */
export function Suggestions({ items, current, onPick, onMore, loading, label = "Propositions KAMPLY" }: { items: string[]; current: string; onPick: (v: string) => void; onMore?: () => void; loading?: boolean; label?: string }) {
  if (!items.length) return null;
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="ai-tag">
          <IconSparkles size={12} /> {label}
        </span>
        {onMore && (
          <button type="button" onClick={onMore} disabled={loading} className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50">
            {loading ? <IconLoader2 size={14} className="animate-spin" /> : <IconRefresh size={14} />} Autre proposition
          </button>
        )}
      </div>
      <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
        {items.map((v) => {
          const on = v === current;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onPick(v)}
              aria-pressed={on}
              className={cn(
                "relative w-[240px] flex-none snap-start rounded-2xl px-3.5 py-3 text-left text-[13.5px] font-semibold leading-snug transition-all duration-300",
                on ? "bg-black text-[#f5f5f3]" : "bg-muted text-foreground hover:bg-[#dcdcd6]",
              )}
            >
              {on && (
                <span className="absolute right-2.5 top-2.5 grid size-5 place-items-center rounded-full bg-primary text-black" aria-hidden="true">
                  <IconCheck size={12} stroke={3} />
                </span>
              )}
              <span className={cn("block", on && "pr-6")}>{v}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
