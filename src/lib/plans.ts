/** Formules KAMPLY : prix mensuel tout compris (budget publicitaire inclus), en centimes d'euro. */
export const PLANS = [
  { id: "STANDARD", name: "Standard", price: 14900, google: "≈ 120 visites qualifiées", meta: "≈ 25 000 personnes touchées", feat: "1 campagne · annonces IA · rapport mensuel" },
  { id: "BASIC", name: "Basique", price: 29900, google: "≈ 270 visites qualifiées", meta: "≈ 55 000 personnes touchées", feat: "Suivi des conversions · rapport hebdomadaire" },
  { id: "ESSENTIAL", name: "Essentiel", price: 59900, google: "≈ 570 visites qualifiées", meta: "≈ 115 000 personnes touchées", feat: "Optimisation quotidienne · tests d'annonces" },
  { id: "PREMIUM", name: "Premium", price: 119900, google: "≈ 1 150 visites qualifiées", meta: "≈ 235 000 personnes touchées", feat: "Accompagnement dédié · audiences avancées" },
] as const;

export type PlanId = (typeof PLANS)[number]["id"];

export function planById(id: string) {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eur2 = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Formate des centimes en euros : 14900 → « 149 € ». */
export function formatEuros(cents: number, { decimals = false } = {}) {
  const v = cents / 100;
  return decimals || !Number.isInteger(v) ? eur2.format(v) : eur.format(v);
}
