import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/** robots.txt provisoire : à revoir une fois le domaine définitif branché (NEXT_PUBLIC_SITE_URL). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
