/**
 * Paiement par carte (GeniusPay) : conversion et frais, fonctions pures
 * partagées entre le serveur et la fenêtre de recharge.
 *
 * GeniusPay encaisse en francs CFA (XOF). Le franc CFA est arrimé à l'euro
 * à parité fixe : 1 € = 655,957 F CFA. Le solde KAMPLY reste en euros.
 *
 * Comme sur Bénin Events, les frais de carte sont ajoutés au montant payé :
 *   débité = recharge + frais ;  net = débité × (1 − taux) − fixe ≥ recharge
 */
export const XOF_PER_EUR = 655.957;

export type CardFeeConfig = {
  /** Pourcentage prélevé par GeniusPay (ex. 3). */
  percent: number;
  /** Montant fixe par transaction, en F CFA (ex. 100). */
  fixed: number;
};

/** Centimes d'euro → F CFA (arrondi au franc supérieur). */
export const centsToXof = (cents: number) => Math.ceil((cents / 100) * XOF_PER_EUR);
/** F CFA → centimes d'euro (arrondi au centime supérieur). */
export const xofToCents = (xof: number) => Math.ceil((xof / XOF_PER_EUR) * 100);

/** Frais de carte en F CFA, arrondis à la dizaine supérieure. */
export function cardFeeFor(totalXof: number, config: CardFeeConfig): number {
  if (totalXof <= 0) return 0;
  const rate = Math.min(Math.max(config.percent, 0), 49) / 100;
  const fixed = Math.max(config.fixed, 0);
  const gross = (totalXof + fixed) / (1 - rate);
  return Math.ceil((gross - totalXof) / 10) * 10;
}

/** Détail d'une recharge par carte : montant crédité, frais et total débité. */
export function cardTopupQuote(cents: number, config: CardFeeConfig) {
  const amountXof = centsToXof(cents);
  const feeXof = cardFeeFor(amountXof, config);
  return { amountXof, feeXof, totalXof: amountXof + feeXof, feeCents: xofToCents(feeXof), totalCents: cents + xofToCents(feeXof) };
}
