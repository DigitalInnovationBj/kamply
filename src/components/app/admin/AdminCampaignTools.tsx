"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { IconCalendar, IconCheck, IconPencil, IconClick, IconEye, IconTargetArrow, IconUsers, IconCoins, IconPlayerPause, IconPlayerPlay, IconSquareRoundedX, IconTrash, IconX } from "@tabler/icons-react";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { Field } from "@/components/app/form/Field";
import { SubmitButton, pulseState, type SubmitState } from "@/components/app/form/SubmitButton";
import { deleteStat, setCampaignStatus, upsertStat } from "@/app/actions/admin";
import { STATUS, formatNumber, type CampaignStatusKey } from "@/lib/campaigns";
import { formatEuros } from "@/lib/plans";

type Action = { to: CampaignStatusKey; label: string; tone: "primary" | "danger"; icon: typeof IconCheck; text: string; note?: boolean };

function actionsFor(s: CampaignStatusKey): Action[] {
  const approve: Action = { to: "ACTIVE", label: "Valider et diffuser", tone: "primary", icon: IconCheck, text: "La campagne passe en direct. Le client voit le statut « En direct ».", note: true };
  const reject: Action = { to: "REJECTED", label: "Refuser", tone: "danger", icon: IconX, text: "Le mois payé est remboursé sur le portefeuille du client. Expliquez ce qu'il doit corriger.", note: true };
  const pause: Action = { to: "PAUSED", label: "Mettre en pause", tone: "primary", icon: IconPlayerPause, text: "La diffusion est suspendue côté plateforme publicitaire." };
  const resume: Action = { to: "ACTIVE", label: "Reprendre", tone: "primary", icon: IconPlayerPlay, text: "La campagne repasse en direct." };
  const end: Action = { to: "ENDED", label: "Terminer", tone: "danger", icon: IconSquareRoundedX, text: "La campagne est arrêtée définitivement. Ses statistiques restent consultables.", note: true };
  if (s === "PENDING_REVIEW") return [approve, reject];
  if (s === "ACTIVE") return [pause, end];
  if (s === "PAUSED") return [resume, end];
  return [];
}

/** Changement de statut par l'admin, avec note facultative et confirmation. */
export function StatusControl({ id, status }: { id: string; status: CampaignStatusKey }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const list = actionsFor(status);
  if (!list.length) return <p className="text-sm text-muted-foreground">Aucune action possible pour une campagne « {STATUS[status].label} ».</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {list.map((a) => (
        <ConfirmDialog
          key={a.to + a.label}
          tone={a.tone}
          title={`${a.label} ?`}
          description={a.text}
          confirmLabel={a.label}
          disabled={a.to === "REJECTED" && note.trim().length < 5}
          onConfirm={async () => {
            const r = await setCampaignStatus(id, a.to, a.note ? note : undefined);
            if (!r.ok) {
              toast.error(r.error);
              return false;
            }
            toast.success(`Statut : ${STATUS[a.to].label}.`);
            setNote("");
            router.refresh();
          }}
          trigger={
            <button
              type="button"
              className={
                a.tone === "danger"
                  ? "inline-flex h-12 items-center gap-2 rounded-full bg-card px-5 text-[15px] font-bold text-destructive shadow-[inset_0_0_0_1.5px_var(--border)] hover:bg-destructive hover:text-white"
                  : "inline-flex h-12 items-center gap-2 rounded-full bg-primary px-5 text-[15px] font-bold text-black hover:bg-black hover:text-[#f5f5f3]"
              }
            >
              <a.icon size={18} /> {a.label}
            </button>
          }
        >
          {a.note && (
            <label className="grid gap-2">
              <span className="kf-label">Message au client {a.to === "REJECTED" ? <span className="text-destructive">*</span> : <span className="font-medium text-muted-foreground">(facultatif)</span>}</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder={a.to === "REJECTED" ? "Le visuel contient trop de texte, merci de le remplacer." : "Votre campagne est en ligne."}
                className="w-full resize-none rounded-2xl bg-muted px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
          )}
        </ConfirmDialog>
      ))}
    </div>
  );
}

const EDIT_EVENT = "kamply:edit-stat";

const today = () => new Date().toISOString().slice(0, 10);

/** Saisie des résultats d'une journée (création ou correction si la date existe). */
export function StatForm({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [v, setV] = useState({ date: today(), impressions: "", reach: "", clicks: "", conversions: "", spendEuros: "" });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [state, setState] = useState<SubmitState>("idle");
  const [editing, setEditing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const onEdit = (e: Event) => {
      const d = (e as CustomEvent<Entry>).detail;
      setV({
        date: d.date.slice(0, 10),
        impressions: String(d.impressions),
        reach: String(d.reach),
        clicks: String(d.clicks),
        conversions: String(d.conversions),
        spendEuros: (d.spend / 100).toFixed(2).replace(".", ","),
      });
      setErrors({});
      setEditing(true);
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    window.addEventListener(EDIT_EVENT, onEdit);
    return () => window.removeEventListener(EDIT_EVENT, onEdit);
  }, []);
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => {
    setV((s) => ({ ...s, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    const n = (x: string) => Number(x.replace(",", ".") || 0);
    if (n(v.reach) > n(v.impressions)) er.reach = "Ne peut dépasser les impressions.";
    if (n(v.clicks) > n(v.impressions)) er.clicks = "Ne peut dépasser les impressions.";
    if (n(v.conversions) > n(v.clicks)) er.conversions = "Ne peut dépasser les clics.";
    if (!v.date) er.date = "Date requise.";
    setErrors(er);
    if (Object.keys(er).length) return void pulseState(setState, "error");
    setState("loading");
    const r = await upsertStat({ campaignId, date: v.date, impressions: n(v.impressions), reach: n(v.reach), clicks: n(v.clicks), conversions: n(v.conversions), spendEuros: n(v.spendEuros) });
    if (!r.ok) {
      setErrors(r.fields ?? {});
      toast.error(r.error);
      return void pulseState(setState, "error");
    }
    await pulseState(setState, "success", 900);
    setState("idle");
    toast.success(`Résultats du ${new Date(v.date).toLocaleDateString("fr-FR")} ${editing ? "modifiés" : "enregistrés"}.`);
    setV({ date: v.date, impressions: "", reach: "", clicks: "", conversions: "", spendEuros: "" });
    setEditing(false);
    router.refresh();
  };

  const num = { inputMode: "numeric" as const, placeholder: "0" };
  return (
    <form ref={formRef} onSubmit={submit} noValidate className="grid scroll-mt-24 gap-4">
      {editing && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#18cccd]/20 px-4 py-3 text-sm font-bold">
          <span>Modification du {new Date(v.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "UTC" })}</span>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setV({ date: today(), impressions: "", reach: "", clicks: "", conversions: "", spendEuros: "" });
            }}
            className="rounded-full px-3 py-1 text-muted-foreground hover:bg-white hover:text-foreground"
          >
            Annuler
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field className="col-span-2 sm:col-span-1" label="Date" type="date" max={today()} icon={<IconCalendar size={20} />} value={v.date} onChange={set("date")} error={errors.date} />
        <Field label="Impressions" icon={<IconEye size={20} />} {...num} value={v.impressions} onChange={set("impressions")} error={errors.impressions} />
        <Field label="Personnes touchées" icon={<IconUsers size={20} />} {...num} value={v.reach} onChange={set("reach")} error={errors.reach} />
        <Field label="Clics" icon={<IconClick size={20} />} {...num} value={v.clicks} onChange={set("clicks")} error={errors.clicks} />
        <Field label="Conversions" icon={<IconTargetArrow size={20} />} {...num} value={v.conversions} onChange={set("conversions")} error={errors.conversions} />
        <Field label="Dépense (€)" inputMode="decimal" placeholder="0,00" icon={<IconCoins size={20} />} value={v.spendEuros} onChange={set("spendEuros")} error={errors.spendEuros} />
      </div>
      <p className="text-[12.5px] text-muted-foreground">Une date déjà saisie est remplacée par les nouvelles valeurs.</p>
      <SubmitButton state={state} className="sm:mx-0 sm:max-w-[260px]">
        {editing ? "Enregistrer les modifications" : "Enregistrer la journée"}
      </SubmitButton>
    </form>
  );
}

type Entry = { id: string; date: string; impressions: number; reach: number; clicks: number; conversions: number; spend: number };

export function StatTable({ entries }: { entries: Entry[] }) {
  const router = useRouter();
  if (!entries.length) return <p className="rounded-2xl bg-muted px-4 py-6 text-center text-sm text-muted-foreground">Aucune journée saisie.</p>;
  return (
    <div className="-mx-5 overflow-x-auto sm:mx-0">
      <table className="w-full min-w-[620px] text-sm">
        <thead>
          <tr className="text-left text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {["Date", "Impr.", "Touchées", "Clics", "Conv.", "Dépense", ""].map((h) => (
              <th key={h} className="px-5 py-2 font-bold first:pl-5 sm:first:pl-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-t border-border tabular-nums">
              <td className="px-5 py-2.5 font-bold sm:pl-3">{new Date(e.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })}</td>
              <td className="px-5 py-2.5">{formatNumber(e.impressions)}</td>
              <td className="px-5 py-2.5">{formatNumber(e.reach)}</td>
              <td className="px-5 py-2.5">{formatNumber(e.clicks)}</td>
              <td className="px-5 py-2.5">{formatNumber(e.conversions)}</td>
              <td className="px-5 py-2.5">{formatEuros(e.spend, { decimals: true })}</td>
              <td className="whitespace-nowrap px-3 py-1.5 text-right">
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent(EDIT_EVENT, { detail: e }))}
                  className="inline-grid size-9 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Modifier la journée"
                >
                  <IconPencil size={16} />
                </button>
                <ConfirmDialog
                  tone="danger"
                  title="Supprimer cette journée ?"
                  description="Les résultats de cette date disparaîtront des statistiques du client."
                  confirmLabel="Supprimer"
                  onConfirm={async () => {
                    const r = await deleteStat(e.id);
                    if (!r.ok) {
                      toast.error(r.error);
                      return false;
                    }
                    toast.success("Journée supprimée.");
                    router.refresh();
                  }}
                  trigger={
                    <button type="button" className="inline-grid size-9 place-items-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Supprimer la journée">
                      <IconTrash size={16} />
                    </button>
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
