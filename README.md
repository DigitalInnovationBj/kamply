# KAMPLY

Site vitrine de KAMPLY — campagnes Google Ads et Meta Ads créées par l'IA.

## Stack

- Next.js 16 (App Router, Turbopack, Cache Components)
- Tailwind CSS 4
- GSAP 3 (ScrollTrigger, SplitText) + Lenis pour le défilement fluide
- Icônes : Tabler Icons
- Polices : Robinco (logo et titres, ligatures actives) et Satoshi (textes), servies avec `next/font/local`

## Commandes

```bash
pnpm install
pnpm build
pnpm start
```

## Structure

- `src/app` : layout, page, styles globaux, polices
- `src/components/Island.tsx` : navigation « dynamic island » (repliée, s'ouvre au survol, bouton retour en haut en remontant)
- `src/components/Choreography.tsx` : toutes les animations (empilement des sections, révélations, compteurs, bandeau)
- `src/components/sections` : les sections de la page d'accueil
- `src/components/ui` : bouton, panneau, annonces

## Notes

- Les photos de l'exemple Maison Lune viennent d'Unsplash (licence Unsplash).
- Robinco © Asenbayu : vérifier la licence commerciale avant la mise en production.
