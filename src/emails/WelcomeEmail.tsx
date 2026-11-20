import { Button, Text } from "@react-email/components";
import { EmailLayout, emailStyles } from "./Layout";

export function WelcomeEmail({ name, url }: { name: string; url: string }) {
  const first = name.split(" ")[0] || name;
  return (
    <EmailLayout preview="Votre compte KAMPLY est prêt">
      <Text style={emailStyles.h1}>Bienvenue, {first}.</Text>
      <Text style={emailStyles.p}>
        Votre compte est activé. Complétez votre profil puis créez votre première campagne Google Ads ou Meta Ads : elle est prête en 5 minutes.
      </Text>
      <Button
        href={url}
        style={{ display: "inline-block", background: "#ff5b23", color: "#000", fontWeight: 800, fontSize: 15, padding: "14px 26px", borderRadius: 999, textDecoration: "none" }}
      >
        Ouvrir mon espace
      </Button>
    </EmailLayout>
  );
}
