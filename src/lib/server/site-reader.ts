import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { parse, type HTMLElement } from "node-html-parser";

/** Ce que KAMPLY retient d'un site pour rédiger les annonces. */
export type SiteDigest = {
  url: string;
  host: string;
  lang: string | null;
  siteName: string | null;
  title: string | null;
  description: string | null;
  headings: string[];
  text: string;
  phones: string[];
  address: string | null;
  city: string | null;
  priceHints: string[];
  images: string[];
  pages: string[];
};

export class SiteReadError extends Error {
  constructor(
    public code: "INVALID_URL" | "BLOCKED" | "UNREACHABLE" | "NOT_HTML" | "EMPTY",
    message: string,
  ) {
    super(message);
  }
}

const UA = "Mozilla/5.0 (compatible; KamplyBot/1.0; +https://kamply-platform.vercel.app)";
const MAX_BYTES = 1_500_000;
const TIMEOUT = 8000;

export function normalizeUrl(raw: string) {
  const v = raw.trim();
  if (!v) throw new SiteReadError("INVALID_URL", "Indiquez l'adresse de votre site.");
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
  } catch {
    throw new SiteReadError("INVALID_URL", "Adresse invalide. Exemple : monsite.com");
  }
  if (!["http:", "https:"].includes(u.protocol) || !u.hostname.includes(".")) throw new SiteReadError("INVALID_URL", "Adresse invalide. Exemple : monsite.com");
  u.hash = "";
  return u;
}

function isPrivate(ip: string) {
  if (ip.includes(":")) {
    const l = ip.toLowerCase();
    return l === "::1" || l.startsWith("fc") || l.startsWith("fd") || l.startsWith("fe80") || l === "::" || l.startsWith("::ffff:127.") || l.startsWith("::ffff:10.") || l.startsWith("::ffff:192.168.");
  }
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

/** Refuse les adresses internes (protection SSRF). */
async function assertPublic(u: URL) {
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new SiteReadError("BLOCKED", "Cette adresse n'est pas accessible publiquement.");
  const ips = isIP(host) ? [host] : (await lookup(host, { all: true }).catch(() => [])).map((r) => r.address);
  if (!ips.length) throw new SiteReadError("UNREACHABLE", "Ce site est introuvable. Vérifiez l'adresse.");
  if (ips.some(isPrivate)) throw new SiteReadError("BLOCKED", "Cette adresse n'est pas accessible publiquement.");
}

async function fetchHtml(start: URL): Promise<{ html: string; url: URL }> {
  let url = start;
  for (let hop = 0; hop < 4; hop++) {
    await assertPublic(url);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
    let res: Response;
    try {
      res = await fetch(url, { redirect: "manual", signal: ctrl.signal, headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml", "accept-language": "fr,en;q=0.8" } });
    } catch {
      clearTimeout(timer);
      throw new SiteReadError("UNREACHABLE", "Le site ne répond pas. Réessayez ou vérifiez l'adresse.");
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      clearTimeout(timer);
      url = new URL(res.headers.get("location")!, url);
      continue;
    }
    if (!res.ok) {
      clearTimeout(timer);
      throw new SiteReadError("UNREACHABLE", `Le site a répondu par une erreur (${res.status}).`);
    }
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("html")) {
      clearTimeout(timer);
      throw new SiteReadError("NOT_HTML", "Cette adresse ne mène pas à une page web.");
    }
    // Lecture plafonnée.
    const reader = res.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    if (reader) {
      while (size < MAX_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        size += value.length;
      }
      void reader.cancel().catch(() => {});
    }
    clearTimeout(timer);
    return { html: new TextDecoder().decode(Buffer.concat(chunks)), url };
  }
  throw new SiteReadError("UNREACHABLE", "Trop de redirections.");
}

const clean = (s?: string | null) => (s ?? "").replace(/\s+/g, " ").trim();
const meta = (root: HTMLElement, sel: string) => clean(root.querySelector(sel)?.getAttribute("content")) || null;

function abs(src: string | undefined, base: URL) {
  if (!src || src.startsWith("data:")) return null;
  try {
    const u = new URL(src.split(" ")[0], base);
    return u.protocol.startsWith("http") ? u.href : null;
  } catch {
    return null;
  }
}

type LdNode = Record<string, unknown>;
function ldNodes(root: HTMLElement): LdNode[] {
  const out: LdNode[] = [];
  for (const s of root.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const j = JSON.parse(s.textContent);
      const walk = (n: unknown) => {
        if (Array.isArray(n)) n.forEach(walk);
        else if (n && typeof n === "object") {
          out.push(n as LdNode);
          if ("@graph" in (n as LdNode)) walk((n as LdNode)["@graph"]);
        }
      };
      walk(j);
    } catch {}
  }
  return out;
}

function extract(html: string, url: URL) {
  const root = parse(html, { comment: false, blockTextElements: { script: true, style: false, noscript: false } });
  const ld = ldNodes(root);
  root.querySelectorAll("script,style,noscript,svg,iframe,template").forEach((n) => n.remove());

  const headings = root
    .querySelectorAll("h1,h2,h3")
    .map((h) => clean(h.textContent))
    .filter((h) => h.length > 2 && h.length < 140);

  const blocks = root
    .querySelectorAll("main p, main li, article p, section p, p, li")
    .map((p) => clean(p.textContent))
    .filter((t) => t.length > 30);
  const text = [...new Set(blocks)].join("\n").slice(0, 7000);

  const phones = [
    ...new Set(
      root
        .querySelectorAll('a[href^="tel:"]')
        .map((a) => clean(decodeURIComponent(a.getAttribute("href")!.slice(4))))
        .filter(Boolean),
    ),
  ].slice(0, 3);

  const biz = ld.find((n) => /LocalBusiness|Organization|Store|Restaurant|Service|Florist|Shop/i.test(String(n["@type"] ?? "")));
  const addr = biz?.address as LdNode | undefined;
  const city = clean((addr?.addressLocality as string) ?? "") || null;
  const address = addr ? clean([addr.streetAddress, addr.postalCode, addr.addressLocality].filter(Boolean).join(", ")) || null : null;
  if (biz?.telephone) phones.unshift(String(biz.telephone));

  const priceHints = [...new Set((text.match(/\d+(?:[.,]\d{1,2})?\s?(?:€|EUR|\$|£|CHF)|(?:€|\$|£)\s?\d+(?:[.,]\d{1,2})?/g) ?? []).map(clean))].slice(0, 8);

  const imgs: string[] = [];
  const push = (s: string | null) => s && !imgs.includes(s) && imgs.push(s);
  push(abs(meta(root, 'meta[property="og:image"]') ?? undefined, url));
  push(abs(meta(root, 'meta[name="twitter:image"]') ?? undefined, url));
  for (const img of root.querySelectorAll("img")) {
    const src = img.getAttribute("src") || img.getAttribute("data-src") || img.getAttribute("srcset")?.split(",").pop()?.trim();
    const hint = `${src ?? ""} ${img.getAttribute("class") ?? ""} ${img.getAttribute("alt") ?? ""}`.toLowerCase();
    if (/logo|icon|sprite|avatar|favicon|pixel|badge|flag|payment|\.svg|\.gif/.test(hint)) continue;
    const w = Number(img.getAttribute("width") || 0);
    if (w && w < 300) continue;
    push(abs(src, url));
    if (imgs.length >= 12) break;
  }

  const links = root
    .querySelectorAll("a[href]")
    .map((a) => abs(a.getAttribute("href"), url))
    .filter((h): h is string => !!h && new URL(h).host === url.host)
    .filter((h) => /(service|prestation|offre|tarif|prix|menu|carte|produit|boutique|shop|about|a-propos|qui-sommes|contact)/i.test(new URL(h).pathname));

  return {
    lang: root.querySelector("html")?.getAttribute("lang") ?? null,
    siteName: meta(root, 'meta[property="og:site_name"]') || clean((biz?.name as string) ?? "") || null,
    title: clean(root.querySelector("title")?.textContent) || meta(root, 'meta[property="og:title"]'),
    description: meta(root, 'meta[name="description"]') || meta(root, 'meta[property="og:description"]'),
    headings,
    text,
    phones,
    address,
    city,
    priceHints,
    images: imgs,
    links: [...new Set(links)].slice(0, 2),
  };
}

/** Lit la page d'accueil et jusqu'à deux pages utiles (offre, tarifs, contact). */
export async function readSite(raw: string): Promise<SiteDigest> {
  const start = normalizeUrl(raw);
  const home = await fetchHtml(start);
  const main = extract(home.html, home.url);
  const pages = [home.url.href];
  const extra = await Promise.all(
    main.links.map(async (l) => {
      try {
        const p = await fetchHtml(new URL(l));
        pages.push(p.url.href);
        return extract(p.html, p.url);
      } catch {
        return null;
      }
    }),
  );
  const all = [main, ...extra.filter((x): x is NonNullable<typeof x> => !!x)];
  const digest: SiteDigest = {
    url: home.url.href,
    host: home.url.host.replace(/^www\./, ""),
    lang: main.lang,
    siteName: main.siteName,
    title: main.title,
    description: main.description,
    headings: [...new Set(all.flatMap((x) => x.headings))].slice(0, 30),
    text: all.map((x) => x.text).join("\n").slice(0, 12000),
    phones: [...new Set(all.flatMap((x) => x.phones))].slice(0, 3),
    address: all.find((x) => x.address)?.address ?? null,
    city: all.find((x) => x.city)?.city ?? null,
    priceHints: [...new Set(all.flatMap((x) => x.priceHints))].slice(0, 10),
    images: [...new Set(all.flatMap((x) => x.images))].slice(0, 12),
    pages,
  };
  if (!digest.text && !digest.description && digest.headings.length < 2) {
    throw new SiteReadError("EMPTY", "Votre site contient trop peu de texte lisible (il est peut-être construit entièrement en JavaScript).");
  }
  return digest;
}
