import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { OBJECTIVES } from "@/lib/campaigns";
import { SECTORS } from "@/lib/sectors";
import type { SiteDigest } from "./site-reader";

/** Modèle configurable ; l'alias « latest » suit la dernière version Flash de Gemini. */
const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

/** Réponses factices pour les tests locaux sans clé (AI_MOCK=1, jamais en production réelle). */
export const aiMock = () => process.env.AI_MOCK === "1" && !(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

export function aiReady() {
  return !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) || aiMock();
}

let client: GoogleGenAI | null = null;
function ai() {
  if (!aiReady()) throw new Error("AI_NOT_CONFIGURED");
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY });
  return client;
}

const SYSTEM = `Tu es le rédacteur publicitaire de KAMPLY, une plateforme qui crée des campagnes Google Ads et Meta Ads pour les petites entreprises.
Règles impératives :
- Écris en français, ton direct, concret, sans jargon ni superlatifs creux (« le meilleur », « incroyable »).
- N'invente rien : aucun prix, promotion, délai, garantie ou chiffre absent des informations fournies.
- Respecte strictement les longueurs maximales.
- Pas d'émojis, pas de points d'exclamation multiples, pas de majuscules continues.
- Les mots-clés Google sont des requêtes réelles qu'un client taperait, en minuscules, 2 à 4 mots, incluant la ville quand l'activité est locale.`;

const s = (max: number) => ({ type: "string", maxLength: max });
const draftJsonSchema = {
  type: "object",
  properties: {
    business: {
      type: "object",
      properties: {
        name: s(60),
        sector: { type: "string", enum: [...SECTORS] },
        city: { type: "string", description: "Ville principale de l'activité, vide si inconnue." },
        summary: { type: "string", maxLength: 220, description: "Ce que vend l'entreprise, en une phrase." },
      },
      required: ["name", "sector", "city", "summary"],
    },
    channel: {
      type: "object",
      properties: {
        recommended: { type: "string", enum: ["GOOGLE", "META"] },
        reason: { type: "string", maxLength: 160, description: "Pourquoi ce canal, en une phrase adressée au client (vous)." },
      },
      required: ["recommended", "reason"],
    },
    objectives: {
      type: "object",
      properties: {
        GOOGLE: { type: "string", enum: [...OBJECTIVES.GOOGLE] },
        META: { type: "string", enum: [...OBJECTIVES.META] },
      },
      required: ["GOOGLE", "META"],
    },
    campaignName: s(60),
    location: {
      type: "object",
      properties: {
        national: { type: "boolean", description: "true si l'entreprise vend en ligne à distance, sans zone locale." },
        city: { type: "string" },
        radiusKm: { type: "integer", minimum: 5, maximum: 100 },
      },
      required: ["national", "city", "radiusKm"],
    },
    google: {
      type: "object",
      properties: {
        headlines: { type: "array", minItems: 3, maxItems: 3, items: s(60) },
        descriptions: { type: "array", minItems: 3, maxItems: 3, items: s(160) },
        keywords: { type: "array", minItems: 8, maxItems: 15, items: s(60) },
      },
      required: ["headlines", "descriptions", "keywords"],
    },
    meta: {
      type: "object",
      properties: {
        headlines: { type: "array", minItems: 3, maxItems: 3, items: s(60) },
        texts: { type: "array", minItems: 3, maxItems: 3, items: s(160) },
        interests: { type: "string", maxLength: 160, description: "Centres d'intérêt Meta séparés par des virgules." },
      },
      required: ["headlines", "texts", "interests"],
    },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
  required: ["business", "channel", "objectives", "campaignName", "location", "google", "meta", "confidence"],
} as const;

const cut = (max: number) => z.string().transform((v) => v.replace(/\s+/g, " ").trim().slice(0, max));
const draftSchema = z.object({
  business: z.object({ name: cut(60), sector: z.enum(SECTORS).catch("Autre"), city: cut(80), summary: cut(220) }),
  channel: z.object({ recommended: z.enum(["GOOGLE", "META"]), reason: cut(160) }),
  objectives: z.object({ GOOGLE: z.enum(OBJECTIVES.GOOGLE).catch(OBJECTIVES.GOOGLE[1]), META: z.enum(OBJECTIVES.META).catch(OBJECTIVES.META[0]) }),
  campaignName: cut(60),
  location: z.object({ national: z.boolean(), city: cut(80), radiusKm: z.number().int().min(5).max(100).catch(20) }),
  google: z.object({ headlines: z.array(cut(60)).min(1), descriptions: z.array(cut(160)).min(1), keywords: z.array(cut(60).transform((k) => k.toLowerCase())).min(3) }),
  meta: z.object({ headlines: z.array(cut(60)).min(1), texts: z.array(cut(160)).min(1), interests: cut(160) }),
  confidence: z.enum(["high", "medium", "low"]).catch("medium"),
});
export type CampaignDraft = z.infer<typeof draftSchema>;

function digestPrompt(d: SiteDigest) {
  return [
    `Site : ${d.url}`,
    d.siteName && `Nom affiché : ${d.siteName}`,
    d.title && `Titre de la page : ${d.title}`,
    d.description && `Description : ${d.description}`,
    d.city && `Ville (données structurées) : ${d.city}`,
    d.address && `Adresse : ${d.address}`,
    d.phones.length && `Téléphone : ${d.phones.join(", ")}`,
    d.priceHints.length && `Prix repérés sur le site : ${d.priceHints.join(", ")}`,
    d.headings.length && `Intertitres :\n- ${d.headings.join("\n- ")}`,
    d.text && `Texte du site :\n${d.text}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function generateJson(prompt: string, schema: object, temperature: number) {
  const res = await ai().models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { systemInstruction: SYSTEM, responseMimeType: "application/json", responseJsonSchema: schema, temperature },
  });
  const text = res.text;
  if (!text) throw new Error("AI_EMPTY");
  return JSON.parse(text) as unknown;
}

/** Brouillon complet de campagne à partir du contenu du site. */
export async function draftFromSite(d: SiteDigest, company?: string | null): Promise<CampaignDraft> {
  if (aiMock()) return draftSchema.parse(MOCK_DRAFT);
  const prompt = `Prépare une campagne publicitaire pour cette entreprise${company ? ` (« ${company} » selon son profil)` : ""}.
Propose des annonces pour Google Ads ET pour Meta Ads : le client choisira son canal.
Le nom de campagne est interne, court et descriptif (ex. « Bouquets livrés · Lyon »).

${digestPrompt(d)}`;
  return draftSchema.parse(await generateJson(prompt, draftJsonSchema, 0.7));
}

const variantFields = {
  headline: { max: 60, label: "titres d'annonce" },
  description: { max: 160, label: "descriptions d'annonce" },
  keywords: { max: 60, label: "mots-clés Google (requêtes réelles, minuscules)" },
  interests: { max: 160, label: "listes de centres d'intérêt Meta séparés par des virgules" },
} as const;
export type VariantField = keyof typeof variantFields;

/** Nouvelles propositions pour un seul champ, différentes des précédentes. */
export async function moreVariants(context: string, field: VariantField, channel: "GOOGLE" | "META", avoid: string[]): Promise<string[]> {
  const f = variantFields[field];
  if (aiMock()) return MOCK_VARIANTS[field];
  const count = field === "keywords" ? 10 : 3;
  const prompt = `Contexte de l'entreprise :\n${context.slice(0, 6000)}\n\nCanal : ${channel === "GOOGLE" ? "Google Ads (recherche)" : "Meta Ads (Facebook et Instagram)"}.
Propose ${count} ${f.label}, ${f.max} caractères maximum chacun, nettement différents de ceux-ci :\n- ${avoid.slice(0, 20).join("\n- ") || "(aucun)"}`;
  const schema = { type: "object", properties: { items: { type: "array", minItems: count, maxItems: count, items: s(f.max) } }, required: ["items"] };
  const out = z.object({ items: z.array(cut(f.max)) }).parse(await generateJson(prompt, schema, 0.95));
  return out.items.filter(Boolean).map((v) => (field === "keywords" ? v.toLowerCase() : v));
}

/** Contexte compact renvoyé au navigateur puis réutilisé pour les nouvelles propositions. */
export function digestContext(d: SiteDigest, draft: CampaignDraft) {
  return [`${draft.business.name} · ${draft.business.sector} · ${draft.business.city || "ville inconnue"}`, draft.business.summary, d.description, d.headings.slice(0, 12).join(" | "), d.text.slice(0, 2500)]
    .filter(Boolean)
    .join("\n");
}

const MOCK_DRAFT = {
  business: { name: "Maison Lune", sector: "E-commerce", city: "Lyon", summary: "Fleuriste à Lyon : bouquets de saison composés à la main, livrés le jour même, et décoration florale de mariages." },
  channel: { recommended: "GOOGLE", reason: "Vos clients cherchent « fleuriste lyon » au moment d'acheter : Google vous place devant eux à cet instant." },
  objectives: { GOOGLE: "Générer des visites sur le site", META: "Faire connaître ma marque" },
  campaignName: "Bouquets livrés · Lyon",
  location: { national: false, city: "Lyon", radiusKm: 15 },
  google: {
    headlines: ["Fleuriste à Lyon, livré le jour même", "Bouquets de saison faits main à Lyon", "Commandez avant 16 h, livré aujourd'hui"],
    descriptions: [
      "Bouquets frais composés à la main par nos fleuristes. Commandez en ligne avant 16 h, livraison le jour même dans Lyon.",
      "Fleurs de saison, compositions uniques et livraison soignée dans tout Lyon. Offrez un bouquet en trois clics.",
      "Anniversaire, remerciement ou simple attention : un bouquet frais livré à Lyon le jour même de votre commande.",
    ],
    keywords: ["fleuriste lyon", "livraison fleurs lyon", "bouquet lyon", "fleuriste lyon 6", "fleurs anniversaire lyon", "bouquet livré aujourd'hui", "fleuriste mariage lyon", "commander bouquet en ligne", "fleurs de saison lyon", "composition florale lyon"],
  },
  meta: {
    headlines: ["Des fleurs livrées aujourd'hui", "Le bouquet qui fait sourire", "Fait main, à Lyon"],
    texts: [
      "Nos fleuristes composent chaque bouquet à la main avec des fleurs de saison. Commandez avant 16 h, on livre aujourd'hui dans Lyon.",
      "Un merci, un anniversaire, une envie : offrez un bouquet frais livré le jour même à Lyon.",
      "Fleurs de saison, compositions uniques : découvrez les bouquets de Maison Lune.",
    ],
    interests: "fleurs, décoration intérieure, mariage, cadeaux, art de vivre",
  },
  confidence: "high",
};

const MOCK_VARIANTS: Record<VariantField, string[]> = {
  headline: ["Votre fleuriste lyonnais en ligne", "Bouquets frais livrés en 3 h", "Offrez des fleurs à Lyon dès aujourd'hui"],
  description: [
    "Choisissez votre bouquet en ligne, nous le composons et le livrons dans la journée partout dans Lyon.",
    "Des fleurs fraîches sélectionnées chaque matin et une livraison soignée dans tout Lyon.",
    "Un bouquet unique pour chaque occasion, livré le jour même à Lyon et ses environs.",
  ],
  keywords: ["fleuriste en ligne lyon", "bouquet pas cher lyon", "livraison fleurs villeurbanne", "fleurs deuil lyon", "abonnement fleurs lyon", "fleuriste ouvert dimanche lyon", "bouquet de roses lyon", "plantes lyon livraison", "fleuriste croix rousse", "fleurs saint valentin lyon"],
  interests: ["fleurs, jardinage, plantes d'intérieur, décoration", "mariage, organisation d'événements, cadeaux", "art floral, design, art de vivre, Lyon"],
};
