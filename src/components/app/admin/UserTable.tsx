"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { IconBan, IconCheck, IconLockOpen, IconMail, IconSearch, IconShield, IconShieldOff, IconX } from "@tabler/icons-react";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { UserAvatar } from "@/components/app/UserAvatar";
import { setUserRole } from "@/app/actions/admin";
import { banAccount, unbanAccount } from "@/app/actions/admin-users";
import { formatDate, formatNumber } from "@/lib/campaigns";
import { formatEuros } from "@/lib/plans";
import { cn } from "@/lib/utils";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string | null;
  companyName: string | null;
  emailVerified: boolean;
  banned: boolean;
  banReason: string | null;
  banExpires: string | null;
  createdAt: string;
  balance: number;
  campaigns: number;
};

const FILTERS = [
  ["all", "Tous"],
  ["admin", "Admins"],
  ["banned", "Suspendus"],
  ["unverified", "Non vérifiés"],
] as const;

const DURATIONS = [
  { v: 7, l: "7 jours" },
  { v: 30, l: "30 jours" },
  { v: null, l: "Sans limite" },
] as const;

function Check({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn("grid size-6 flex-none place-items-center rounded-lg transition-colors", checked ? "bg-black text-primary" : "bg-muted hover:bg-[#dcdcd6]")}
    >
      {checked && <IconCheck size={15} stroke={3} />}
    </button>
  );
}

export function UserTable({ items, meId }: { items: AdminUser[]; meId: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("all");
  const [sel, setSel] = useState<string[]>([]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter((u) => {
      if (filter === "admin" && u.role !== "admin") return false;
      if (filter === "banned" && !u.banned) return false;
      if (filter === "unverified" && u.emailVerified) return false;
      return !s || [u.name, u.email, u.companyName ?? ""].some((x) => x.toLowerCase().includes(s));
    });
  }, [items, q, filter]);

  const toggle = (id: string) => setSel((x) => (x.includes(id) ? x.filter((i) => i !== id) : [...x, id]));
  const allSelected = list.length > 0 && list.every((u) => sel.includes(u.id));

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="kf-box flex-1 !h-12">
          <span className="kf-icon" aria-hidden="true">
            <IconSearch size={18} />
          </span>
          <input className="kf-input" placeholder="Nom, e-mail ou entreprise" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher un compte" />
        </label>
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {FILTERS.map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              aria-pressed={filter === k}
              className={cn("h-10 flex-none rounded-full px-4 text-sm font-bold transition-colors", filter === k ? "bg-black text-[#f5f5f3]" : "bg-card text-muted-foreground hover:text-foreground")}
            >
              {l}
              {k === "banned" && items.some((u) => u.banned) && <span className="ml-1.5 tabular-nums">{items.filter((u) => u.banned).length}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Barre de sélection */}
      <div className={cn("sticky top-16 z-10 flex items-center gap-3 rounded-2xl bg-black px-4 py-2.5 text-[#f5f5f3] transition-all duration-300 md:top-3", sel.length ? "opacity-100" : "pointer-events-none -translate-y-2 opacity-0 h-0 !py-0 overflow-hidden")}>
        <span className="text-sm font-bold tabular-nums">
          {sel.length} sélectionné{sel.length > 1 ? "s" : ""}
        </span>
        <Link href={`/app/admin/emails?a=${sel.join(",")}`} className="ml-auto inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-black no-underline hover:bg-[#f5f5f3]">
          <IconMail size={17} /> Écrire
        </Link>
        <button type="button" onClick={() => setSel([])} className="grid size-10 place-items-center rounded-full hover:bg-white/10" aria-label="Vider la sélection">
          <IconX size={17} />
        </button>
      </div>

      {list.length ? (
        <ul className="grid gap-px overflow-hidden rounded-[24px] bg-border">
          <li className="flex items-center gap-3 bg-card px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:px-5">
            <Check checked={allSelected} onChange={() => setSel(allSelected ? sel.filter((id) => !list.some((u) => u.id === id)) : [...new Set([...sel, ...list.map((u) => u.id)])])} label="Tout sélectionner" />
            {formatNumber(list.length)} compte{list.length > 1 ? "s" : ""}
          </li>
          {list.map((u) => (
            <UserRow key={u.id} u={u} me={u.id === meId} selected={sel.includes(u.id)} onToggle={() => toggle(u.id)} onDone={() => router.refresh()} />
          ))}
        </ul>
      ) : (
        <p className="rounded-[24px] bg-card px-4 py-12 text-center text-sm text-muted-foreground">Aucun compte ne correspond.</p>
      )}
    </div>
  );
}

function UserRow({ u, me, selected, onToggle, onDone }: { u: AdminUser; me: boolean; selected: boolean; onToggle: () => void; onDone: () => void }) {
  const admin = u.role === "admin";
  const [reason, setReason] = useState("");
  const [days, setDays] = useState<number | null>(30);
  const [notify, setNotify] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return (
    <li className={cn("flex flex-wrap items-center gap-3 bg-card px-4 py-3.5 sm:flex-nowrap sm:px-5", u.banned && "bg-[#fbf3f1]")}>
      <Check checked={selected} onChange={onToggle} label={`Sélectionner ${u.name}`} />
      <UserAvatar name={u.name} image={u.image} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 text-[15px] font-bold">
          <span className="truncate">{u.name}</span>
          {admin && <span className="rounded-full bg-black px-2 py-0.5 text-[11px] font-bold text-primary">Admin</span>}
          {u.banned && <span className="rounded-full bg-destructive px-2 py-0.5 text-[11px] font-bold text-white">Suspendu{u.banExpires ? ` → ${formatDate(u.banExpires, { day: "numeric", month: "short" })}` : ""}</span>}
          {!u.emailVerified && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">Non vérifié</span>}
        </div>
        <div className="truncate text-[12.5px] text-muted-foreground">
          {u.email}
          {u.companyName ? ` · ${u.companyName}` : ""}
        </div>
        {u.banned && u.banReason && <div className="truncate text-[12.5px] text-destructive">Motif : {u.banReason}</div>}
      </div>
      <div className="hidden text-right text-[12.5px] text-muted-foreground md:grid">
        <span className="font-bold tabular-nums text-foreground">{formatEuros(u.balance, { decimals: true })}</span>
        <span>
          {formatNumber(u.campaigns)} campagne{u.campaigns > 1 ? "s" : ""} · depuis {formatDate(u.createdAt, { month: "short", year: "numeric" })}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-0.5">
        <Link href={`/app/admin/emails?a=${u.id}`} className="grid size-10 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Écrire à ${u.name}`} title="Envoyer un e-mail">
          <IconMail size={18} />
        </Link>
        {!me && !u.banned && (
          <ConfirmDialog
            tone={admin ? "danger" : "primary"}
            title={admin ? "Retirer le rôle administrateur ?" : "Nommer administrateur ?"}
            description={admin ? `${u.name} n'aura plus accès à l'administration.` : `${u.name} pourra valider les campagnes, saisir les résultats, créditer les recharges et suspendre des comptes.`}
            confirmLabel={admin ? "Retirer" : "Nommer administrateur"}
            onConfirm={async () => {
              const r = await setUserRole(u.id, admin ? "user" : "admin");
              if (!r.ok) {
                toast.error(r.error);
                return false;
              }
              toast.success("Rôle mis à jour.");
              onDone();
            }}
            trigger={
              <button type="button" className="grid size-10 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={admin ? `Retirer le rôle admin de ${u.name}` : `Nommer ${u.name} administrateur`} title={admin ? "Retirer le rôle admin" : "Nommer admin"}>
                {admin ? <IconShieldOff size={18} /> : <IconShield size={18} />}
              </button>
            }
          />
        )}
        {!me && !admin && !u.banned && (
          <ConfirmDialog
            tone="danger"
            title={`Suspendre ${u.name} ?`}
            description="La personne est déconnectée de tous ses appareils et ne peut plus se connecter. Ses campagnes en direct sont mises en pause."
            confirmLabel="Suspendre le compte"
            disabled={reason.trim().length < 5}
            onConfirm={async () => {
              setError(null);
              const r = await banAccount({ userId: u.id, reason, days, notify });
              if (!r.ok) {
                setError(r.error);
                return false;
              }
              toast.success(notify ? (r.data?.emailed ? "Compte suspendu, e-mail envoyé." : "Compte suspendu. L'e-mail n'a pas pu partir.") : "Compte suspendu.");
              setReason("");
              onDone();
            }}
            trigger={
              <button type="button" className="grid size-10 place-items-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Suspendre ${u.name}`} title="Suspendre">
                <IconBan size={18} />
              </button>
            }
          >
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="kf-label">
                  Motif <span className="text-destructive">*</span>
                </span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Annonces non conformes aux règles publicitaires de Meta."
                  className="w-full resize-none rounded-2xl bg-muted px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <div className="grid gap-2">
                <span className="kf-label">Durée</span>
                <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Durée de la suspension">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.l}
                      type="button"
                      role="radio"
                      aria-checked={days === d.v}
                      onClick={() => setDays(d.v)}
                      className={cn("h-11 rounded-xl text-sm font-bold transition-colors", days === d.v ? "bg-black text-[#f5f5f3]" : "bg-muted hover:bg-[#dcdcd6]")}
                    >
                      {d.l}
                    </button>
                  ))}
                </div>
              </div>
              <NotifyToggle checked={notify} onChange={setNotify} email={u.email} />
              {error && (
                <p className="kf-msg" data-tone="error" role="alert">
                  {error}
                </p>
              )}
            </div>
          </ConfirmDialog>
        )}
        {u.banned && (
          <ConfirmDialog
            title={`Réactiver ${u.name} ?`}
            description="La personne pourra se reconnecter. Ses campagnes restent en pause : elle les relance elle-même."
            confirmLabel="Réactiver le compte"
            onConfirm={async () => {
              const r = await unbanAccount(u.id, notify);
              if (!r.ok) {
                toast.error(r.error);
                return false;
              }
              toast.success(notify && r.data?.emailed ? "Compte réactivé, e-mail envoyé." : "Compte réactivé.");
              onDone();
            }}
            trigger={
              <button type="button" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-black px-3.5 text-sm font-bold text-[#f5f5f3] hover:bg-primary hover:text-black">
                <IconLockOpen size={16} /> Réactiver
              </button>
            }
          >
            <NotifyToggle checked={notify} onChange={setNotify} email={u.email} />
          </ConfirmDialog>
        )}
      </div>
    </li>
  );
}

function NotifyToggle({ checked, onChange, email }: { checked: boolean; onChange: (v: boolean) => void; email: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex items-center gap-3 rounded-2xl bg-muted px-4 py-3 text-left">
      <span className={cn("relative h-7 w-12 flex-none rounded-full transition-colors duration-300", checked ? "bg-primary" : "bg-[#c4c4be]")}>
        <span className={cn("absolute top-1 size-5 rounded-full bg-white shadow transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)]", checked ? "translate-x-6" : "translate-x-1")} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold">Prévenir par e-mail</span>
        <span className="block truncate text-[12.5px] text-muted-foreground">{email}</span>
      </span>
    </button>
  );
}
