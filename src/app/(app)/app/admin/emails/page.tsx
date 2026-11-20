import type { Metadata } from "next";
import { IconHistory } from "@tabler/icons-react";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/PageHeader";
import { EmailComposer } from "@/components/app/admin/EmailComposer";
import { AUDIENCES, type Audience } from "@/lib/audiences";
import { formatDate } from "@/lib/campaigns";

export const metadata: Metadata = { title: "E-mails · Admin" };

export default async function AdminEmailsPage({ searchParams }: PageProps<"/app/admin/emails">) {
  await requireAdmin();
  const sp = await searchParams;
  const pre = typeof sp.a === "string" ? sp.a.split(",").filter(Boolean).slice(0, 500) : [];
  const [people, history] = await Promise.all([
    db.user.findMany({ where: { banned: { not: true }, emailVerified: true }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true, companyName: true }, take: 2000 }),
    db.adminEmail.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { sentBy: { select: { name: true } } } }),
  ]);

  return (
    <>
      <PageHeader eyebrow="Administration" title="E-mails" description="Écrivez à un compte, à une sélection ou à tous. Les variables personnalisent chaque envoi." />
      <div className="rise">
        <EmailComposer people={people} preselected={pre.filter((id) => people.some((p) => p.id === id))} />
      </div>

      <section className="rise mt-8" aria-label="Historique des envois">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-black tracking-[-0.02em]">
          <IconHistory size={20} /> Derniers envois
        </h2>
        {history.length ? (
          <ul className="grid gap-px overflow-hidden rounded-[24px] bg-border">
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-card px-4 py-3.5 sm:px-5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-bold">{h.subject}</div>
                  <div className="truncate text-[12.5px] text-muted-foreground">
                    {AUDIENCES[h.audience as Audience]?.label ?? h.audience} · par {h.sentBy.name} · {formatDate(h.createdAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <span className="text-sm font-bold tabular-nums">
                  {h.recipients - h.failed}/{h.recipients} envoyé{h.recipients > 1 ? "s" : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-[24px] bg-card px-4 py-10 text-center text-sm text-muted-foreground">Aucun e-mail envoyé pour l&apos;instant.</p>
        )}
      </section>
    </>
  );
}
