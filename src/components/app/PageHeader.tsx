import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="rise mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</p>}
        <h1 className="mt-2 text-[30px] font-black leading-[1.02] tracking-[-0.035em] sm:text-[38px]">{title}</h1>
        {description && <div className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted-foreground">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Bouton lien principal de l'application (pilule orange, flèche qui pivote au survol). */
export function PrimaryLink({ href, children, variant = "brand" }: { href: string; children: ReactNode; variant?: "brand" | "dark" | "ghost" }) {
  const cls = {
    brand: "bg-primary text-black hover:bg-black hover:text-[#f5f5f3]",
    dark: "bg-black text-[#f5f5f3] hover:bg-primary hover:text-black",
    ghost: "bg-card text-foreground shadow-[inset_0_0_0_1.5px_var(--border)] hover:bg-muted",
  }[variant];
  return (
    <Link href={href} className={`group inline-flex h-12 items-center gap-2 rounded-full px-5 text-[15px] font-bold no-underline transition-colors duration-300 ${cls}`}>
      {children}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-500 ease-[cubic-bezier(.76,0,.24,1)] group-hover:-rotate-45" aria-hidden="true">
        <path d="M5 12h14M13 18l6-6M13 6l6 6" />
      </svg>
    </Link>
  );
}

export function EmptyState({ icon, title, children, action }: { icon: ReactNode; title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="rise grid place-items-center rounded-[24px] bg-card px-6 py-14 text-center">
      <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-black text-primary" aria-hidden="true">
        {icon}
      </span>
      <h2 className="text-xl font-black tracking-[-0.02em]">{title}</h2>
      <div className="mt-2 max-w-sm text-[15px] leading-relaxed text-muted-foreground">{children}</div>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
