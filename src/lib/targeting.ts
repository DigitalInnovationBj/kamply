import { z } from "zod";

/** Pays proposés (codes ISO 3166-1 alpha-2) ; les noms viennent de Intl.DisplayNames en français. */
export const COUNTRY_CODES = [
  "FR", "BE", "CH", "LU", "MC", "CA", "US", "GB", "IE", "DE", "AT", "NL", "ES", "PT", "IT", "MT", "GR", "CY", "DK", "SE", "NO", "FI", "IS",
  "PL", "CZ", "SK", "HU", "RO", "BG", "HR", "SI", "RS", "BA", "ME", "MK", "AL", "EE", "LV", "LT", "UA", "MD", "TR", "AE", "SA", "QA", "KW",
  "BH", "OM", "IL", "JO", "LB", "EG", "MA", "DZ", "TN", "SN", "CI", "BJ", "TG", "BF", "ML", "NE", "GN", "CM", "GA", "CG", "CD", "TD", "CF",
  "MG", "MU", "RE", "GP", "MQ", "GF", "YT", "NC", "PF", "RW", "BI", "DJ", "KM", "SC", "NG", "GH", "KE", "TZ", "UG", "ET", "ZA", "AO", "MZ",
  "ZM", "ZW", "BW", "NA", "MX", "BR", "AR", "CL", "CO", "PE", "UY", "PY", "BO", "EC", "VE", "CR", "PA", "DO", "HT", "JM", "PR", "AU", "NZ",
  "JP", "KR", "CN", "HK", "TW", "SG", "MY", "TH", "VN", "PH", "ID", "IN", "PK", "BD", "LK",
] as const;

const names = typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["fr"], { type: "region" }) : null;

export function countryName(code: string) {
  try {
    return names?.of(code) ?? code;
  } catch {
    return code;
  }
}

/** Drapeau emoji à partir du code pays. */
export const flag = (code: string) => String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)));

export const cityTargetSchema = z.object({ name: z.string().trim().min(2, "Nom de ville trop court.").max(80), radiusKm: z.coerce.number().int().min(5).max(100) });
export const countryTargetSchema = z.object({
  code: z.string().length(2).toUpperCase(),
  mode: z.enum(["all", "cities"]),
  cities: z.array(cityTargetSchema).max(20).default([]),
});
export const targetingSchema = z.object({ countries: z.array(countryTargetSchema).min(1, "Choisissez au moins un pays.").max(30) });

export type CityTarget = z.infer<typeof cityTargetSchema>;
export type CountryTarget = z.infer<typeof countryTargetSchema>;
export type Targeting = z.infer<typeof targetingSchema>;

/** Résumé lisible : « France (tout le pays) · Belgique : Bruxelles 20 km, Liège 15 km ». */
export function targetingSummary(t: Targeting) {
  return t.countries
    .map((c) => (c.mode === "all" || !c.cities.length ? `${countryName(c.code)} (tout le pays)` : `${countryName(c.code)} : ${c.cities.map((v) => `${v.name} ${v.radiusKm} km`).join(", ")}`))
    .join(" · ");
}

/** Lit la valeur JSON stockée (ou null pour les anciennes campagnes). */
export function readTargeting(v: unknown): Targeting | null {
  const p = targetingSchema.safeParse(v);
  return p.success ? p.data : null;
}
