"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { IconMail, IconUser } from "@tabler/icons-react";
import { Field, PasswordField, PasswordStrength, passwordScore } from "@/components/app/form/Field";
import { SubmitButton, pulseState, type SubmitState } from "@/components/app/form/SubmitButton";
import { authClient, authErrorMessage } from "@/lib/auth-client";

type Errors = Partial<Record<"name" | "email" | "password" | "terms" | "form", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<SubmitState>("idle");
  useEffect(() => {
    // Adresse saisie sur la page d'accueil : reprise à l'étape profil.
    const site = new URLSearchParams(window.location.search).get("site")?.trim();
    if (site) {
      try {
        sessionStorage.setItem("kamply:site", site.slice(0, 200));
      } catch {}
    }
  }, []);
  const clearError = (k: string) => setErrors((prev) => (k in prev || "form" in prev ? { ...prev, [k]: undefined, form: undefined } : prev));

  const validate = (): Errors => {
    const e: Errors = {};
    if (name.trim().split(/\s+/).length < 2) e.name = "Indiquez votre prénom et votre nom.";
    if (!EMAIL_RE.test(email.trim())) e.email = "Adresse e-mail invalide.";
    if (passwordScore(password) < 3 || password.length < 8) e.password = "Mot de passe trop faible : respectez au moins 3 critères, dont 8 caractères.";
    if (!terms) e.terms = "Vous devez accepter les conditions pour continuer.";
    return e;
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return void pulseState(setState, "error");

    setState("loading");
    const cleanEmail = email.trim().toLowerCase();
    const { error } = await authClient.signUp.email({ name: name.trim(), email: cleanEmail, password });
    if (error) {
      setErrors({ form: authErrorMessage(error.code, error.message), ...(error.code?.startsWith("USER_ALREADY") ? { email: "Cette adresse est déjà utilisée." } : {}) });
      return void pulseState(setState, "error");
    }
    await pulseState(setState, "success", 900);
    router.push(`/verification?email=${encodeURIComponent(cleanEmail)}`);
  };

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <div className="rise grid gap-5" style={{ animationDelay: ".05s" }}>
        <Field
          label="Nom complet"
          icon={<IconUser size={20} stroke={2} />}
          name="name"
          autoComplete="name"
          placeholder="Camille Martin"
          value={name}
          onChange={(e) => { setName(e.target.value); clearError("name"); }}
          error={errors.name}
          valid={name.trim().split(/\s+/).length >= 2}
        />
        <Field
          label="Adresse e-mail"
          icon={<IconMail size={20} stroke={2} />}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="vous@entreprise.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
          error={errors.email}
          valid={EMAIL_RE.test(email.trim())}
        />
        <div className="grid gap-3">
          <PasswordField
            label="Mot de passe"
            name="password"
            autoComplete="new-password"
            placeholder="Au moins 8 caractères"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
            error={errors.password}
            valid={passwordScore(password) >= 3}
          />
          <PasswordStrength value={password} />
        </div>
      </div>

      <label className="rise flex cursor-pointer items-start gap-3 text-sm leading-snug text-muted-foreground" style={{ animationDelay: ".1s" }}>
        <input
          type="checkbox"
          checked={terms}
          onChange={(e) => { setTerms(e.target.checked); clearError("terms"); }}
          className="mt-0.5 size-5 flex-none cursor-pointer accent-[#ff5b23]"
          aria-invalid={!!errors.terms}
        />
        <span>
          J&apos;accepte les <Link href="/conditions" className="font-semibold text-foreground underline underline-offset-4">conditions d&apos;utilisation</Link> et la{" "}
          <Link href="/confidentialite" className="font-semibold text-foreground underline underline-offset-4">politique de confidentialité</Link>.
          {errors.terms && <span className="mt-1 block font-medium text-destructive">{errors.terms}</span>}
        </span>
      </label>

      {errors.form && (
        <p role="alert" className="kf-msg rounded-2xl bg-destructive/8 px-4 py-3" data-tone="error">
          {errors.form}
        </p>
      )}

      <div className="rise grid gap-5 pt-1" style={{ animationDelay: ".15s" }}>
        <SubmitButton state={state}>Créer mon compte</SubmitButton>
        <p className="text-center text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="font-bold text-foreground underline underline-offset-4">
            Se connecter
          </Link>
        </p>
      </div>
    </form>
  );
}
