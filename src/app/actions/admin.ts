"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { reconcileTopup } from "@/lib/server/topups";
import { getSession } from "@/lib/session";
import type { ActionResult } from "./profile";

async function adminId() {
  const s = await getSession();
  if (!s || s.user.role !== "admin") throw new Error("Accès réservé aux administrateurs.");
  return s.user.id;
}

function guard<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  return fn().catch((e) => ({ ok: false as const, error: e instanceof Error ? e.message : "Erreur inattendue." }));
}

const STATUSES = ["DRAFT", "PENDING_REVIEW", "ACTIVE", "PAUSED", "ENDED", "REJECTED"] as const;

/** Change le statut d'une campagne. Un refus rembourse le mois payé. */
export async function setCampaignStatus(id: string, status: (typeof STATUSES)[number], note?: string): Promise<ActionResult> {
  return guard(async () => {
    const by = await adminId();
    if (!STATUSES.includes(status)) return { ok: false, error: "Statut inconnu." };
    await db.$transaction(async (tx) => {
      const c = await tx.campaign.findUniqueOrThrow({ where: { id } });
      await tx.campaign.update({
        where: { id },
        data: { status, adminNote: note?.trim() || null, ...(status === "ACTIVE" && !c.startedAt ? { startedAt: new Date() } : {}) },
      });
      // Refus d'une campagne payée : remboursement automatique du dernier paiement.
      if (status === "REJECTED" && c.status !== "REJECTED") {
        const paid = await tx.walletTransaction.findFirst({ where: { campaignId: id, type: "DEBIT", status: "COMPLETED" }, orderBy: { createdAt: "desc" } });
        const refunded = await tx.walletTransaction.findFirst({ where: { campaignId: id, type: "REFUND" } });
        if (paid && !refunded) {
          await tx.wallet.update({ where: { id: paid.walletId }, data: { balance: { increment: paid.amount } } });
          await tx.walletTransaction.create({
            data: { walletId: paid.walletId, type: "REFUND", status: "COMPLETED", amount: paid.amount, reference: `RFD-${paid.reference}`, label: `Remboursement · ${c.name}`, campaignId: id, processedById: by, processedAt: new Date() },
          });
        }
      }
    });
    revalidatePath("/app", "layout");
    return { ok: true };
  });
}

const statSchema = z.object({
  campaignId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide."),
  impressions: z.coerce.number().int().min(0),
  reach: z.coerce.number().int().min(0),
  clicks: z.coerce.number().int().min(0),
  conversions: z.coerce.number().int().min(0),
  spendEuros: z.coerce.number().min(0),
});

/** Saisie (ou correction) des statistiques d'une journée. */
export async function upsertStat(input: z.input<typeof statSchema>): Promise<ActionResult> {
  return guard(async () => {
    await adminId();
    const p = statSchema.safeParse(input);
    if (!p.success) {
      const fields: Record<string, string> = {};
      for (const i of p.error.issues) fields[String(i.path[0])] ??= i.message;
      return { ok: false, error: "Valeurs à corriger.", fields };
    }
    const v = p.data;
    if (v.clicks > v.impressions && v.impressions > 0) return { ok: false, error: "Les clics ne peuvent pas dépasser les impressions.", fields: { clicks: "Supérieur aux impressions." } };
    if (v.conversions > v.clicks && v.clicks > 0) return { ok: false, error: "Les conversions ne peuvent pas dépasser les clics.", fields: { conversions: "Supérieur aux clics." } };
    const date = new Date(`${v.date}T00:00:00.000Z`);
    if (date.getTime() > Date.now()) return { ok: false, error: "La date ne peut pas être dans le futur.", fields: { date: "Date future." } };
    const data = { impressions: v.impressions, reach: v.reach, clicks: v.clicks, conversions: v.conversions, spend: Math.round(v.spendEuros * 100) };
    await db.campaignStat.upsert({ where: { campaignId_date: { campaignId: v.campaignId, date } }, update: data, create: { campaignId: v.campaignId, date, ...data } });
    revalidatePath("/app", "layout");
    return { ok: true };
  });
}

export async function deleteStat(id: string): Promise<ActionResult> {
  return guard(async () => {
    await adminId();
    await db.campaignStat.delete({ where: { id } });
    revalidatePath("/app", "layout");
    return { ok: true };
  });
}

/** Valide ou refuse une recharge de portefeuille. */
export async function processTopup(id: string, decision: "approve" | "reject", note?: string): Promise<ActionResult> {
  return guard(async () => {
    const by = await adminId();
    const res = await db.$transaction(async (tx) => {
      const t = await tx.walletTransaction.findUnique({ where: { id } });
      if (!t || t.type !== "TOPUP" || t.status !== "PENDING") return { ok: false as const, error: "Cette recharge a déjà été traitée." };
      if (t.method === "CARD") return { ok: false as const, error: "Les paiements par carte sont crédités automatiquement après vérification." };
      await tx.walletTransaction.update({
        where: { id },
        data: { status: decision === "approve" ? "COMPLETED" : "REJECTED", processedById: by, processedAt: new Date(), note: note?.trim() || null },
      });
      if (decision === "approve") await tx.wallet.update({ where: { id: t.walletId }, data: { balance: { increment: t.amount } } });
      return { ok: true as const };
    });
    revalidatePath("/app", "layout");
    return res;
  });
}

export async function setUserRole(userId: string, role: "user" | "admin"): Promise<ActionResult> {
  return guard(async () => {
    const by = await adminId();
    if (userId === by && role !== "admin") return { ok: false, error: "Vous ne pouvez pas retirer votre propre rôle administrateur." };
    await db.user.update({ where: { id: userId }, data: { role } });
    revalidatePath("/app/admin", "layout");
    return { ok: true };
  });
}

/** Revérifie une recharge par carte auprès de GeniusPay. */
export async function recheckTopup(id: string): Promise<ActionResult<{ status: string }>> {
  return guard(async () => {
    await adminId();
    const status = await reconcileTopup(id);
    revalidatePath("/app/admin/recharges");
    return { ok: true, data: { status } };
  });
}
