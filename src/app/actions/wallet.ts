"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { ActionResult } from "./profile";

const MIN = 5000; // 50 €
const MAX = 1000000; // 10 000 €

/**
 * Demande de recharge (sans passerelle de paiement pour l'instant) :
 * l'utilisateur fait un virement avec la référence, un administrateur valide à réception.
 */
export async function requestTopup(amountEuros: number): Promise<ActionResult<{ reference: string; amount: number }>> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Session expirée. Reconnectez-vous." };
  const parsed = z.number().finite().safeParse(amountEuros);
  if (!parsed.success) return { ok: false, error: "Montant invalide." };
  const amount = Math.round(parsed.data * 100);
  if (amount < MIN) return { ok: false, error: "Montant minimum : 50 €." };
  if (amount > MAX) return { ok: false, error: "Montant maximum : 10 000 € par recharge." };

  const wallet = await db.wallet.upsert({ where: { userId: session.user.id }, update: {}, create: { userId: session.user.id } });
  const pending = await db.walletTransaction.count({ where: { walletId: wallet.id, type: "TOPUP", status: "PENDING" } });
  if (pending >= 3) return { ok: false, error: "Vous avez déjà 3 recharges en attente. Attendez leur validation ou annulez-en une." };

  const reference = `KMP-${Date.now().toString(36).toUpperCase().slice(-6)}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
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
