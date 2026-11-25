# KAMPLY

Plateforme self-service de campagnes Google Ads et Meta Ads : site vitrine + application (comptes, campagnes, portefeuille, administration).

## Stack

- Next.js 16 (App Router, Turbopack, Cache Components), Tailwind CSS 4, shadcn/ui (Radix)
- Better Auth (e-mail + mot de passe, code OTP à 6 chiffres, rôles admin)
- Prisma 7 + Neon PostgreSQL (adaptateur `@prisma/adapter-pg`)
- Resend + React Email (e-mails système), Cloudinary (avatars et visuels, envoi signé direct)
- Google Gen AI SDK (`@google/genai`, Gemini) : rédaction des campagnes à partir du site du client
- Recharts (graphiques), GSAP + Lenis (site), Tabler Icons
- Polices : Robinco (logo et titres, ligatures actives) et Satoshi (textes)

## Commandes

```bash
pnpm install        # lance aussi prisma generate
pnpm build          # prisma generate + prisma migrate deploy + next build
pnpm start
pnpm db:local       # Postgres en mémoire (PGlite) sur 127.0.0.1:5433, pour tester sans Neon
```

Variables d'environnement : voir `.env.example`.

## Parcours

- `/inscription` → `/verification` (code OTP par e-mail) → `/bienvenue` (profil : photo ou initiales, entreprise, secteur, site, téléphone) → `/app`
- `/connexion`, `/mot-de-passe-oublie` (code OTP puis nouveau mot de passe)
- `/app` : tableau de bord, `/app/campagnes` (+ `nouvelle`, `[id]`), `/app/portefeuille`, `/app/parametres`
- `/app/admin` : validation des campagnes, saisie et correction des statistiques quotidiennes, crédit des recharges, rôles, suspension de comptes (avec e-mail), envoi d'e-mails personnalisés (`/app/admin/emails`)

## Fonctionnement provisoire

- **Statistiques** : saisies par un administrateur, jour par jour, depuis la fiche admin d'une campagne.
- **Portefeuille** : recharge par carte via GeniusPay, tout est affiché en euros (conversion en F CFA à parité fixe uniquement pour le prestataire), frais de carte absorbés par KAMPLY. Le solde est crédité après revérification du paiement (webhook `/api/webhooks/geniuspay`, page de retour, ou affichage du portefeuille). Le virement bancaire est masqué (`BANK_TRANSFER_ENABLED=1` pour le réactiver). Le lancement d'une campagne débite le premier mois ; sans solde suffisant, elle reste en brouillon. Un refus d'annonce rembourse automatiquement.
- **Premier administrateur** : tout compte créé avec une adresse listée dans `ADMIN_EMAILS` reçoit le rôle admin.
- **E-mails** : expéditeur `noreply@kamply.site` (domaine vérifié sur Resend), réponses vers `contact@kamply.site`.

## Génération automatique

Première étape de « Nouvelle campagne » : KAMPLY lit le site du client (page d'accueil + 2 pages utiles, adresses internes refusées), puis Gemini propose canal, objectif, zone, titres, descriptions, mots-clés, centres d'intérêt, et les images du site sont proposées comme visuels. L'étape n'apparaît que si `GEMINI_API_KEY` est défini. Quotas : 10 analyses et 60 nouvelles propositions par compte et par jour. `AI_MOCK=1` (local uniquement, sans clé) renvoie des réponses factices pour tester l'interface.

## Structure

- `src/app/(site)` : page d'accueil ; `(auth)`, `(onboarding)`, `(app)`, `(legal)` : application
- `src/lib/auth.ts`, `src/lib/session.ts`, `src/proxy.ts` : authentification et protection des routes
- `src/app/actions` : actions serveur (profil, campagnes, portefeuille, admin)
- `src/lib/server` : requêtes, e-mail, Cloudinary
- `src/components/app` : composants de l'application ; `src/components/ui` : shadcn/ui ; `src/components/site` : composants du site
- `prisma/` : schéma et migrations

## Notes

- Photos de l'exemple Maison Lune : Unsplash (licence Unsplash).
- Robinco © Asenbayu : vérifier la licence commerciale avant la mise en production.
- Domaine : https://www.kamply.site (défaut de `NEXT_PUBLIC_SITE_URL`), contact : contact@kamply.site.
