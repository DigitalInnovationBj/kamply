/** Libellés et couleurs partagés (client et serveur) pour les campagnes et le portefeuille. */

export const STATUS = {
  DRAFT: { label: "Brouillon", tone: "muted", hint: "Pas encore lancée." },
  PENDING_REVIEW: { label: "En validation", tone: "brand", hint: "Notre équipe vérifie l'annonce avant diffusion." },
  ACTIVE: { label: "En direct", tone: "signal", hint: "Votre annonce est diffusée." },
  PAUSED: { label: "En pause", tone: "dark", hint: "La diffusion est suspendue." },
  ENDED: { label: "Terminée", tone: "muted", hint: "La campagne est arrivée à son terme." },
  REJECTED: { label: "Refusée", tone: "danger", hint: "L'annonce doit être corrigée." },
} as const;

export type CampaignStatusKey = keyof typeof STATUS;

export const CHANNELS = {
  GOOGLE: { label: "Google Ads", sub: "Recherche & Shopping" },
  META: { label: "Meta Ads", sub: "Facebook & Instagram" },
} as const;

export type ChannelKey = keyof typeof CHANNELS;

export const OBJECTIVES = {
  GOOGLE: ["Recevoir des appels", "Générer des visites sur le site", "Vendre en ligne", "Obtenir des demandes de devis"],
  META: ["Faire connaître ma marque", "Générer des messages", "Vendre en ligne", "Promouvoir un événement"],
} as const;

export const TX_TYPE = {
  TOPUP: "Recharge",
  DEBIT: "Paiement",
  REFUND: "Remboursement",
  ADJUSTMENT: "Ajustement",
} as const;

export const TX_STATUS = {
  PENDING: { label: "En attente", tone: "brand" },
  COMPLETED: { label: "Validée", tone: "signal" },
  REJECTED: { label: "Refusée", tone: "danger" },
  CANCELLED: { label: "Annulée", tone: "muted" },
} as const;

export const TOPUP_METHODS = {
  BANK_TRANSFER: "Virement bancaire",
} as const;

const nf = new Intl.NumberFormat("fr-FR");
export const formatNumber = (n: number) => nf.format(n);

export function formatDate(d: Date | string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  return new Intl.DateTimeFormat("fr-FR", opts).format(typeof d === "string" ? new Date(d) : d);
}
