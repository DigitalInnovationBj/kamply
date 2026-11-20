"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { destroyAsset, isOwnAsset, signUpload, type UploadKind } from "@/lib/server/cloudinary";
import { SECTORS } from "@/lib/sectors";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string; fields?: Record<string, string>; code?: string };

async function currentUser() {
  const session = await getSession();
  if (!session) throw new Error("Session expirée. Reconnectez-vous.");
  return session.user;
}

/** Paramètres signés pour envoyer une image directement à Cloudinary. */
export async function getUploadSignature(kind: UploadKind): Promise<ActionResult<ReturnType<typeof signUpload>>> {
  try {
    const user = await currentUser();
    return { ok: true, data: signUpload(user.id, kind) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Envoi d'image indisponible." };
  }
}

const optionalUrl = z
  .string()
  .trim()
  .transform((v) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v))
  .refine((v) => !v || /^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(v), "Adresse web invalide (ex. monsite.com).")
  .optional();

const profileSchema = z.object({
  name: z.string().trim().min(3, "Indiquez votre nom complet.").max(80),
  companyName: z.string().trim().min(2, "Indiquez le nom de votre entreprise.").max(80),
  sector: z.enum(SECTORS, { message: "Choisissez votre secteur." }),
  website: optionalUrl,
  phone: z
    .string()
    .trim()
    .refine((v) => !v || /^\+?[0-9 ().-]{8,20}$/.test(v), "Numéro de téléphone invalide.")
    .optional(),
  image: z.object({ url: z.string().url(), publicId: z.string().min(1) }).nullable().optional(),
});

export type ProfileInput = z.input<typeof profileSchema>;

/** Enregistre le profil (onboarding et paramètres). */
export async function saveProfile(input: ProfileInput, { completeOnboarding = false } = {}): Promise<ActionResult> {
  let user;
  try {
    user = await currentUser();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= issue.message;
    return { ok: false, error: "Certains champs sont à corriger.", fields };
  }
  const v = parsed.data;

  const current = await db.user.findUnique({ where: { id: user.id }, select: { image: true, imagePublicId: true } });
  let image = current?.image ?? null;
  let imagePublicId = current?.imagePublicId ?? null;

  if (v.image === null) {
    await destroyAsset(imagePublicId);
    image = null;
    imagePublicId = null;
  } else if (v.image && v.image.publicId !== imagePublicId) {
    if (!isOwnAsset(user.id, "avatars", v.image.url, v.image.publicId)) return { ok: false, error: "Image refusée." };
    await destroyAsset(imagePublicId);
    image = v.image.url;
    imagePublicId = v.image.publicId;
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      name: v.name,
      companyName: v.companyName,
      sector: v.sector,
      website: v.website || null,
      phone: v.phone || null,
      image,
      imagePublicId,
      ...(completeOnboarding ? { onboardingCompleted: true } : {}),
    },
  });

  revalidatePath("/app", "layout");
  return { ok: true };
}

/** Supprime une image envoyée mais finalement abandonnée (annulation). */
export async function discardUpload(kind: UploadKind, publicId: string): Promise<ActionResult> {
  const user = await currentUser();
  if (!publicId.startsWith(`kamply/${kind}/${user.id}/`)) return { ok: false, error: "Image refusée." };
  const used = await db.user.findFirst({ where: { imagePublicId: publicId } });
  if (!used) await destroyAsset(publicId);
  return { ok: true };
}
