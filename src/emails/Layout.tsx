import { Body, Container, Head, Hr, Html, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

const font = "'Satoshi','Helvetica Neue',Helvetica,Arial,sans-serif";

/** Gabarit commun des e-mails KAMPLY : fond clair, carte blanche, logo texte. */
export function EmailLayout({ preview, children }: { preview: string; children: ReactNode }) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, padding: "32px 12px", background: "#f5f5f3", fontFamily: font, color: "#0a0a0a" }}>
        <Container style={{ maxWidth: 520, margin: "0 auto", background: "#ffffff", borderRadius: 24, padding: "36px 32px" }}>
          <Text style={{ margin: 0, fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em", color: "#000" }}>
            KAMPLY<span style={{ color: "#ff5b23" }}>.</span>
          </Text>
          <Section style={{ marginTop: 28 }}>{children}</Section>
          <Hr style={{ borderColor: "#ebebe7", margin: "32px 0 20px" }} />
          <Text style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: "#8a8a84" }}>
            Vous recevez cet e-mail car une action a été effectuée sur votre compte KAMPLY. Si ce n&apos;est pas vous, ignorez simplement ce message.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const emailStyles = {
  h1: { margin: "0 0 12px", fontSize: 26, lineHeight: "30px", fontWeight: 900, letterSpacing: "-0.03em" },
  p: { margin: "0 0 16px", fontSize: 15, lineHeight: "24px", color: "#3a3a37" },
} as const;
