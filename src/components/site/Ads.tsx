import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { IconBrandGoogle, IconBrandMeta, IconSparkles } from "@tabler/icons-react";

export const FLOWERS = {
  pinkWhite: "https://images.unsplash.com/photo-1598961111901-e64e25bc0a4c",
  whitePink: "https://images.unsplash.com/photo-1629833790673-e9d1b342a816",
  purple: "https://images.unsplash.com/photo-1767866443531-28c3539b8223",
} as const;

export const PHOTOS = {
  gym: "https://images.unsplash.com/photo-1639660299469-9e9279364c97",
  coffee: "https://images.unsplash.com/photo-1485808191679-5f86510681a2",
  earrings: "https://images.unsplash.com/photo-1619203451989-53f6d2ca0e57",
  pearls: "https://images.unsplash.com/photo-1654699991520-aaaf4dd2608b",
  dentist: "https://images.unsplash.com/photo-1643660526741-094639fbe53a",
} as const;

type MetaAdProps = {
  name: string;
  initials: string;
  avatar: CSSProperties;
  copy?: string;
  ai?: boolean;
  visual: ReactNode;
  visualStyle?: CSSProperties;
  url: string;
  cta: string;
  button: string;
  rotate?: number;
  hover?: boolean;
  className?: string;
  style?: CSSProperties;
};

/** Annonce au format Facebook / Instagram. */
export function MetaAd({
  name,
  initials,
  avatar,
  copy,
  ai,
  visual,
  visualStyle,
  url,
  cta,
  button,
  rotate = 0,
  hover = true,
  className = "",
  style,
}: MetaAdProps) {
  return (
    <article
      className={`ad ${hover ? "is-hover" : ""} ${className}`}
      style={{ ["--r" as string]: `${rotate}deg`, ...style }}
      aria-label={`Exemple d'annonce Meta : ${name}`}
    >
      <div className="ad-head">
        <div className="ad-avatar" style={avatar}>
          {initials}
        </div>
        <div>
          <div className="ad-name">{name}</div>
          <div className="ad-sub">Sponsorisé</div>
        </div>
      </div>
      {copy && <div className="ad-copy">{copy}</div>}
      {ai && (
        <span className="ad-ai">
          <IconSparkles size={12} stroke={2.4} /> Écrit par l&apos;IA
        </span>
      )}
      <div className="ad-visual" style={visualStyle}>
        {visual}
      </div>
      <div className="ad-foot">
        <div>
          <div className="ad-url">{url}</div>
          <div className="ad-cta-text">{cta}</div>
        </div>
        <span className="ad-btn">{button}</span>
      </div>
      <div className="ad-channel">
        <IconBrandMeta size={14} stroke={2.2} /> Meta Ads · Facebook &amp; Instagram
      </div>
    </article>
  );
}

/** Visuel photo plein cadre avec titre en surimpression. */
export function PhotoVisual({
  src,
  alt,
  kicker,
  title,
  priority,
  accent = "#ff5b23",
}: {
  src: string;
  alt: string;
  kicker: string;
  title: string;
  priority?: boolean;
  accent?: string;
}) {
  return (
    <>
      <div className="ad-photo absolute inset-0">
        <Image src={src} alt={alt} fill sizes="300px" priority={priority} className="object-cover" />
      </div>
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,.72) 100%)" }} aria-hidden="true" />
      <div className="ad-visual-kicker" style={{ color: accent }}>
        {kicker}
      </div>
      <div className="ad-visual-title" style={{ color: "#f5f5f3" }}>
        {title}
      </div>
    </>
  );
}

/** Annonce Google Search, avec élément image (asset image Google Ads). */
export function SearchAd({
  domain,
  title,
  text,
  links,
  image,
  imageAlt,
  rotate = 0,
  hover = true,
}: {
  domain: string;
  title: string;
  text: string;
  links: string[];
  image: string;
  imageAlt: string;
  rotate?: number;
  hover?: boolean;
}) {
  return (
    <article className={`ad ${hover ? "is-hover" : ""}`} style={{ ["--r" as string]: `${rotate}deg` }} aria-label={`Exemple d'annonce Google Search : ${domain}`}>
      <div className="ad-photo relative overflow-hidden" style={{ aspectRatio: "16 / 10" }}>
        <Image src={image} alt={imageAlt} fill sizes="300px" className="object-cover" />
      </div>
      <div style={{ padding: "16px 18px 16px" }}>
        <div className="flex items-center gap-2" style={{ font: "600 12px/1.2 var(--font-sans)", color: "#5c5c58" }}>
          <span style={{ padding: "2px 6px", borderRadius: 4, background: "#ebebe7", color: "#0a0a0a", fontWeight: 800 }}>Sponsorisé</span>
          {domain}
        </div>
        <div style={{ font: "700 19px/1.25 var(--font-sans)", color: "#1a0dab", marginTop: 10 }}>{title}</div>
        <p style={{ font: "400 14px/1.45 var(--font-sans)", color: "#3a3a37", margin: "8px 0 0" }}>{text}</p>
        <div className="flex flex-wrap gap-1.5" style={{ marginTop: 12 }}>
          {links.map((l) => (
            <span key={l} className="ad-btn" style={{ background: "#ebebe7" }}>
              {l}
            </span>
          ))}
        </div>
      </div>
      <div className="ad-channel">
        <IconBrandGoogle size={14} stroke={2.2} /> Google Ads · Search
      </div>
    </article>
  );
}

/** Annonce Google Shopping. */
export function ShoppingAd({
  domain,
  products,
  rotate = 0,
}: {
  domain: string;
  products: { name: string; price: string; image: string; alt: string }[];
  rotate?: number;
}) {
  return (
    <article className="ad is-hover" style={{ ["--r" as string]: `${rotate}deg` }} aria-label={`Exemple d'annonce Google Shopping : ${domain}`}>
      <div style={{ padding: "18px 18px 16px" }}>
        <div className="flex items-center gap-2" style={{ font: "600 12px/1.2 var(--font-sans)", color: "#5c5c58" }}>
          <span style={{ padding: "2px 6px", borderRadius: 4, background: "#ebebe7", color: "#0a0a0a", fontWeight: 800 }}>Sponsorisé</span>
          {domain}
        </div>
        <div className="grid grid-cols-2 gap-2.5" style={{ marginTop: 12 }}>
          {products.map((p) => (
            <div key={p.name}>
              <div className="ad-photo relative overflow-hidden" style={{ aspectRatio: "1 / 1", borderRadius: 10, background: "#ebebe7" }}>
                <Image src={p.image} alt={p.alt} fill sizes="140px" className="object-cover" />
              </div>
              <div style={{ font: "600 13px/1.3 var(--font-sans)", marginTop: 8 }}>{p.name}</div>
              <div style={{ font: "800 14px/1 var(--font-sans)", marginTop: 4 }}>{p.price}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="ad-channel">
        <IconBrandGoogle size={14} stroke={2.2} /> Google Ads · Shopping
      </div>
    </article>
  );
}
