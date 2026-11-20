import Image from "next/image";
import { avatarTone, avatarUrl, initials } from "@/lib/images";
import { cn } from "@/lib/utils";

/** Photo de profil, ou initiales du nom complet sur une pastille de couleur. */
export function UserAvatar({ name, image, size = 40, className }: { name: string; image?: string | null; size?: number; className?: string }) {
  const src = avatarUrl(image, Math.min(512, size * 2));
  if (src) {
    return (
      <span className={cn("avatar-initials relative", className)} style={{ width: size, height: size }}>
        <Image src={src} alt={name} fill sizes={`${size}px`} className="object-cover" />
      </span>
    );
  }
  const tone = avatarTone(name);
  return (
    <span
      className={cn("avatar-initials", className)}
      style={{ width: size, height: size, background: tone.bg, color: tone.fg, fontSize: Math.round(size * 0.38) }}
      aria-label={name}
      role="img"
    >
      {initials(name)}
    </span>
  );
}
