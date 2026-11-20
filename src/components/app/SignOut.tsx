"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { authClient } from "@/lib/auth-client";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Déconnexion confirmée, puis « fin de diffusion » : l'écran se replie
 * en une ligne puis en un point, comme un téléviseur qu'on éteint.
 */
export function SignOutDialog({ open, onOpenChange, name }: { open: boolean; onOpenChange: (o: boolean) => void; name?: string }) {
  const [leaving, setLeaving] = useState(false);
  const first = name?.split(" ")[0];

  const confirm = async () => {
    onOpenChange(false);
    setLeaving(true);
    // L'animation et la déconnexion avancent en parallèle.
    await Promise.all([authClient.signOut().catch(() => null), wait(1900)]);
    window.location.replace("/connexion");
    return true;
  };

  return (
    <>
      <ConfirmDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Se déconnecter ?"
        description="Vous devrez saisir à nouveau votre e-mail et votre mot de passe. Vos campagnes continuent d'être diffusées."
        confirmLabel="Se déconnecter"
        onConfirm={confirm}
      />
      {leaving &&
        createPortal(
          <div className="tv-off" role="status" aria-live="assertive">
            <div className="tv-off-screen">
              <span className="tv-off-logo">KAMPLY</span>
            </div>
            <span className="tv-off-dot" aria-hidden="true" />
            <p className="tv-off-text">{first ? `À bientôt, ${first}.` : "À bientôt."}</p>
          </div>,
          document.body,
        )}
    </>
  );
}

/** Bouton autonome (onboarding, paramètres). */
export function SignOutButton({ name, className }: { name?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        }
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2M9 12h12l-3-3M18 15l3-3" />
        </svg>
        Se déconnecter
      </button>
      <SignOutDialog open={open} onOpenChange={setOpen} name={name} />
    </>
  );
}
