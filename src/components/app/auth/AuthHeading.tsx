import type { ReactNode } from "react";

export function AuthHeading({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="rise mb-8">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</p>
      <h1 className="mt-3 text-[34px] font-black leading-[1.02] tracking-[-0.035em] text-foreground sm:text-[40px]">{title}</h1>
      {children && <div className="mt-3 text-[15.5px] leading-relaxed text-muted-foreground">{children}</div>}
    </div>
  );
}
