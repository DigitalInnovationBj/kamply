import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/** Sitemap provisoire : une seule page pour l'instant. Ajouter les futures pages ici. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE.url,
      lastModified: SITE.updatedAt,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
