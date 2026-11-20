"use client";

import { useSearchParams } from "next/navigation";
import { IconCircleCheck } from "@tabler/icons-react";

/** Message de confirmation après une réinitialisation de mot de passe réussie. */
export function ResetNotice() {
  const params = useSearchParams();
  if (!params.get("reinitialise")) return null;
  return (
    <p className="rise mb-5 flex items-center gap-2.5 rounded-2xl bg-[#18cccd]/20 px-4 py-3 text-sm font-semibold text-foreground" role="status">
      <IconCircleCheck size={20} stroke={2.2} className="text-signal-ink" /> Mot de passe modifié. Connectez-vous avec le nouveau.
    </p>
  );
}
