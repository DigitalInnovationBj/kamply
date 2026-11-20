import type { ReactNode } from "react";

export function LegalDoc({ title, updated, sections }: { title: string; updated: string; sections: { h: string; body: ReactNode }[] }) {
  return (
    <article>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Mis à jour le {updated} · version provisoire</p>
      <h1 className="mt-3 text-[38px] font-black leading-[1] tracking-[-0.04em] sm:text-[52px]">{title}</h1>
      <div className="mt-10 grid gap-8">
        {sections.map((s, i) => (
          <section key={s.h}>
            <h2 className="text-[20px] font-black tracking-[-0.02em]">
              <span className="mr-2 tabular-nums text-primary">{String(i + 1).padStart(2, "0")}</span>
              {s.h}
            </h2>
            <div className="mt-2 grid gap-3 text-[16px] leading-relaxed text-[#3a3a37]">{s.body}</div>
          </section>
        ))}
      </div>
    </article>
  );
}
