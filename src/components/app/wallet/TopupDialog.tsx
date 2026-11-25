"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IconCreditCard, IconLock, IconPlus } from "@tabler/icons-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SubmitButton, pulseState, type SubmitState } from "@/components/app/form/SubmitButton";
import { requestCardTopup } from "@/app/actions/wallet";
import { formatEuros } from "@/lib/plans";
import { cn } from "@/lib/utils";

const PRESETS = [150, 300, 600, 1200];

type Props = {
  cardEnabled: boolean;
  /** Montant proposé (ex. ce qu'il manque pour lancer une campagne), en euros. */
  suggested?: number;
  campaignId?: string;
  defaultOpen?: boolean;
};

/** Recharge du solde par carte bancaire (GeniusPay). */
export function TopupDialog({ cardEnabled, suggested, campaignId, defaultOpen }: Props) {
  const initial = suggested && !PRESETS.includes(suggested) ? String(suggested) : "";
  const [open, setOpen] = useState(!!defaultOpen && cardEnabled);
  const [amount, setAmount] = useState<number>(suggested && PRESETS.includes(suggested) ? suggested : 300);
  const [custom, setCustom] = useState(initial);
  const [state, setState] = useState<SubmitState>("idle");

  const value = custom ? Number(custom.replace(",", ".")) : amount;
  const invalid = !value || value < 50 || value > 10000;
  const cents = invalid ? 0 : Math.round(value * 100);

  const pay = async () => {
    if (invalid) return void pulseState(setState, "error");
    setState("loading");
    const r = await requestCardTopup({ amountEuros: value, campaignId });
    if (!r.ok) {
      toast.error(r.error);
      return void pulseState(setState, "error");
    }
    // Redirection vers la page de paiement sécurisée GeniusPay.
    window.location.assign(r.data!.redirectUrl);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => state !== "loading" && setOpen(o)}>
      <DialogTrigger asChild>
        <button type="button" className="group inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-[16px] font-extrabold text-black transition-colors duration-300 hover:bg-[#f5f5f3] sm:w-auto sm:self-start">
          <IconPlus size={20} stroke={2.6} className="transition-transform duration-500 group-hover:rotate-90" /> Recharger mon solde
        </button>
      </DialogTrigger>
      <DialogContent className="app-surface !min-h-0 max-h-[92svh] overflow-y-auto rounded-3xl border-0 p-6 sm:max-w-[460px] sm:p-7">
        <DialogHeader className="text-left">
          <DialogTitle className="text-[24px] font-black tracking-[-0.03em]">Recharger mon solde</DialogTitle>
          <DialogDescription className="text-[15px]">Paiement immédiat par carte bancaire. Le montant est crédité dès la confirmation du paiement.</DialogDescription>
        </DialogHeader>

        {!cardEnabled ? (
          <p className="mt-2 rounded-2xl bg-muted px-4 py-4 text-sm leading-relaxed">Le paiement par carte sera disponible très bientôt. Écrivez-nous à contact@kamply.site si vous souhaitez recharger dès maintenant.</p>
        ) : (
          <>
            <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Montant">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={!custom && amount === p}
                  onClick={() => {
                    setAmount(p);
                    setCustom("");
                  }}
                  className={cn("h-16 rounded-2xl text-[22px] font-black tabular-nums tracking-[-0.03em] transition-all duration-300", !custom && amount === p ? "bg-black text-[#f5f5f3]" : "bg-muted hover:bg-[#dcdcd6]")}
                >
                  {p} €
                </button>
              ))}
            </div>
            <label className="kf mt-2">
              <span className="kf-label">Autre montant</span>
              <span className="kf-box">
                <span className="kf-icon font-black" aria-hidden="true">
                  €
                </span>
                <input className="kf-input" inputMode="decimal" placeholder="Entre 50 et 10 000" value={custom} onChange={(e) => setCustom(e.target.value.replace(/[^\d,.]/g, ""))} aria-invalid={!!custom && invalid} />
              </span>
              {custom && invalid && (
                <span className="kf-msg" data-tone="error">
                  Montant entre 50 € et 10 000 €.
                </span>
              )}
            </label>

            {!invalid && (
              <p className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3.5 text-sm">
                <span className="text-muted-foreground">Crédité sur votre solde, sans frais</span>
                <strong className="text-[18px] font-black tabular-nums tracking-[-0.02em]">{formatEuros(cents, { decimals: true })}</strong>
              </p>
            )}

            <div className="mt-4">
              <SubmitButton type="button" state={state} onClick={pay} disabled={invalid}>
                <IconCreditCard size={19} /> {state === "loading" ? "Redirection vers le paiement…" : !invalid ? `Payer ${formatEuros(cents, { decimals: true })}` : "Payer par carte"}
              </SubmitButton>
            </div>
            <p className="mt-3 flex items-start justify-center gap-1.5 text-center text-[12px] leading-relaxed text-muted-foreground">
              <IconLock size={13} className="mt-0.5 flex-none" />
              <span>Visa et Mastercard. Paiement sécurisé par GeniusPay.</span>
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
