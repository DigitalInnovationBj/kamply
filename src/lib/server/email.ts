import "server-only";
import { Resend } from "resend";
import type { ReactElement } from "react";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Expéditeur : sans domaine vérifié sur Resend, seul onboarding@resend.dev est accepté
 * et les e-mails n'arrivent qu'à l'adresse du compte Resend.
 */
const FROM = process.env.EMAIL_FROM ?? "KAMPLY <onboarding@resend.dev>";

export async function sendEmail({ to, subject, react, devLog }: { to: string; subject: string; react: ReactElement; devLog?: string }) {
  if ((process.env.NODE_ENV !== "production" || process.env.EMAIL_DEV_LOG === "1") && devLog) {
    console.info(`[email] ${to} · ${subject} · ${devLog}`);
  }
  if (!resend) {
    console.warn("[email] RESEND_API_KEY absent : e-mail non envoyé.");
    return;
  }
  const { error } = await resend.emails.send({ from: FROM, to, subject, react });
  if (error) console.error("[email] échec de l'envoi :", error.message);
}
