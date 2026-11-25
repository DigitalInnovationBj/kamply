"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { SITE } from "@/lib/site";
import { cardTopupQuote } from "@/lib/card-fee";
import { createCardPayment, geniusPayFeeConfig, geniusPayReady } from "@/lib/server/geniuspay";
import { reconcileTopup, type TopupState } from "@/lib/server/topups";
import type { ActionResult } from "./profile";

const MIN = 5000; // 50 €
const MAX = 1000000; // 10 000 €

/** Virement bancaire : désactivé (paiement par carte uniquement). Réactivable avec BANK_TRANSFER_ENABLED=1. */
const BANK_TRANSFER_ENABLED = process.env.BANK_TRANSFER_ENABLED === "1";

const newReference = () => `KMP-${Date.now().toString(36).toUpperCase().slice(-6)}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

/**
 * Recharge par carte (GeniusPay) : crée la recharge en attente, puis renvoie
 * l'URL de la page de paiement sécurisée. Le solde n'est crédité qu'après
 * revérification du paiement auprès de GeniusPay (webhook ou page de retour).
 */
export async function requestCardTopup(input: { amountEuros: number; campaignId?: string }): Promise<ActionResult<{ redirectUrl: string }>> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Session expirée. Reconnectez-vous." };
  if (!geniusPayReady()) return { ok: false, error: "Le paiement par carte n'est pas encore disponible." };
  const parsed = z.object({ amountEuros: z.number().finite(), campaignId: z.string().max(40).optional() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Montant invalide." };
  const amount = Math.round(parsed.data.amountEuros * 100);
  if (amount < MIN) return { ok: false, error: "Montant minimum : 50 €." };
  if (amount > MAX) return { ok: false, error: "Montant maximum : 10 000 € par recharge." };

  const { user } = session;
  const wallet = await db.wallet.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });
  const recent = await db.walletTransaction.count({ where: { walletId: wallet.id, type: "TOPUP", status: "PENDING", createdAt: { gte: new Date(Date.now() - 3600_000) } } });
  if (recent >= 5) return { ok: false, error: "Trop de paiements en cours. Patientez quelques minutes ou annulez une recharge en attente." };

  const quote = cardTopupQuote(amount, geniusPayFeeConfig());
  const reference = newReference();
  const tx = await db.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: "TOPUP",
      status: "PENDING",
      amount,
      fee: quote.feeCents,
      chargedAmount: quote.totalXof,
      chargedCurrency: "XOF",
      method: "CARD",
      reference,
      label: "Recharge par carte",
      campaignId: parsed.data.campaignId ?? null,
    },
  });

  const base = `${process.env.BETTER_AUTH_URL ?? SITE.url}/app/portefeuille/retour?recharge=${tx.id}${parsed.data.campaignId ? `&campagne=${parsed.data.campaignId}` : ""}`;
  try {
    const card = await createCardPayment({
      amountXof: quote.totalXof,
      description: `Recharge KAMPLY ${reference}`,
      externalReference: reference,
      customer: { name: user.name, email: user.email },
      successUrl: base,
      errorUrl: `${base}&echec=1`,
      metadata: { topupId: tx.id, userId: user.id },
    });
    await db.walletTransaction.update({ where: { id: tx.id }, data: { providerReference: card.reference } });
    revalidatePath("/app", "layout");
    return { ok: true, data: { redirectUrl: card.redirectUrl } };
  } catch (e) {
    console.error("[recharge] GeniusPay :", e);
    await db.walletTransaction.update({ where: { id: tx.id }, data: { status: "CANCELLED", processedAt: new Date(), note: "Paiement indisponible." } });
    return { ok: false, error: "Le paiement par carte est indisponible pour le moment. Réessayez dans quelques minutes." };
  }
}

/** État d'une recharge, revérifié auprès de GeniusPay (page de retour). */
export async function checkTopup(id: string): Promise<ActionResult<{ status: TopupState; amount: number; balance: number }>> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Session expirée. Reconnectez-vous." };
  const t = await db.walletTransaction.findFirst({ where: { id, type: "TOPUP", wallet: { userId: session.user.id } }, select: { id: true, amount: true } });
  if (!t) return { ok: false, error: "Recharge introuvable." };
  let status: TopupState;
  try {
    status = await reconcileTopup(t.id);
  } catch (e) {
    console.error("[recharge] vérification :", e);
    status = "PENDING";
  }
  const wallet = await db.wallet.findUnique({ where: { userId: session.user.id } });
  if (status !== "PENDING") revalidatePath("/app", "layout");
  return { ok: true, data: { status, amount: t.amount, balance: wallet?.balance ?? 0 } };
}

/** Recharge par virement (masquée : BANK_TRANSFER_ENABLED). */
export async function requestTopup(amountEuros: number): Promise<ActionResult<{ reference: string; amount: number }>> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Session expirée. Reconnectez-vous." };
  if (!BANK_TRANSFER_ENABLED) return { ok: false, error: "Le virement bancaire n'est plus proposé. Rechargez par carte." };
  const parsed = z.number().finite().safeParse(amountEuros);
  if (!parsed.success) return { ok: false, error: "Montant invalide." };
  const amount = Math.round(parsed.data * 100);
  if (amount < MIN) return { ok: false, error: "Montant minimum : 50 €." };
  if (amount > MAX) return { ok: false, error: "Montant maximum : 10 000 € par recharge." };

  const wallet = await db.wallet.upsert({ where: { userId: session.user.id }, update: {}, create: { userId: session.user.id } });
  const pending = await db.walletTransaction.count({ where: { walletId: wallet.id, type: "TOPUP", status: "PENDING" } });
  if (pending >= 3) return { ok: false, error: "Vous avez déjà 3 recharges en attente. Attendez leur validation ou annulez-en une." };

  const reference = newReference();
  await db.walletTransaction.create({
    data: { walletId: wallet.id, type: "TOPUP", status: "PENDING", amount, method: "BANK_TRANSFER", reference, label: "Recharge par virement" },
  });
  revalidatePath("/app", "layout");
  return { ok: true, data: { reference, amount } };
}

export async function cancelTopup(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Session expirée. Reconnectez-vous." };
  const tx = await db.walletTransaction.findFirst({ where: { id, type: "TOPUP", status: "PENDING", wallet: { userId: session.user.id } } });
  if (!tx) return { ok: false, error: "Cette recharge ne peut plus être annulée." };
  await db.walletTransaction.update({ where: { id }, data: { status: "CANCELLED", processedAt: new Date() } });
  revalidatePath("/app", "layout");
  return { ok: true };
}
