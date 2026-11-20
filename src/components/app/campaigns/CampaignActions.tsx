"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconPlayerPause, IconPlayerPlay, IconRocket, IconTrash } from "@tabler/icons-react";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { deleteDraft, launchDraft, toggleCampaign } from "@/app/actions/campaigns";
import { formatEuros } from "@/lib/plans";
import type { CampaignStatusKey } from "@/lib/campaigns";

const btn = "inline-flex h-12 items-center gap-2 rounded-full px-5 text-[15px] font-bold transition-colors duration-300";

/** Actions disponibles selon le statut, toutes précédées d'une confirmation. */
export function CampaignActions({ id, name, status, price, balance }: { id: string; name: string; status: CampaignStatusKey; price: number; balance: number }) {
  const router = useRouter();

  if (status === "ACTIVE" || status === "PAUSED") {
    const pausing = status === "ACTIVE";
    return (
      <ConfirmDialog
        title={pausing ? "Mettre en pause ?" : "Reprendre la diffusion ?"}
        description={pausing ? <>« {name} » ne sera plus diffusée jusqu&apos;à sa reprise. Vos statistiques sont conservées.</> : <>« {name} » sera à nouveau diffusée dans les prochaines heures.</>}
        confirmLabel={pausing ? "Mettre en pause" : "Reprendre"}
        onConfirm={async () => {
          const r = await toggleCampaign(id);
          if (!r.ok) {
            toast.error(r.error);
            return false;
          }
          toast.success(pausing ? "Campagne mise en pause." : "Diffusion reprise.");
          router.refresh();
        }}
        trigger={
          <button type="button" className={`${btn} ${pausing ? "bg-black text-[#f5f5f3] hover:bg-primary hover:text-black" : "bg-primary text-black hover:bg-black hover:text-[#f5f5f3]"}`}>
            {pausing ? <IconPlayerPause size={18} /> : <IconPlayerPlay size={18} />} {pausing ? "Mettre en pause" : "Reprendre"}
          </button>
        }
      />
    );
  }

  if (status === "DRAFT" || status === "REJECTED") {
    return (
      <>
        {status === "DRAFT" && (
          <ConfirmDialog
            title="Lancer la campagne ?"
            description={
              balance >= price ? (
                <>
                  <strong className="text-foreground">{formatEuros(price, { decimals: true })}</strong> seront débités de votre portefeuille pour le premier mois. L&apos;annonce part ensuite en validation.
                </>
              ) : (
                <>Votre solde ({formatEuros(balance, { decimals: true })}) ne couvre pas le premier mois ({formatEuros(price, { decimals: true })}). Rechargez votre portefeuille d&apos;abord.</>
              )
            }
            confirmLabel={balance >= price ? `Payer ${formatEuros(price)} et lancer` : "Recharger mon portefeuille"}
            onConfirm={async () => {
              if (balance < price) {
                router.push(`/app/portefeuille?campagne=${id}`);
                return true;
              }
              const r = await launchDraft(id);
              if (!r.ok) {
                toast.error(r.error);
                return false;
              }
              toast.success("Campagne envoyée en validation.");
              router.refresh();
            }}
            trigger={
              <button type="button" className={`${btn} bg-primary text-black hover:bg-black hover:text-[#f5f5f3]`}>
                <IconRocket size={18} /> Lancer
              </button>
            }
          />
        )}
        <ConfirmDialog
          tone="danger"
          title="Supprimer cette campagne ?"
          description={<>« {name} » et son visuel seront supprimés définitivement. Cette action est irréversible.</>}
          confirmLabel="Supprimer"
          onConfirm={async () => {
            const r = await deleteDraft(id);
            if (!r.ok) {
              toast.error(r.error);
              return false;
            }
            toast.success("Campagne supprimée.");
            router.replace("/app/campagnes");
          }}
          trigger={
            <button type="button" className={`${btn} bg-card text-destructive shadow-[inset_0_0_0_1.5px_var(--border)] hover:bg-destructive hover:text-white`}>
              <IconTrash size={18} /> Supprimer
            </button>
          }
        />
      </>
    );
  }
  return null;
}
