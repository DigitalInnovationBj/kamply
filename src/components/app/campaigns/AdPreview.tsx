import { IconBrandGoogle, IconBrandMeta, IconPhoto, IconWorld } from "@tabler/icons-react";
import { adImageUrl, avatarTone, initials } from "@/lib/images";
import type { ChannelKey } from "@/lib/campaigns";

type Props = {
  channel: ChannelKey;
  company: string;
  headline: string;
  description: string;
  landingUrl: string;
  imageUrl?: string | null;
};

function host(url: string) {
  try {
    return new URL(/^https?:\/\//.test(url) ? url : `https://${url}`).host.replace(/^www\./, "");
  } catch {
    return url || "votresite.com";
  }
}

/** Aperçu réaliste de l'annonce, mis à jour à chaque saisie. */
export function AdPreview({ channel, company, headline, description, landingUrl, imageUrl }: Props) {
  const tone = avatarTone(company || "K");
  const img = adImageUrl(imageUrl, 600);
  const domain = host(landingUrl);

  if (channel === "GOOGLE") {
    return (
      <figure className="m-0 overflow-hidden rounded-[20px] bg-white text-[#0a0a0a] shadow-[0_24px_48px_-28px_rgba(0,0,0,.35)]" aria-label="Aperçu de l'annonce Google">
        {img && (
          // eslint-disable-next-line @next/next/no-img-element -- aperçu Cloudinary
          <img src={img} alt="" className="aspect-[16/9] w-full object-cover" />
        )}
        <div className="p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#5c5c58]">
            <span className="rounded bg-[#ebebe7] px-1.5 py-0.5 font-extrabold text-[#0a0a0a]">Sponsorisé</span>
            <span className="truncate">{domain}</span>
          </div>
          <p className="mt-2 text-[18px] font-bold leading-snug text-[#1a0dab]">{headline || "Votre titre d'annonce apparaît ici"}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-[#3a3a37]">{description || "Votre description : ce que vous proposez et pourquoi vous choisir."}</p>
        </div>
        <figcaption className="flex items-center gap-2 bg-black px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#18cccd]">
          <IconBrandGoogle size={14} /> Aperçu Google Search
        </figcaption>
      </figure>
    );
  }

  return (
    <figure className="m-0 overflow-hidden rounded-[20px] bg-white text-[#0a0a0a] shadow-[0_24px_48px_-28px_rgba(0,0,0,.35)]" aria-label="Aperçu de l'annonce Meta">
      <div className="flex items-center gap-2.5 p-3">
        <span className="grid size-9 place-items-center rounded-full text-xs font-black" style={{ background: tone.bg, color: tone.fg }}>
          {initials(company || "K")}
        </span>
        <div className="leading-tight">
          <div className="text-sm font-bold">{company || "Votre entreprise"}</div>
          <div className="text-xs text-[#5c5c58]">Sponsorisé</div>
        </div>
      </div>
      <p className="px-3 pb-2.5 text-sm leading-relaxed">{description || "Votre texte d'accroche apparaît ici."}</p>
      <div className="relative aspect-square bg-[#ebebe7]">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element -- aperçu Cloudinary
          <img src={img} alt="" className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-[#8a8a84]">
            <span className="grid justify-items-center gap-2 text-sm font-semibold">
              <IconPhoto size={34} stroke={1.6} /> Votre visuel
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 bg-[#f2f2ef] px-3 py-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1 truncate text-[11px] uppercase tracking-wide text-[#5c5c58]">
            <IconWorld size={12} /> {domain}
          </div>
          <div className="truncate text-sm font-bold">{headline || "Votre titre"}</div>
        </div>
        <span className="flex-none rounded-lg bg-[#dcdcd6] px-3 py-2 text-[13px] font-bold">En savoir plus</span>
      </div>
      <figcaption className="flex items-center gap-2 bg-black px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#18cccd]">
        <IconBrandMeta size={14} /> Aperçu Facebook & Instagram
      </figcaption>
    </figure>
  );
}
