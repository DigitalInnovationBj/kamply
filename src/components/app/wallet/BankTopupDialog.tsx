"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { IconBuildingBank, IconCheck, IconCopy, IconPlus } from "@tabler/icons-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SubmitButton, pulseState, type SubmitState } from "@/components/app/form/SubmitButton";
import { requestTopup } from "@/app/actions/wallet";
import { formatEuros } from "@/lib/plans";
import { cn } from "@/lib/utils";

const PRESETS = [150, 300, 600, 1200];

/** Coordonnées bancaires affichées au client (à configurer via les variables d'environnement). */
const BANK = {
  holder: process.env.NEXT_PUBLIC_BANK_HOLDER || "KAMPLY",
  iban: process.env.NEXT_PUBLIC_BANK_IBAN || "À définir",
  bic: process.env.NEXT_PUBLIC_BANK_BIC || "À définir",
};

/** Recharge par virement (masquée : remplacée par le paiement par carte, réactivable via BANK_TRANSFER_ENABLED). */
export function BankTopupDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(300);
  const [custom, setCustom] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [result, setResult] = useState<{ reference: string; amount: number } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const value = custom ? Number(custom.replace(",", ".")) : amount;
  const invalid = !value || value < 50 || value > 10000;

  const submit = async () => {
    if (invalid) return void pulseState(setState, "error");
    setState("loading");
    const r = await requestTopup(value);
    if (!r.ok) {
      toast.error(r.error);
      return void pulseState(setState, "error");
    }
    await pulseState(setState, "success", 900);
    setState("idle");
    setResult(r.data!);
    router.refresh();
  };

  const copy = async (k: string, v: string) => {
    await navigator.clipboard.writeText(v);
    setCopied(k);
    setTimeout(() => setCopied(null), 1600);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setTimeout(() => setResult(null), 300);
      }}
    >
      <DialogTrigger asChild>
        <button type="button" className="group inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-[16px] font-extrabold text-black transition-colors duration-300 hover:bg-[#f5f5f3] sm:w-auto sm:self-start">
          <IconPlus size={20} stroke={2.6} className="transition-transform duration-500 group-hover:rotate-90" /> Recharger mon solde
        </button>
      </DialogTrigger>
      <DialogContent className="app-surface !min-h-0 max-h-[92svh] overflow-y-auto rounded-3xl border-0 p-6 sm:max-w-[460px] sm:p-7">
        {!result ? (
          <>
            <DialogHeader className="text-left">
              <DialogTitle className="text-[24px] font-black tracking-[-0.03em]">Recharger mon solde</DialogTitle>
              <DialogDescription className="text-[15px]">Choisissez un montant. Vous recevrez une référence à indiquer sur votre virement.</DialogDescription>
            </DialogHeader>
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
                  className={cn(
                    "h-16 rounded-2xl text-[22px] font-black tabular-nums tracking-[-0.03em] transition-all duration-300",
                    !custom && amount === p ? "bg-black text-[#f5f5f3]" : "bg-muted hover:bg-[#dcdcd6]",
                  )}
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
                <input
                  className="kf-input"
                  inputMode="decimal"
                  placeholder="Entre 50 et 10 000"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value.replace(/[^\d,.]/g, ""))}
                  aria-invalid={!!custom && invalid}
                />
              </span>
              {custom && invalid && (
                <span className="kf-msg" data-tone="error">
                  Montant entre 50 € et 10 000 €.
                </span>
              )}
            </label>
            <div className="mt-4">
              <SubmitButton type="button" state={state} onClick={submit} disabled={invalid}>
                Demander {invalid ? "" : formatEuros(Math.round(value * 100))}
              </SubmitButton>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">Paiement par carte bientôt disponible.</p>
          </>
        ) : (
          <>
            <DialogHeader className="text-left">
              <span className="mb-2 grid size-12 place-items-center rounded-2xl bg-[#18cccd] text-black" aria-hidden="true">
                <IconBuildingBank size={24} />
              </span>
              <DialogTitle className="text-[24px] font-black tracking-[-0.03em]">Plus qu&apos;un virement</DialogTitle>
              <DialogDescription className="text-[15px]">
                Faites un virement de <strong className="text-foreground">{formatEuros(result.amount, { decimals: true })}</strong> avec la référence ci-dessous. Votre solde est crédité dès réception, en général sous 1 à 2 jours ouvrés.
              </DialogDescription>
            </DialogHeader>
            <dl className="mt-2 grid gap-px overflow-hidden rounded-2xl bg-border">
              {[
                ["Référence", result.reference, true],
                ["Bénéficiaire", BANK.holder, false],
                ["IBAN", BANK.iban, false],
                ["BIC", BANK.bic, false],
              ].map(([k, v, strong]) => (
                <div key={String(k)} className="flex items-center gap-3 bg-card px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <dt className="text-[12px] font-semibold text-muted-foreground">{k}</dt>
                    <dd className={cn("m-0 break-all font-mono text-[15px] font-bold", strong && "text-[#bf3d0c]")}>{v}</dd>
                  </div>
                  <button
                    type="button"
                    onClick={() => copy(String(k), String(v))}
                    className="grid size-10 flex-none place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={`Copier ${k}`}
                  >
                    {copied === k ? <IconCheck size={18} className="text-[#08787a]" /> : <IconCopy size={18} />}
                  </button>
                </div>
              ))}
            </dl>
            <button type="button" onClick={() => setOpen(false)} className="mt-4 h-12 w-full rounded-full bg-black text-[15px] font-bold text-[#f5f5f3] hover:bg-primary hover:text-black">
              C&apos;est noté
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
