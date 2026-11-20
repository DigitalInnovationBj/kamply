"use server";

import { v2 as cloudinary } from "cloudinary";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { aiMock, aiReady, digestContext, draftFromSite, moreVariants, type CampaignDraft, type VariantField } from "@/lib/server/ai";
import { readSite, SiteReadError, type SiteDigest } from "@/lib/server/site-reader";
import { cloudinaryReady } from "@/lib/server/cloudinary";
import type { UploadedImage } from "@/components/app/AvatarUploader";
import type { ActionResult } from "./profile";

const DAILY_ANALYSES = 10;
const MOCK_IMAGES = [
  "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800",
  "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800",
  "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=800",
];
const DAILY_VARIANTS = 60;

async function userOrThrow() {
  const s = await getSession();
  if (!s) throw new Error("Session expirée. Reconnectez-vous.");
  return s.user;
}

async function quota(userId: string, kind: string, max: number) {
  const n = await db.aiRun.count({ where: { userId, kind, createdAt: { gte: new Date(Date.now() - 86400_000) } } });
  return n < max;
}

export type Analysis = {
  draft: CampaignDraft;
  context: string;
  images: string[];
  host: string | null;
  phone: string | null;
  source: "site" | "description";
};

/** Lit le site (ou la description fournie) et prépare un brouillon complet de campagne. */
export async function analyzeSite(input: { url?: string; description?: string }): Promise<ActionResult<Analysis>> {
  try {
    const user = await userOrThrow();
    if (!aiReady()) return { ok: false, code: "AI_NOT_CONFIGURED", error: "La génération automatique n'est pas encore activée. Vous pouvez remplir votre campagne vous-même." };
    if (!(await quota(user.id, "analyze", DAILY_ANALYSES))) return { ok: false, code: "QUOTA", error: `Limite de ${DAILY_ANALYSES} analyses par jour atteinte. Réessayez demain ou continuez manuellement.` };

    const description = z.string().trim().max(600).optional().parse(input.description);
    let digest: SiteDigest;
    let source: Analysis["source"] = "site";
    if (input.url?.trim() && !description) {
      try {
        digest = await readSite(input.url);
      } catch (e) {
        if (aiMock()) digest = { url: input.url, host: input.url.replace(/^https?:\/\//, "").split("/")[0], lang: "fr", siteName: null, title: null, description: null, headings: [], text: "", phones: [], address: null, city: null, priceHints: [], images: MOCK_IMAGES, pages: [] };
        else if (e instanceof SiteReadError) return { ok: false, code: `SITE_${e.code}`, error: e.message };
        else throw e;
      }
    } else {
      if (!description || description.length < 20) return { ok: false, code: "DESCRIPTION", error: "Décrivez votre activité en une ou deux phrases (20 caractères minimum)." };
      source = "description";
      digest = { url: input.url?.trim() || "", host: "", lang: "fr", siteName: user.companyName ?? null, title: null, description, headings: [], text: description, phones: user.phone ? [user.phone] : [], address: null, city: null, priceHints: [], images: [], pages: [] };
    }

    let draft: CampaignDraft;
    try {
      draft = await draftFromSite(digest, user.companyName);
    } catch (e) {
      console.error("[ai] génération impossible :", e);
      await db.aiRun.create({ data: { userId: user.id, kind: "analyze", url: digest.url || null, ok: false } });
      return { ok: false, code: "AI_FAILED", error: "La rédaction automatique a échoué. Réessayez dans un instant." };
    }
    await db.aiRun.create({ data: { userId: user.id, kind: "analyze", url: digest.url || null } });
    return { ok: true, data: { draft, context: digestContext(digest, draft), images: digest.images, host: digest.host || null, phone: digest.phones[0] ?? null, source } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

/** Nouvelles propositions pour un champ (titre, description, mots-clés, centres d'intérêt). */
export async function regenerate(input: { context: string; field: VariantField; channel: "GOOGLE" | "META"; avoid: string[] }): Promise<ActionResult<string[]>> {
  try {
    const user = await userOrThrow();
    if (!aiReady()) return { ok: false, code: "AI_NOT_CONFIGURED", error: "Génération automatique indisponible." };
    if (!(await quota(user.id, "variant", DAILY_VARIANTS))) return { ok: false, code: "QUOTA", error: "Limite quotidienne de propositions atteinte." };
    const p = z
      .object({ context: z.string().max(8000), field: z.enum(["headline", "description", "keywords", "interests"]), channel: z.enum(["GOOGLE", "META"]), avoid: z.array(z.string().max(200)).max(40) })
      .parse(input);
    const items = await moreVariants(p.context, p.field, p.channel, p.avoid);
    await db.aiRun.create({ data: { userId: user.id, kind: "variant" } });
    return { ok: true, data: items };
  } catch (e) {
    console.error("[ai] variantes :", e);
    return { ok: false, error: "Impossible de proposer autre chose pour le moment." };
  }
}

/** Importe une image du site du client dans son dossier Cloudinary. */
export async function importSiteImage(url: string): Promise<ActionResult<UploadedImage>> {
  try {
    const user = await userOrThrow();
    if (!cloudinaryReady()) return { ok: false, error: "Stockage d'images non configuré." };
    const u = new URL(url);
    if (!["http:", "https:"].includes(u.protocol)) return { ok: false, error: "Image invalide." };
    const r = await cloudinary.uploader.upload(u.href, { folder: `kamply/ads/${user.id}`, resource_type: "image", transformation: [{ width: 1600, height: 1600, crop: "limit" }] });
    return { ok: true, data: { url: r.secure_url, publicId: r.public_id } };
  } catch (e) {
    console.error("[ai] import d'image :", e);
    return { ok: false, error: "Cette image n'a pas pu être importée. Choisissez-en une autre ou envoyez la vôtre." };
  }
}
