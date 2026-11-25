import "server-only";
import { db } from "@/lib/db";
import { SITE } from "@/lib/site";
import { formatEuros } from "@/lib/plans";
import { getCardPayment } from "./geniuspay";
import { sendEmail } from "./email";
import { TopupEmail } from "@/emails/TopupEmail";

export type TopupState = "PENDING" | "COMPLETED" | "REJECTED" | "CANCELLED";

const appUrl = () => process.env.BETTER_AUTH_URL ?? SITE.url;
const DAY = 86400_000;

/**
 * Revérifie une recharge par carte encore en attente directement auprès de GeniusPay
 * et applique le résultat. Appelée par le webhook, par la page de retour (polling)
 * et à l'affichage du portefeuille. Le crédit est atomique : une recharge n'est
 * jamais créditée deux fois, même si plusieurs vérifications arrivent ensemble.
 */
export async function reconcileTopup(id: string): Promise<TopupState> {
  const t = await db.walletTransaction.findUnique({ where: { id }, include: { wallet: { include: { user: { select: { name: true, email: true } } } } } });
  if (!t || t.type !== "TOPUP") throw new Error("Recharge introuvable.");
  if (t.status !== "PENDING" || t.method !== "CARD") return t.status as TopupState;

  const age = Date.now() - t.createdAt.getTime();
  if (!t.providerReference) {
    // Création du paiement interrompue : la recharge n'a jamais été payable.
    if (age > 3600_000) {
      await db.walletTransaction.updateMany({ where: { id, status: "PENDING" }, data: { status: "CANCELLED", processedAt: new Date(), note: "Paiement non initié." } });
      return "CANCELLED";
    }
    return "PENDING";
  }

  const check = await getCardPayment(t.providerReference);

  if (check.status === "SUCCESSFUL") {
    if (check.amount !== t.chargedAmount) {
      console.error("[recharge] montant incohérent", { id, attendu: t.chargedAmount, recu: check.amount });
      return "PENDING";
    }
    const credited = await db.$transaction(async (tx) => {
      const r = await tx.walletTransaction.updateMany({ where: { id, status: "PENDING" }, data: { status: "COMPLETED", processedAt: new Date() } });
      if (r.count !== 1) return null;
      return tx.wallet.update({ where: { id: t.walletId }, data: { balance: { increment: t.amount } } });
    });
    if (credited) {
      await sendEmail({
        to: t.wallet.user.email,
        subject: `${formatEuros(t.amount, { decimals: true })} crédités sur votre solde KAMPLY`,
        react: TopupEmail({
          name: t.wallet.user.name,
          amount: formatEuros(t.amount, { decimals: true }),
          balance: formatEuros(credited.balance, { decimals: true }),
          reference: t.reference,
          url: `${appUrl()}/app/portefeuille`,
        }),
      }).catch((e) => console.error("[recharge] e-mail :", e));
    }
    return "COMPLETED";
  }

  if (check.status === "FAILED") {
    await db.walletTransaction.updateMany({ where: { id, status: "PENDING" }, data: { status: "REJECTED", processedAt: new Date(), note: "Paiement refusé ou abandonné." } });
    return "REJECTED";
  }

  // Le lien de paiement GeniusPay expire après 24 h.
  if (age > DAY) {
    await db.walletTransaction.updateMany({ where: { id, status: "PENDING" }, data: { status: "CANCELLED", processedAt: new Date(), note: "Paiement non finalisé." } });
    return "CANCELLED";
  }
  return "PENDING";
}

/** Réconcilie les recharges récentes encore en attente d'un utilisateur (borné). */
export async function reconcilePendingTopups(userId: string) {
  const pending = await db.walletTransaction.findMany({
    where: { type: "TOPUP", status: "PENDING", method: "CARD", wallet: { userId }, createdAt: { gte: new Date(Date.now() - 2 * DAY) } },
    select: { id: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  await Promise.allSettled(pending.map((p) => reconcileTopup(p.id)));
}
