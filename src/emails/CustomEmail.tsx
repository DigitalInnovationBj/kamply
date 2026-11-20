import { Button, Text } from "@react-email/components";
import { EmailLayout, emailButton, emailStyles } from "./Layout";

/** Message libre envoyé par l'équipe depuis l'administration. */
export function CustomEmail({ title, body, ctaLabel, ctaUrl }: { title?: string; body: string; ctaLabel?: string; ctaUrl?: string }) {
  const paragraphs = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return (
    <EmailLayout preview={(title || paragraphs[0] || "").slice(0, 110)} footer="Message envoyé par l'équipe KAMPLY. Vous pouvez y répondre directement.">
      {title && <Text style={emailStyles.h1}>{title}</Text>}
      {paragraphs.map((p, i) => (
        <Text key={i} style={{ ...emailStyles.p, whiteSpace: "pre-line" }}>
          {p}
        </Text>
      ))}
      {ctaLabel && ctaUrl && (
        <Button href={ctaUrl} style={emailButton}>
          {ctaLabel}
        </Button>
      )}
    </EmailLayout>
  );
}
