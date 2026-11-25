import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/server/geniuspay";
import { reconcileTopup } from "@/lib/server/topups";

/**
 * Webhook GeniusPay (recharges par carte).
 * Le contenu n'est qu'un signal : la recharge est retrouvée par sa référence,
 * puis revérifiée auprès de l'API avant tout crédit.
 */
const MAX_AGE_SECONDS = 5 * 60; // fenêtre anti-rejeu

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const timestamp = req.headers.get("x-webhook-timestamp");
  const signature = req.headers.get("x-webhook-signature");

  if (!verifyWebhookSignature(rawBody, timestamp, signature)) return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > MAX_AGE_SECONDS) return NextResponse.json({ error: "Notification expirée" }, { status: 400 });

  let payload: { data?: { transaction?: { reference?: string; external_reference?: string; metadata?: { topupId?: string } } } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const t = payload.data?.transaction;
  const topup = await db.walletTransaction.findFirst({
    where: {
      method: "CARD",
      OR: [
        ...(t?.reference ? [{ providerReference: t.reference }] : []),
        ...(t?.external_reference ? [{ reference: t.external_reference }] : []),
        ...(t?.metadata?.topupId ? [{ id: t.metadata.topupId }] : []),
      ],
    },
    select: { id: true },
  });
  // Paiement inconnu (autre application sur le même compte, test…) : accusé de réception.
  if (!topup) return NextResponse.json({ received: true });

  try {
    const status = await reconcileTopup(topup.id);
    return NextResponse.json({ received: true, status });
  } catch (e) {
    console.error("[GeniusPay webhook] réconciliation :", e);
    return NextResponse.json({ error: "Réconciliation impossible" }, { status: 500 });
  }
}
