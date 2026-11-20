"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { planById } from "@/lib/plans";
import { destroyAsset, isOwnAsset } from "@/lib/server/cloudinary";
import { formatEuros } from "@/lib/plans";
import type { ActionResult } from "./profile";

async function userId() {
  const s = await getSession();
  if (!s) throw new Error("Session expirée. Reconnectez-vous.");
  return s.user.id;
}

function ref(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

const url = z
  .string()
  .trim()
  .transform((v) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v))
  .refine((v) => /^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(v), "Adresse de destination invalide (ex. monsite.com/offre).");

const schema = z.object({
  name: z.string().trim().min(3, "Donnez un nom à votre campagne.").max(60),
  channel: z.enum(["GOOGLE", "META"]),
  objective: z.string().trim().min(3, "Choisissez un objectif."),
  location: z.string().trim().min(2, "Indiquez une ville ou une région."),
  radiusKm: z.coerce.number().int().min(0).max(500).optional(),
  audience: z.string().trim().max(200).optional(),
  keywords: z.array(z.string().trim().min(2).max(60)).max(30).default([]),
  headline: z.string().trim().min(10, "Le titre doit faire au moins 10 caractères.").max(60, "60 caractères maximum."),
  description: z.string().trim().min(20, "La description doit faire au moins 20 caractères.").max(160, "160 caractères maximum."),
  landingUrl: url,
  plan: z.enum(["STANDARD", "BASIC", "ESSENTIAL", "PREMIUM"]),
  image: z.object({ url: z.string().url(), publicId: z.string() }).nullable().optional(),
});

export type CampaignInput = z.input<typeof schema>;

/**
 * Crée la campagne. Si le solde couvre la formule, le mois est débité et la campagne part en validation ;
 * sinon elle est enregistrée en brouillon et l'utilisateur est invité à recharger.
 */
export async function createCampaign(input: CampaignInput): Promise<ActionResult<{ id: string; launched: boolean; missing?: number }>> {
  let uid: string;
  try {
    uid = await userId();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[String(i.path[0])] ??= i.message;
    return { ok: false, error: "Certaines informations sont à corriger.", fields };
  }
  const v = parsed.data;
  if (v.channel === "META" && !v.image) return { ok: false, error: "Ajoutez un visuel : il est obligatoire pour Meta Ads.", fields: { image: "Visuel obligatoire pour Meta Ads." } };
  if (v.channel === "GOOGLE" && v.keywords.length < 3) return { ok: false, error: "Ajoutez au moins 3 mots-clés.", fields: { keywords: "Au moins 3 mots-clés." } };
  if (v.image && !isOwnAsset(uid, "ads", v.image.url, v.image.publicId)) return { ok: false, error: "Visuel refusé." };

  const plan = planById(v.plan);

  const result = await db.$transaction(async (tx) => {
    const wallet = await tx.wallet.upsert({ where: { userId: uid }, update: {}, create: { userId: uid } });
    const canPay = wallet.balance >= plan.price;
    const campaign = await tx.campaign.create({
      data: {
        userId: uid,
        name: v.name,
        channel: v.channel,
        objective: v.objective,
        location: v.location,
        radiusKm: v.radiusKm ?? null,
        audience: v.audience || null,
        keywords: v.keywords,
        headline: v.headline,
        description: v.description,
        landingUrl: v.landingUrl,
        plan: v.plan,
        monthlyPrice: plan.price,
        imageUrl: v.image?.url ?? null,
        imagePublicId: v.image?.publicId ?? null,
        status: canPay ? "PENDING_REVIEW" : "DRAFT",
      },
    });
    if (canPay) {
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: plan.price } } });
      await tx.walletTransaction.create({
        data: { walletId: wallet.id, type: "DEBIT", status: "COMPLETED", amount: plan.price, reference: ref("PAY"), label: `${plan.name} · ${v.name}`, campaignId: campaign.id, processedAt: new Date() },
      });
    }
    return { id: campaign.id, launched: canPay, missing: canPay ? undefined : plan.price - wallet.balance };
  });

  revalidatePath("/app", "layout");
  return { ok: true, data: result };
}

/** Lance un brouillon une fois le portefeuille rechargé. */
export async function launchDraft(id: string): Promise<ActionResult<{ missing?: number }>> {
  const uid = await userId();
  const res = await db.$transaction(async (tx) => {
    const c = await tx.campaign.findFirst({ where: { id, userId: uid } });
    if (!c || c.status !== "DRAFT") return { ok: false as const, error: "Cette campagne ne peut pas être lancée." };
    const wallet = await tx.wallet.upsert({ where: { userId: uid }, update: {}, create: { userId: uid } });
    if (wallet.balance < c.monthlyPrice) return { ok: false as const, error: `Solde insuffisant : il manque ${formatEuros(c.monthlyPrice - wallet.balance, { decimals: true })}.`, missing: c.monthlyPrice - wallet.balance };
    await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: c.monthlyPrice } } });
    await tx.walletTransaction.create({
      data: { walletId: wallet.id, type: "DEBIT", status: "COMPLETED", amount: c.monthlyPrice, reference: ref("PAY"), label: `${planById(c.plan).name} · ${c.name}`, campaignId: c.id, processedAt: new Date() },
    });
    await tx.campaign.update({ where: { id }, data: { status: "PENDING_REVIEW" } });
    return { ok: true as const };
  });
  revalidatePath("/app", "layout");
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

/** Pause / reprise par l'utilisateur. */
export async function toggleCampaign(id: string): Promise<ActionResult<{ status: string }>> {
  const uid = await userId();
  const c = await db.campaign.findFirst({ where: { id, userId: uid } });
  if (!c) return { ok: false, error: "Campagne introuvable." };
  if (c.status !== "ACTIVE" && c.status !== "PAUSED") return { ok: false, error: "Seule une campagne en direct ou en pause peut être modifiée." };
  const status = c.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
  await db.campaign.update({ where: { id }, data: { status } });
  revalidatePath("/app", "layout");
  return { ok: true, data: { status } };
}

/** Suppression d'un brouillon (jamais payé). */
export async function deleteDraft(id: string): Promise<ActionResult> {
  const uid = await userId();
  const c = await db.campaign.findFirst({ where: { id, userId: uid } });
  if (!c) return { ok: false, error: "Campagne introuvable." };
  if (c.status !== "DRAFT" && c.status !== "REJECTED") return { ok: false, error: "Seuls les brouillons et les campagnes refusées peuvent être supprimés." };
  await db.campaign.delete({ where: { id } });
  await destroyAsset(c.imagePublicId);
  revalidatePath("/app", "layout");
  return { ok: true };
}
