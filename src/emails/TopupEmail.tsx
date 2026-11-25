import { Button, Text } from "@react-email/components";
import { EmailLayout, emailButton, emailStyles } from "./Layout";

/** Reçu de recharge par carte. */
export function TopupEmail({ name, amount, balance, reference, url }: { name: string; amount: string; balance: string; reference: string; url: string }) {
  const first = name.split(" ")[0] || name;
  return (
    <EmailLayout preview={`${amount} crédités sur votre solde KAMPLY`}>
      <Text style={emailStyles.h1}>{amount} crédités.</Text>
      <Text style={emailStyles.p}>Bonjour {first}, votre paiement par carte est confirmé. Votre solde est maintenant de {balance}.</Text>
      <Text style={{ ...emailStyles.p, background: "#f5f5f3", borderRadius: 16, padding: "14px 16px", color: "#0a0a0a" }}>
        Référence : <strong>{reference}</strong>
      </Text>
      <Button href={url} style={emailButton}>
        Voir mon portefeuille
      </Button>
    </EmailLayout>
  );
}
