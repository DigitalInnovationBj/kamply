/**
 * Informations du site, partagées par les métadonnées, le sitemap, robots.txt et l'image de partage.
 * Domaine provisoire : définir NEXT_PUBLIC_SITE_URL (ex. https://kamply.com) une fois le domaine acheté.
 */
export const SITE = {
  name: "KAMPLY",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://kamply-platform.vercel.app").replace(/\/$/, ""),
  title: "KAMPLY | Vos pubs Google & Meta en 5 minutes",
  shortTitle: "Vos pubs Google & Meta en 5 minutes",
  description:
    "KAMPLY crée vos campagnes Google Ads ou Meta Ads avec l'IA, les lance pour vous et vous montre les résultats en direct. Sans agence, sans expertise. Dès 149 € par mois, budget publicitaire inclus.",
  locale: "fr_FR",
  keywords: [
    "Google Ads",
    "Meta Ads",
    "publicité Facebook",
    "publicité Instagram",
    "publicité en ligne",
    "campagne publicitaire IA",
    "Google Shopping",
    "marketing PME",
    "plateforme publicitaire",
    "KAMPLY",
  ],
  /** Date de dernière mise à jour du contenu, utilisée par le sitemap. */
  updatedAt: "2026-11-20",
} as const;
