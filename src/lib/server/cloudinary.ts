import "server-only";
import { v2 as cloudinary } from "cloudinary";

// Le SDK lit CLOUDINARY_URL (cloudinary://clé:secret@nom) dans l'environnement.
cloudinary.config({ secure: true });

export type UploadKind = "avatars" | "ads";

export function cloudinaryReady() {
  return !!process.env.CLOUDINARY_URL;
}

/** Paramètres signés pour un envoi direct navigateur → Cloudinary, limité au dossier de l'utilisateur. */
export function signUpload(userId: string, kind: UploadKind) {
  const cfg = cloudinary.config();
  if (!cfg.api_secret || !cfg.api_key || !cfg.cloud_name) throw new Error("Cloudinary n'est pas configuré.");
  const timestamp = Math.round(Date.now() / 1000);
  const folder = `kamply/${kind}/${userId}`;
  const params = { timestamp, folder };
  const signature = cloudinary.utils.api_sign_request(params, cfg.api_secret);
  return { timestamp, folder, signature, apiKey: cfg.api_key, cloudName: cfg.cloud_name };
}

/** Vérifie qu'une image envoyée appartient bien au dossier attendu et au bon compte Cloudinary. */
export function isOwnAsset(userId: string, kind: UploadKind, url: string, publicId: string) {
  const cloud = cloudinary.config().cloud_name;
  return publicId.startsWith(`kamply/${kind}/${userId}/`) && url.startsWith(`https://res.cloudinary.com/${cloud}/image/upload/`);
}

export async function destroyAsset(publicId?: string | null) {
  if (!publicId || !cloudinaryReady()) return;
  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (e) {
    console.error("[cloudinary] suppression impossible :", e);
  }
}
