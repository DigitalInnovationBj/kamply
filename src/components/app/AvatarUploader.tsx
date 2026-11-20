"use client";

import { useRef, useState, type DragEvent } from "react";
import { IconCamera, IconLoader2, IconPhotoUp, IconTrash } from "@tabler/icons-react";
import { getUploadSignature } from "@/app/actions/profile";
import { UserAvatar } from "./UserAvatar";
import { cn } from "@/lib/utils";

export type UploadedImage = { url: string; publicId: string };

const MAX = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

/** Envoi direct vers Cloudinary (signé côté serveur), avec progression. */
async function uploadToCloudinary(file: File, kind: "avatars" | "ads", onProgress: (p: number) => void): Promise<UploadedImage> {
  const sig = await getUploadSignature(kind);
  if (!sig.ok || !sig.data) throw new Error(sig.ok ? "Envoi indisponible." : sig.error);
  const { cloudName, apiKey, timestamp, signature, folder } = sig.data;

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", apiKey);
  body.append("timestamp", String(timestamp));
  body.append("signature", signature);
  body.append("folder", folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve({ url: res.secure_url, publicId: res.public_id });
        else reject(new Error(res?.error?.message ?? "Envoi refusé."));
      } catch {
        reject(new Error("Réponse inattendue du serveur d'images."));
      }
    };
    xhr.onerror = () => reject(new Error("Connexion impossible au serveur d'images."));
    xhr.send(body);
  });
}

export { uploadToCloudinary };

type Props = {
  name: string;
  value: UploadedImage | null;
  /** Image déjà enregistrée (affichée tant qu'aucune nouvelle n'est choisie). */
  current?: string | null;
  onChange: (img: UploadedImage | null) => void;
};

/**
 * Photo de profil : glisser-déposer, choix de fichier ou appareil photo sur mobile.
 * Sans photo, les initiales du nom complet s'affichent.
 */
export function AvatarUploader({ name, value, current, onChange }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  const shown = preview ?? value?.url ?? current ?? null;

  const handle = async (file?: File) => {
    if (!file) return;
    setError(null);
    if (!TYPES.includes(file.type) && !file.type.startsWith("image/")) return setError("Format non pris en charge : JPG, PNG ou WebP.");
    if (file.size > MAX) return setError("Image trop lourde : 5 Mo maximum.");
    const local = URL.createObjectURL(file);
    setPreview(local);
    setProgress(0);
    try {
      const img = await uploadToCloudinary(file, "avatars", setProgress);
      onChange(img);
    } catch (e) {
      setError((e as Error).message);
      setPreview(null);
    } finally {
      setProgress(null);
      URL.revokeObjectURL(local);
      setPreview(null);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    void handle(e.dataTransfer.files?.[0]);
  };

  const uploading = progress !== null;
  const ring = 2 * Math.PI * 52;

  return (
    <div className="grid gap-3">
      <div
        className={cn(
          "flex items-center gap-5 rounded-3xl bg-white p-4 shadow-[inset_0_0_0_1.5px_var(--input)] transition-shadow sm:p-5",
          drag && "shadow-[inset_0_0_0_2px_#ff5b23]",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
      >
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="group relative grid size-[104px] flex-none place-items-center rounded-full"
          aria-label="Choisir une photo de profil"
          disabled={uploading}
        >
          {shown ? (
            <span className="relative block size-[104px] overflow-hidden rounded-full">
              {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local (blob) ou URL Cloudinary */}
              <img src={shown.includes("res.cloudinary.com") ? shown.replace("/image/upload/", "/image/upload/c_fill,g_face,w_208,h_208,f_auto,q_auto/") : shown} alt="" className="size-full object-cover" />
            </span>
          ) : (
            <UserAvatar name={name || "?"} size={104} />
          )}
          <span className="absolute inset-0 grid place-items-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <IconCamera size={26} stroke={1.8} />
          </span>
          {uploading && (
            <svg className="absolute -inset-1 -rotate-90" viewBox="0 0 112 112" aria-hidden="true">
              <circle cx="56" cy="56" r="52" fill="none" stroke="#ebebe7" strokeWidth="4" />
              <circle cx="56" cy="56" r="52" fill="none" stroke="#ff5b23" strokeWidth="4" strokeLinecap="round" strokeDasharray={ring} strokeDashoffset={ring * (1 - (progress ?? 0))} style={{ transition: "stroke-dashoffset .2s" }} />
            </svg>
          )}
        </button>

        <div className="grid min-w-0 gap-2.5">
          <p className="text-[15px] font-bold leading-tight text-foreground">Photo de profil</p>
          <p className="text-[13px] leading-snug text-muted-foreground">
            {uploading ? `Envoi… ${Math.round((progress ?? 0) * 100)} %` : "JPG, PNG ou WebP, 5 Mo max. Sans photo, vos initiales s'affichent."}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={uploading}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-black px-3.5 text-[13px] font-bold text-[#f5f5f3] transition-colors hover:bg-primary hover:text-black disabled:opacity-50"
            >
              {uploading ? <IconLoader2 size={16} className="animate-spin" /> : <IconPhotoUp size={16} stroke={2.2} />} {shown ? "Changer" : "Ajouter"}
            </button>
            {(value || current) && !uploading && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <IconTrash size={16} stroke={2.2} /> Retirer
              </button>
            )}
          </div>
        </div>
        <input ref={input} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => void handle(e.target.files?.[0])} />
      </div>
      {error && (
        <p className="kf-msg" data-tone="error" role="alert" key={error}>
          {error}
        </p>
      )}
    </div>
  );
}
