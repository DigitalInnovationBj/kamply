import type { Metadata } from "next";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { SITE } from "@/lib/site";
import { PLANS } from "@/lib/plans";

export const metadata: Metadata = {
  alternates: { canonical: "/", languages: { "fr-FR": "/" } },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#organization`,
      name: SITE.name,
      url: SITE.url,
      logo: `${SITE.url}/icon-512.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.name,
      inLanguage: "fr-FR",
      publisher: { "@id": `${SITE.url}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      name: SITE.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: SITE.description,
      offers: PLANS.map((p) => ({ "@type": "Offer", name: p.name, price: p.price / 100, priceCurrency: "EUR" })),
    },
  ],
};

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <script
        type="application/ld+json"
        // Contenu statique défini ci-dessus, sans donnée utilisateur.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <SmoothScroll>{children}</SmoothScroll>
    </>
  );
}
