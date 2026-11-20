"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { IconDeviceDesktop, IconDeviceMobile, IconLogout, IconTrash } from "@tabler/icons-react";
import { PasswordField, PasswordStrength, passwordScore } from "@/components/app/form/Field";
import { SubmitButton, pulseState, type SubmitState } from "@/components/app/form/SubmitButton";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import { formatDate } from "@/lib/campaigns";

/** Changement de mot de passe (déconnecte les autres appareils). */
export function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [errors, setErrors] = useState<{ current?: string; next?: string }>({});
  const [state, setState] = useState<SubmitState>("idle");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const er: typeof errors = {};
    if (!current) er.current = "Saisissez votre mot de passe actuel.";
    if (passwordScore(next) < 3 || next.length < 8) er.next = "Nouveau mot de passe trop faible.";
    if (next && next === current) er.next = "Choisissez un mot de passe différent de l'actuel.";
    setErrors(er);
    if (Object.keys(er).length) return void pulseState(setState, "error");
    setState("loading");
    const { error } = await authClient.changePassword({ currentPassword: current, newPassword: next, revokeOtherSessions: true });
    if (error) {
      setErrors({ current: authErrorMessage(error.code, error.message) });
      return void pulseState(setState, "error");
    }
    await pulseState(setState, "success", 1100);
    setState("idle");
    setCurrent("");
    setNext("");
    toast.success("Mot de passe modifié. Vos autres appareils ont été déconnectés.");
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-5">
      <PasswordField label="Mot de passe actuel" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} error={errors.current} />
      <div className="grid gap-3">
        <PasswordField label="Nouveau mot de passe" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} error={errors.next} valid={passwordScore(next) >= 3} />
        <PasswordStrength value={next} />
      </div>
      <SubmitButton state={state} className="sm:mx-0 sm:max-w-[300px]">
        Changer le mot de passe
      </SubmitButton>
    </form>
  );
}

type S = { id: string; token: string; userAgent?: string | null; ipAddress?: string | null; createdAt: Date | string; updatedAt: Date | string };

function device(ua?: string | null) {
  if (!ua) return { mobile: false, label: "Appareil inconnu" };
  const mobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  const os = /iPhone|iPad/i.test(ua) ? "iOS" : /Android/i.test(ua) ? "Android" : /Mac OS/i.test(ua) ? "macOS" : /Windows/i.test(ua) ? "Windows" : /Linux/i.test(ua) ? "Linux" : "Autre";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Navigateur";
  return { mobile, label: `${browser} · ${os}` };
}

/** Appareils connectés : déconnexion d'un appareil ou de tous les autres. */
export function Sessions({ currentToken }: { currentToken: string }) {
  const [list, setList] = useState<S[] | null>(null);

  const load = async () => {
    const { data } = await authClient.listSessions();
    setList((data as S[] | null) ?? []);
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement asynchrone des sessions
    void load();
  }, []);

  if (!list) return <div className="h-24 animate-pulse rounded-2xl bg-muted" aria-label="Chargement des appareils" />;
  const others = list.filter((s) => s.token !== currentToken);

  return (
    <div className="grid gap-4">
      <ul className="grid gap-px overflow-hidden rounded-2xl bg-border">
        {list.map((s) => {
          const d = device(s.userAgent);
          const me = s.token === currentToken;
          return (
            <li key={s.id} className="flex items-center gap-3 bg-card px-4 py-3">
              <span className="grid size-10 flex-none place-items-center rounded-xl bg-muted" aria-hidden="true">
                {d.mobile ? <IconDeviceMobile size={20} /> : <IconDeviceDesktop size={20} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-bold">
                  {d.label}
                  {me && <span className="rounded-full bg-[#18cccd] px-2 py-0.5 text-[11px] font-bold text-black">Cet appareil</span>}
                </div>
                <div className="text-[12.5px] text-muted-foreground">Dernière activité : {formatDate(s.updatedAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
              </div>
              {!me && (
                <button
                  type="button"
                  onClick={async () => {
                    await authClient.revokeSession({ token: s.token });
                    toast.success("Appareil déconnecté.");
                    void load();
                  }}
                  className="grid size-10 place-items-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Déconnecter ${d.label}`}
                >
                  <IconLogout size={18} />
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {others.length > 0 && (
        <ConfirmDialog
          title="Déconnecter les autres appareils ?"
          description={`${others.length} appareil${others.length > 1 ? "s" : ""} devr${others.length > 1 ? "ont" : "a"} se reconnecter. Cet appareil reste connecté.`}
          confirmLabel="Tout déconnecter"
          onConfirm={async () => {
            await authClient.revokeOtherSessions();
            toast.success("Autres appareils déconnectés.");
            void load();
          }}
          trigger={
            <button type="button" className="inline-flex h-11 items-center gap-2 justify-self-start rounded-full bg-black px-5 text-sm font-bold text-[#f5f5f3] hover:bg-primary hover:text-black">
              <IconLogout size={18} /> Déconnecter les autres appareils
            </button>
          }
        />
      )}
    </div>
  );
}

/** Suppression définitive du compte : mot de passe + mot à recopier. */
export function DeleteAccount() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <ConfirmDialog
      tone="danger"
      title="Supprimer votre compte ?"
      description="Vos campagnes, statistiques, images et votre solde seront supprimés définitivement. Les campagnes en cours seront arrêtées. Cette action est irréversible."
      confirmLabel="Supprimer définitivement"
      requireText="SUPPRIMER"
      disabled={!password}
      onConfirm={async () => {
        setError(null);
        const { error: err } = await authClient.deleteUser({ password });
        if (err) {
          setError(authErrorMessage(err.code, err.message));
          return false;
        }
        toast.success("Compte supprimé. À bientôt.");
        router.replace("/");
      }}
      trigger={
        <button type="button" className="inline-flex h-12 items-center gap-2 rounded-full bg-card px-5 text-[15px] font-bold text-destructive shadow-[inset_0_0_0_1.5px_var(--border)] transition-colors hover:bg-destructive hover:text-white">
          <IconTrash size={18} /> Supprimer mon compte
        </button>
      }
    >
      <PasswordField label="Votre mot de passe" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={error} />
    </ConfirmDialog>
  );
}
