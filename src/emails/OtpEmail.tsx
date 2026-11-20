import { Section, Text } from "@react-email/components";
import { EmailLayout, emailStyles } from "./Layout";

export type OtpKind = "email-verification" | "forget-password" | "sign-in" | "change-email";

const COPY: Record<OtpKind, { subject: string; title: string; text: string }> = {
  "email-verification": {
    subject: "Votre code de vérification KAMPLY",
    title: "Confirmez votre adresse e-mail",
    text: "Saisissez ce code dans KAMPLY pour activer votre compte.",
  },
  "forget-password": {
    subject: "Réinitialisation de votre mot de passe KAMPLY",
    title: "Réinitialisez votre mot de passe",
    text: "Saisissez ce code pour choisir un nouveau mot de passe.",
  },
  "sign-in": {
    subject: "Votre code de connexion KAMPLY",
    title: "Votre code de connexion",
    text: "Saisissez ce code pour vous connecter à KAMPLY.",
  },
  "change-email": {
    subject: "Confirmez votre nouvelle adresse e-mail",
    title: "Confirmez votre nouvelle adresse",
    text: "Saisissez ce code pour confirmer le changement d'adresse e-mail.",
  },
};

export function otpSubject(kind: OtpKind) {
  return COPY[kind].subject;
}

export function OtpEmail({ otp, kind }: { otp: string; kind: OtpKind }) {
  const c = COPY[kind];
  return (
    <EmailLayout preview={`${otp} est votre code KAMPLY`}>
      <Text style={emailStyles.h1}>{c.title}</Text>
      <Text style={emailStyles.p}>{c.text}</Text>
      <Section style={{ background: "#000", borderRadius: 18, padding: "22px 0", textAlign: "center", margin: "8px 0 18px" }}>
        <Text style={{ margin: 0, fontSize: 38, lineHeight: "40px", fontWeight: 900, letterSpacing: "0.32em", color: "#ff5b23", paddingLeft: "0.32em" }}>{otp}</Text>
      </Section>
      <Text style={{ ...emailStyles.p, fontSize: 13, color: "#8a8a84" }}>Ce code expire dans 10 minutes. Ne le partagez avec personne, même avec l&apos;équipe KAMPLY.</Text>
    </EmailLayout>
  );
}
