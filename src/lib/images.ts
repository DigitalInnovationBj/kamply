/** Ajoute une transformation Cloudinary (recadrage carré centré sur le visage, format et qualité auto). */
export function avatarUrl(url: string | null | undefined, size = 256) {
  if (!url) return null;
  if (!url.includes("res.cloudinary.com")) return url;
  return url.replace("/image/upload/", `/image/upload/c_fill,g_face,w_${size},h_${size},f_auto,q_auto/`);
}

export function adImageUrl(url: string | null | undefined, width = 800) {
  if (!url) return null;
  if (!url.includes("res.cloudinary.com")) return url;
  return url.replace("/image/upload/", `/image/upload/c_fill,g_auto,w_${width},h_${width},f_auto,q_auto/`);
}

/** Initiales du nom complet : « Camille Martin » → « CM ». */
export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : parts[0][1] ?? "";
  return (first + last).toUpperCase();
}

const AVATAR_TONES = [
  { bg: "#ff5b23", fg: "#000000" },
  { bg: "#18cccd", fg: "#000000" },
  { bg: "#000000", fg: "#ff5b23" },
  { bg: "#000000", fg: "#18cccd" },
  { bg: "#0a0a0a", fg: "#f5f5f3" },
];

/** Couleur stable dérivée du nom, dans la palette KAMPLY. */
export function avatarTone(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}
