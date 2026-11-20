"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { SITE } from "@/lib/site";
import { sendBatch, sendEmail } from "@/lib/server/email";
import { AccountStatusEmail } from "@/emails/AccountStatusEmail";
import { CustomEmail } from "@/emails/CustomEmail";
import type { ActionResult } from "./profile";
import type { Audience } from "@/lib/audiences";

const appUrl = () => process.env.BETTER_AUTH_URL ?? SITE.url;

async function requireAdminId() {
  const s = await getSession();
  if (!s || s.user.role !== "admin") throw new Error("Accès réservé aux administrateurs.");
  return s.user.id;
}

function guard<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  return fn().catch((e) => ({ ok: false as const, error: e instanceof Error ? e.message : "Erreur inattendue." }));
}

const banSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().trim().min(5, "Indiquez un motif (5 caractères minimum).").max(500),
  days: z.number().int().min(1).max(3650).nullable(),
  notify: z.boolean(),
});

/** Suspend un compte : sessions révoquées, campagnes en direct mises en pause, e-mail facultatif. */
export async function banAccount(input: z.input<typeof banSchema>): Promise<ActionResult<{ emailed: boolean }>> {
  return guard(async () => {
    const by = await requireAdminId();
    const p = banSchema.safeParse(input);
    if (!p.success) return { ok: false, error: p.error.issues[0].message, fields: { reason: p.error.issues[0].message } };
    const { userId, reason, days, notify } = p.data;
    if (userId === by) return { ok: false, error: "Vous ne pouvez pas suspendre votre propre compte." };
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return { ok: false, error: "Compte introuvable." };
    if (user.role === "admin") return { ok: false, error: "Retirez d'abord le rôle administrateur de ce compte." };

    await auth.api.banUser({ headers: await headers(), body: { userId, banReason: reason, banExpiresIn: days ? days * 86400 : undefined } });
    await db.campaign.updateMany({ where: { userId, status: "ACTIVE" }, data: { status: "PAUSED", adminNote: "Compte suspendu : diffusion interrompue." } });

    let emailed = false;
    if (notify) {
      const until = days ? new Date(Date.now() + days * 86400_000).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : null;
      const r = await sendEmail({ to: user.email, subject: "Votre compte KAMPLY est suspendu", react: AccountStatusEmail({ name: user.name, banned: true, reason, until, url: appUrl() }) });
      emailed = r.ok;
    }
    revalidatePath("/app/admin", "layout");
    return { ok: true, data: { emailed } };
  });
}

/** Réactive un compte suspendu. */
export async function unbanAccount(userId: string, notify: boolean): Promise<ActionResult<{ emailed: boolean }>> {
  return guard(async () => {
    await requireAdminId();
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return { ok: false, error: "Compte introuvable." };
    await auth.api.unbanUser({ headers: await headers(), body: { userId } });
    let emailed = false;
    if (notify) {
      const r = await sendEmail({ to: user.email, subject: "Votre compte KAMPLY est réactivé", react: AccountStatusEmail({ name: user.name, banned: false, url: `${appUrl()}/connexion` }) });
      emailed = r.ok;
    }
    revalidatePath("/app/admin", "layout");
    return { ok: true, data: { emailed } };
  });
}


const mailSchema = z.object({
  audience: z.enum(["all", "live", "none", "selected"]),
  userIds: z.array(z.string()).max(1000).default([]),
  subject: z.string().trim().min(3, "Objet trop court.").max(120, "Objet trop long (120 caractères max)."),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  body: z.string().trim().min(10, "Message trop court.").max(5000, "Message trop long."),
  ctaLabel: z.string().trim().max(40).optional().or(z.literal("")),
  ctaUrl: z.string().trim().url("Lien invalide (https://…).").optional().or(z.literal("")),
});

function recipientsWhere(audience: Audience, userIds: string[]) {
  const active = { banned: { not: true }, emailVerified: true };
  if (audience === "selected") return { id: { in: userIds }, ...active };
  if (audience === "live") return { ...active, campaigns: { some: { status: "ACTIVE" as const } } };
  if (audience === "none") return { ...active, campaigns: { none: {} } };
  return active;
}

/** Nombre de destinataires pour un public donné (affiché avant l'envoi). */
export async function countRecipients(audience: Audience, userIds: string[] = []): Promise<number> {
  await requireAdminId();
  return db.user.count({ where: recipientsWhere(audience, userIds) });
}

/** Remplace {prenom}, {nom}, {entreprise}, {email} par les valeurs de chaque destinataire. */
function personalize(text: string, u: { name: string; email: string; companyName: string | null }) {
  const first = u.name.split(" ")[0] || u.name;
  return text
    .replaceAll("{prenom}", first)
    .replaceAll("{nom}", u.name)
    .replaceAll("{entreprise}", u.companyName || u.name)
    .replaceAll("{email}", u.email);
}

/** Envoie un e-mail personnalisé à un, plusieurs ou tous les utilisateurs. */
export async function sendAdminEmail(input: z.input<typeof mailSchema>): Promise<ActionResult<{ sent: number; failed: number }>> {
  return guard(async () => {
    const by = await requireAdminId();
    const p = mailSchema.safeParse(input);
    if (!p.success) {
      const fields: Record<string, string> = {};
      for (const i of p.error.issues) fields[String(i.path[0])] ??= i.message;
      return { ok: false, error: "Vérifiez le message.", fields };
    }
    const m = p.data;
    if (m.audience === "selected" && !m.userIds.length) return { ok: false, error: "Sélectionnez au moins un destinataire." };
    const users = await db.user.findMany({ where: recipientsWhere(m.audience, m.userIds), select: { email: true, name: true, companyName: true } });
    if (!users.length) return { ok: false, error: "Aucun destinataire pour ce public." };

    const { sent, failed } = await sendBatch(
      users.map((u) => ({
        to: u.email,
        subject: personalize(m.subject, u),
        react: CustomEmail({
          title: m.title ? personalize(m.title, u) : undefined,
          body: personalize(m.body, u),
          ctaLabel: m.ctaLabel || undefined,
          ctaUrl: m.ctaUrl || undefined,
        }),
      })),
    );
    await db.adminEmail.create({
      data: { subject: m.subject, title: m.title || null, body: m.body, ctaLabel: m.ctaLabel || null, ctaUrl: m.ctaUrl || null, audience: m.audience, recipients: users.length, failed: failed.length, sentById: by },
    });
    revalidatePath("/app/admin/emails");
    if (!sent) return { ok: false, error: "Aucun e-mail n'a pu être envoyé. Vérifiez la configuration de Resend." };
    return { ok: true, data: { sent, failed: failed.length } };
  });
}
