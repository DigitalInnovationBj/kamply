/**
 * Paiement par carte (GeniusPay) : conversion, fonction pure.
 *
 * Tout est affiché en euros. GeniusPay encaisse en francs CFA (XOF), arrimés
 * à l'euro à parité fixe : 1 € = 655,957 F CFA. La conversion ne sert qu'à
 * l'appel au prestataire et à la vérification du montant encaissé.
 * Les frais de carte sont absorbés par KAMPLY : le client paie le montant crédité.
 */
export const XOF_PER_EUR = 655.957;

/** Centimes d'euro → F CFA (arrondi au franc supérieur). */
export const centsToXof = (cents: number) => Math.ceil((cents / 100) * XOF_PER_EUR);
