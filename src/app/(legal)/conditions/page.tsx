import type { Metadata } from "next";
import { LegalDoc } from "@/components/app/LegalDoc";

export const metadata: Metadata = { title: "Conditions d'utilisation", alternates: { canonical: "/conditions" } };

export default function TermsPage() {
  return (
    <LegalDoc
      title="Conditions d'utilisation"
      updated="20 novembre 2026"
      sections={[
        { h: "Objet", body: <p>KAMPLY permet de créer et de suivre des campagnes publicitaires Google Ads ou Meta Ads. Les présentes conditions encadrent l&apos;utilisation de la plateforme par tout titulaire d&apos;un compte.</p> },
        { h: "Compte", body: <p>Vous devez fournir des informations exactes et confirmer votre adresse e-mail. Vous êtes responsable de la confidentialité de votre mot de passe et de toute activité réalisée depuis votre compte.</p> },
        {
          h: "Campagnes et validation",
          body: (
            <>
              <p>Chaque annonce est vérifiée par notre équipe avant diffusion, en principe sous 24 heures. Nous pouvons refuser une annonce contraire à la loi ou aux règles publicitaires de Google ou de Meta ; le mois payé est alors recrédité sur votre portefeuille.</p>
              <p>Les résultats affichés (personnes touchées, clics, conversions, dépense) proviennent des plateformes publicitaires et peuvent être consolidés avec un léger décalage.</p>
            </>
          ),
        },
        { h: "Portefeuille et paiement", body: <p>Les formules sont facturées au mois et débitées de votre solde au lancement de la campagne. Le solde est alimenté par carte bancaire (Visa, Mastercard) via notre prestataire GeniusPay ; il est crédité dès la confirmation du paiement. Le paiement est encaissé en francs CFA à la parité fixe de 655,957 F CFA pour 1 € ; les frais de paiement par carte, affichés avant validation, s&apos;ajoutent au montant rechargé. Une campagne sans solde suffisant reste en brouillon.</p> },
        { h: "Pause et arrêt", body: <p>Vous pouvez mettre une campagne en pause ou la reprendre à tout moment depuis votre tableau de bord. Le mois entamé n&apos;est pas remboursé.</p> },
        { h: "Suppression du compte", body: <p>Vous pouvez supprimer votre compte depuis les paramètres. Cette suppression est définitive et entraîne l&apos;effacement de vos campagnes, statistiques et images.</p> },
        { h: "Contact", body: <p>Pour toute question : <a href="mailto:contact@kamply.site">contact@kamply.site</a>.</p> },
      ]}
    />
  );
}
