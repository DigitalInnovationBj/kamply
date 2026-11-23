import "server-only";
import { Resend } from "resend";
import { SITE } from "@/lib/site";
import type { ReactElement } from "react";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/** Expéditeur : domaine kamply.site vérifié sur Resend (surchargeable via EMAIL_FROM). */
const FROM = process.env.EMAIL_FROM ?? "KAMPLY <noreply@kamply.site>";
const REPLY_TO = process.env.EMAIL_REPLY_TO || SITE.email;
const devLogOn = () => process.env.NODE_ENV !== "production" || process.env.EMAIL_DEV_LOG === "1";

export type SendResult = { ok: true } | { ok: false; error: string };

export async function sendEmail({ to, subject, react, devLog }: { to: string; subject: string; react: ReactElement; devLog?: string }): Promise<SendResult> {
  if (devLogOn()) console.info(`[email] ${to} · ${subject}${devLog ? ` · ${devLog}` : ""}`);
  if (!resend) {
    console.warn("[email] RESEND_API_KEY absent : e-mail non envoyé.");
    return { ok: false, error: "Service d'e-mail non configuré." };
  }
  const { error } = await resend.emails.send({ from: FROM, to, subject, react, replyTo: REPLY_TO });
  if (error) {
    console.error("[email] échec de l'envoi :", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** Envoi groupé (un e-mail individuel par destinataire), par lots de 100. */
export async function sendBatch(items: { to: string; subject: string; react: ReactElement }[]) {
  let sent = 0;
  const failed: string[] = [];
  if (devLogOn()) items.forEach((i) => console.info(`[email] ${i.to} · ${i.subject}`));
  if (!resend) return { sent, failed: items.map((i) => i.to), error: "Service d'e-mail non configuré." };
  for (let i = 0; i < items.length; i += 100) {
    const chunk = items.slice(i, i + 100);
    const { error } = await resend.batch.send(chunk.map((c) => ({ from: FROM, to: c.to, subject: c.subject, react: c.react, replyTo: REPLY_TO })));
    if (error) {
      console.error("[email] échec d'un lot :", error.message);
      failed.push(...chunk.map((c) => c.to));
    } else sent += chunk.length;
  }
  return { sent, failed, error: failed.length ? "Certains e-mails n'ont pas pu être envoyés." : undefined };
}
