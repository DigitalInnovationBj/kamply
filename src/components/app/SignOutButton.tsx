"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconLoader2, IconLogout } from "@tabler/icons-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function SignOutButton({ variant = "ghost", className }: { variant?: "ghost" | "menu"; className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const out = async () => {
    setBusy(true);
    await authClient.signOut();
    router.replace("/connexion");
    router.refresh();
  };
  return (
    <button
      type="button"
      onClick={out}
      disabled={busy}
      className={cn(
        variant === "ghost" &&
          "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      {busy ? <IconLoader2 size={16} className="animate-spin" /> : <IconLogout size={16} stroke={2.2} />} Se déconnecter
    </button>
  );
}
