"use client";

import { useState, type ReactNode } from "react";
import { IconAlertTriangle, IconHelpCircle, IconLoader2 } from "@tabler/icons-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type Props = {
  trigger?: ReactNode;
  /** Mode contrôlé (ouverture depuis un menu, par exemple). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  tone?: "danger" | "primary";
  /** Mot à recopier pour confirmer (décisions irréversibles). */
  requireText?: string;
  /** Contenu supplémentaire (ex. champ mot de passe). */
  children?: ReactNode;
  /** Retourne true pour fermer la fenêtre, false pour la laisser ouverte (erreur). */
  onConfirm: () => Promise<boolean | void> | boolean | void;
  disabled?: boolean;
};

/** Fenêtre de confirmation avant toute décision importante. */
export function ConfirmDialog({ trigger, open: openProp, onOpenChange, title, description, confirmLabel, tone = "primary", requireText, children, onConfirm, disabled }: Props) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (o: boolean) => {
    setOpenState(o);
    onOpenChange?.(o);
  };
  const [busy, setBusy] = useState(false);
  const [typed, setTyped] = useState("");
  const blocked = (requireText ? typed.trim().toUpperCase() !== requireText.toUpperCase() : false) || disabled;

  const confirm = async () => {
    setBusy(true);
    const res = await onConfirm();
    setBusy(false);
    if (res !== false) {
      setOpen(false);
      setTyped("");
    }
  };

  const Icon = tone === "danger" ? IconAlertTriangle : IconHelpCircle;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        if (!busy) {
          setOpen(o);
          if (!o) setTyped("");
        }
      }}
    >
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent className="app-surface !min-h-0 rounded-3xl border-0 p-6 sm:max-w-[440px] sm:p-7">
        <AlertDialogHeader className="items-start text-left">
          <span className={cn("mb-2 grid size-12 place-items-center rounded-2xl", tone === "danger" ? "bg-destructive/12 text-destructive" : "bg-black text-primary")} aria-hidden="true">
            <Icon size={24} stroke={2} />
          </span>
          <AlertDialogTitle className="text-[22px] font-black leading-tight tracking-[-0.03em]">{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-[15px] leading-relaxed text-muted-foreground">{description}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {children}

        {requireText && (
          <label className="grid gap-2 text-sm font-semibold">
            <span>
              Tapez <strong className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-foreground">{requireText}</strong> pour confirmer
            </span>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              className="h-12 rounded-2xl bg-white px-4 text-base font-semibold shadow-[inset_0_0_0_1.5px_var(--input)] outline-none focus:shadow-[inset_0_0_0_2px_var(--foreground)]"
            />
          </label>
        )}

        <AlertDialogFooter className="mt-2 flex-col-reverse gap-2 sm:flex-row">
          <AlertDialogCancel disabled={busy} className="h-12 rounded-full border-0 bg-muted px-6 text-[15px] font-bold shadow-none hover:bg-[#dcdcd6]">
            Annuler
          </AlertDialogCancel>
          <button
            type="button"
            onClick={confirm}
            disabled={busy || blocked}
            className={cn(
              "inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-bold transition-colors disabled:opacity-40",
              tone === "danger" ? "bg-destructive text-white hover:bg-[#b42318]" : "bg-primary text-black hover:bg-black hover:text-[#f5f5f3]",
            )}
          >
            {busy && <IconLoader2 size={18} className="animate-spin" />}
            {confirmLabel}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
