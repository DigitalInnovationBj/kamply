import { Button, Text } from "@react-email/components";
import { EmailLayout, emailButton, emailStyles } from "./Layout";

/** Suspension ou réactivation d'un compte par l'équipe. */
export function AccountStatusEmail({ name, banned, reason, until, url }: { name: string; banned: boolean; reason?: string | null; until?: string | null; url: string }) {
  const first = name.split(" ")[0] || name;
  if (!banned) {
    return (
      <EmailLayout preview="Votre compte KAMPLY est de nouveau actif">
        <Text style={emailStyles.h1}>Votre compte est réactivé.</Text>
        <Text style={emailStyles.p}>Bonjour {first}, vous pouvez à nouveau vous connecter et gérer vos campagnes.</Text>
        <Button href={url} style={emailButton}>
          Me connecter
        </Button>
      </EmailLayout>
    );
  }
  return (
    <EmailLayout preview="Votre compte KAMPLY est suspendu" footer="Pour toute question sur cette décision, répondez simplement à cet e-mail.">
      <Text style={emailStyles.h1}>Votre compte est suspendu.</Text>
      <Text style={emailStyles.p}>
        Bonjour {first}, notre équipe a suspendu votre compte KAMPLY{until ? ` jusqu'au ${until}` : ""}. Vos campagnes ne sont plus diffusées et vous ne pouvez plus vous connecter pendant cette période.
      </Text>
      {reason && (
        <Text style={{ ...emailStyles.p, background: "#f5f5f3", borderRadius: 16, padding: "14px 16px", color: "#0a0a0a" }}>
          <strong>Motif :</strong> {reason}
        </Text>
      )}
    </EmailLayout>
  );
}
