"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { IconMail } from "@tabler/icons-react";
import { Field, PasswordField } from "@/components/app/form/Field";
import { SubmitButton, pulseState, type SubmitState } from "@/components/app/form/SubmitButton";
import { authClient, authErrorMessage } from "@/lib/auth-client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("suite");
  const safeNext = next && next.startsWith("/app") ? next : "/app";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [state, setState] = useState<SubmitState>("idle");
  const clearError = (k: string) => setErrors((prev) => (k in prev || "form" in prev ? { ...prev, [k]: undefined, form: undefined } : prev));

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) e.email = "Adresse e-mail invalide.";
    if (!password) e.password = "Saisissez votre mot de passe.";
    setErrors(e);
    if (Object.keys(e).length) return void pulseState(setState, "error");

    setState("loading");
    const cleanEmail = email.trim().toLowerCase();
    const { error } = await authClient.signIn.email({ email: cleanEmail, password });

    if (error) {
      if (error.code === "EMAIL_NOT_VERIFIED") {
        // Compte non vérifié : on renvoie un code et on passe à l'étape de vérification.
        await authClient.emailOtp.sendVerificationOtp({ email: cleanEmail, type: "email-verification" });
        router.push(`/verification?email=${encodeURIComponent(cleanEmail)}&renvoye=1`);
        return;
      }
      setErrors({ form: authErrorMessage(error.code, error.message), password: " " });
      return void pulseState(setState, "error");
    }
    await pulseState(setState, "success", 800);
    router.replace(safeNext);
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <div className="rise grid gap-5" style={{ animationDelay: ".05s" }}>
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
        />
        <div className="grid gap-2">
          <PasswordField
            label="Mot de passe"
            name="password"
            autoComplete="current-password"
            placeholder="Votre mot de passe"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
            error={errors.password?.trim() ? errors.password : null}
            invalid={!!errors.password}
          />
          <Link href="/mot-de-passe-oublie" className="justify-self-end text-sm font-bold text-foreground underline underline-offset-4">
            Mot de passe oublié ?
          </Link>
        </div>
      </div>

      {errors.form && (
        <p role="alert" className="kf-msg rounded-2xl bg-destructive/8 px-4 py-3" data-tone="error" key={errors.form + state}>
          {errors.form}
        </p>
      )}

      <div className="rise grid gap-5 pt-1" style={{ animationDelay: ".1s" }}>
        <SubmitButton state={state}>Se connecter</SubmitButton>
        <p className="text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="font-bold text-foreground underline underline-offset-4">
            Créer un compte
          </Link>
        </p>
      </div>
    </form>
  );
}
