import type { Metadata } from "next";
import { LegalDoc } from "@/components/app/LegalDoc";

export const metadata: Metadata = { title: "Politique de confidentialité", alternates: { canonical: "/confidentialite" } };

export default function PrivacyPage() {
  return (
    <LegalDoc
      title="Politique de confidentialité"
      updated="20 novembre 2026"
      sections={[
        { h: "Données collectées", body: <p>Nom, adresse e-mail, mot de passe (stocké chiffré), informations d&apos;entreprise (nom, secteur, téléphone, site), photo de profil facultative, contenu de vos annonces et historique de votre portefeuille.</p> },
        { h: "Finalités", body: <p>Ces données servent à gérer votre compte, préparer et diffuser vos campagnes, vous envoyer les e-mails nécessaires au service (code de vérification, réinitialisation du mot de passe) et traiter vos recharges.</p> },
        {
          h: "Prestataires",
          body: <p>Hébergement : Vercel. Base de données : Neon. Images : Cloudinary. E-mails transactionnels : Resend. Diffusion publicitaire : Google et Meta, pour le seul contenu de vos annonces.</p>,
        },
        { h: "Conservation", body: <p>Vos données sont conservées tant que votre compte est actif. La suppression du compte efface vos données et images ; les écritures comptables sont conservées le temps exigé par la loi.</p> },
        { h: "Cookies", body: <p>KAMPLY n&apos;utilise qu&apos;un cookie de session, indispensable à la connexion. Aucun cookie publicitaire n&apos;est déposé.</p> },
        { h: "Vos droits", body: <p>Vous pouvez accéder à vos données, les corriger depuis les paramètres, ou demander leur effacement. Écrivez-nous à privacy@kamply.com.</p> },
      ]}
    />
  );
}
