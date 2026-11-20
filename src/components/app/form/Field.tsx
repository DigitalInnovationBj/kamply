"use client";

import { forwardRef, useEffect, useId, useRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { IconAlertCircle, IconEye, IconLock } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label: string;
  icon: ReactNode;
  error?: string | null;
  hint?: ReactNode;
  valid?: boolean;
  /** Marque le champ invalide sans afficher de message sous lui. */
  invalid?: boolean;
  action?: ReactNode;
};

/**
 * Champ de saisie KAMPLY : libellé, icône, état valide / invalide.
 * À chaque nouvelle erreur, le champ tremble et sa bordure rouge se déploie depuis le centre.
 */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, icon, error, hint, valid, invalid, action, className, id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const msgId = `${inputId}-msg`;
  const boxRef = useRef<HTMLDivElement>(null);

  // Rejoue la secousse à chaque nouveau message d'erreur.
  useEffect(() => {
    const el = boxRef.current;
    if (!error || !el) return;
    el.classList.remove("kf-shake");
    void el.offsetWidth;
    el.classList.add("kf-shake");
  }, [error]);

  return (
    <div className={cn("kf", className)} data-invalid={!!error || !!invalid} data-valid={!error && !invalid && valid}>
      <label htmlFor={inputId} className="kf-label">
        {label}
      </label>
      <div ref={boxRef} className="kf-box">
        <span className="kf-icon" aria-hidden="true">
          {icon}
        </span>
        <input
          ref={ref}
          id={inputId}
          className="kf-input"
          aria-invalid={!!error || !!invalid}
          aria-describedby={error || hint ? msgId : undefined}
          {...props}
        />
        {action}
      </div>
      {error ? (
        <p id={msgId} className="kf-msg" data-tone="error" role="alert" key={error}>
          <IconAlertCircle size={16} stroke={2.2} className="mt-px flex-none" /> {error}
        </p>
      ) : hint ? (
        <div id={msgId} className="kf-msg">
          {hint}
        </div>
      ) : null}
    </div>
  );
});

type PasswordProps = Omit<FieldProps, "icon" | "type" | "action"> & { icon?: ReactNode };

/** Mot de passe avec bouton afficher / masquer (l'œil se barre d'un trait animé). */
export const PasswordField = forwardRef<HTMLInputElement, PasswordProps>(function PasswordField({ icon, ...props }, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <Field
      ref={ref}
      {...props}
      type={visible ? "text" : "password"}
      icon={icon ?? <IconLock size={20} stroke={2} />}
      action={
        <button
          type="button"
          className="kf-action"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          aria-pressed={visible}
        >
          <span className="eye" data-slash={visible}>
            <IconEye size={20} stroke={2} />
            <span className="eye-slash" />
          </span>
        </button>
      }
    />
  );
});

/** Règles de robustesse du mot de passe, partagées par l'inscription et la réinitialisation. */
export const PASSWORD_RULES = [
  { id: "len", label: "8 caractères minimum", test: (v: string) => v.length >= 8 },
  { id: "case", label: "Une majuscule et une minuscule", test: (v: string) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { id: "num", label: "Un chiffre", test: (v: string) => /\d/.test(v) },
  { id: "sym", label: "Un caractère spécial", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const;

export function passwordScore(v: string) {
  return PASSWORD_RULES.filter((r) => r.test(v)).length;
}

const LEVELS = [
  { label: "Trop faible", color: "#d92d20" },
  { label: "Faible", color: "#d92d20" },
  { label: "Moyen", color: "#ff5b23" },
  { label: "Bon", color: "#18cccd" },
  { label: "Excellent", color: "#08787a" },
];

/** Jauge en 4 segments + critères qui se cochent pendant la saisie. */
export function PasswordStrength({ value }: { value: string }) {
  const score = passwordScore(value);
  const level = LEVELS[score];
  return (
    <div className="grid gap-3" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="strength flex-1" style={{ ["--bar" as string]: level.color }}>
          {[1, 2, 3, 4].map((n) => (
            <i key={n} data-on={value.length > 0 && score >= n} />
          ))}
        </div>
        <span className="text-xs font-bold w-20 text-right" style={{ color: value ? level.color : "#8a8a84" }}>
          {value ? level.label : "Robustesse"}
        </span>
      </div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {PASSWORD_RULES.map((r) => {
          const ok = r.test(value);
          return (
            <li key={r.id} className="rule" data-ok={ok}>
              <span className="rule-dot" aria-hidden="true">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l5 5l10 -10" />
                </svg>
              </span>
              <span>
                {r.label}
                <span className="sr-only">{ok ? " : respecté" : " : non respecté"}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
