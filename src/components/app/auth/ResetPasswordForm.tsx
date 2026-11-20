"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { IconKey, IconMail } from "@tabler/icons-react";
import { Field, PasswordField, PasswordStrength, passwordScore } from "@/components/app/form/Field";
import { OtpInput } from "@/components/app/form/OtpInput";
import { SubmitButton, pulseState, type SubmitState } from "@/components/app/form/SubmitButton";
import { AuthHeading } from "./AuthHeading";
import { ResendCode } from "./ResendCode";
import { authClient, authErrorMessage } from "@/lib/auth-client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Mot de passe oublié en deux étapes : e-mail, puis code + nouveau mot de passe. */
export function ResetPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ email?: string; code?: string; password?: string; confirm?: string; form?: string }>({});
  const [state, setState] = useState<SubmitState>("idle");
  const clearError = (k: string) => setErrors((prev) => (k in prev || "form" in prev ? { ...prev, [k]: undefined, form: undefined } : prev));
  const [otpState, setOtpState] = useState<"idle" | "error" | "success">("idle");

  const sendCode = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setErrors({ email: "Adresse e-mail invalide." });
      return void pulseState(setState, "error");
    }
    setErrors({});
    setState("loading");
    const { error } = await authClient.emailOtp.requestPasswordReset({ email: email.trim().toLowerCase() });
    if (error) {
      setErrors({ form: authErrorMessage(error.code, error.message) });
      return void pulseState(setState, "error");
    }
    await pulseState(setState, "success", 900);
    setState("idle");
    setStep(2);
  };

  const reset = async (ev: FormEvent) => {
    ev.preventDefault();
    const e: typeof errors = {};
    if (code.length !== 6) e.code = "Saisissez les 6 chiffres reçus par e-mail.";
    if (passwordScore(password) < 3 || password.length < 8) e.password = "Mot de passe trop faible.";
    if (confirm !== password) e.confirm = "Les deux mots de passe ne correspondent pas.";
    setErrors(e);
    if (Object.keys(e).length) {
      if (e.code) setOtpState("error");
      await pulseState(setState, "error");
      setOtpState("idle");
      return;
    }
    setState("loading");
    const { error } = await authClient.emailOtp.resetPassword({ email: email.trim().toLowerCase(), otp: code, password });
    if (error) {
      setErrors({ code: authErrorMessage(error.code, error.message) });
      setOtpState("error");
      await pulseState(setState, "error");
      setOtpState("idle");
      return;
    }
    setOtpState("success");
    await pulseState(setState, "success", 1300);
    router.replace("/connexion?reinitialise=1");
  };

  if (step === 1) {
    return (
      <div>
        <span className="rise mb-6 grid size-14 place-items-center rounded-2xl bg-black text-primary" aria-hidden="true">
          <IconKey size={28} stroke={1.8} />
        </span>
        <AuthHeading eyebrow="Mot de passe oublié" title="Pas de panique.">
          Indiquez votre adresse e-mail : nous vous envoyons un code pour choisir un nouveau mot de passe.
        </AuthHeading>
        <form onSubmit={sendCode} noValidate className="grid gap-5">
          <Field
            className="rise"
            label="Adresse e-mail"
            icon={<IconMail size={20} stroke={2} />}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            placeholder="vous@entreprise.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
            error={errors.email}
            valid={EMAIL_RE.test(email.trim())}
          />
          {errors.form && (
            <p role="alert" className="kf-msg rounded-2xl bg-destructive/8 px-4 py-3" data-tone="error">
              {errors.form}
            </p>
          )}
          <SubmitButton state={state}>Recevoir un code</SubmitButton>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/connexion" className="font-bold text-foreground underline underline-offset-4">
              Retour à la connexion
            </Link>
          </p>
        </form>
      </div>
    );
  }

  return (
    <div>
      <AuthHeading eyebrow="Nouveau mot de passe" title="Choisissez-en un solide.">
        Code envoyé à <strong className="font-bold text-foreground">{email}</strong>.{" "}
        <button type="button" onClick={() => setStep(1)} className="font-bold text-foreground underline underline-offset-4">
          Modifier
        </button>
      </AuthHeading>
      <form onSubmit={reset} noValidate className="grid gap-5">
        <div className="rise grid gap-2">
          <span className="kf-label">Code reçu par e-mail</span>
          <OtpInput value={code} onChange={setCode} state={otpState} autoFocus />
          {errors.code && (
            <p className="kf-msg" data-tone="error" role="alert" key={errors.code + state}>
              {errors.code}
            </p>
          )}
        </div>
        <div className="rise grid gap-3" style={{ animationDelay: ".05s" }}>
          <PasswordField label="Nouveau mot de passe" autoComplete="new-password" value={password} onChange={(e) => { setPassword(e.target.value); clearError("password"); }} error={errors.password} valid={passwordScore(password) >= 3} />
          <PasswordStrength value={password} />
        </div>
        <PasswordField
          className="rise"
          label="Confirmez le mot de passe"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); clearError("confirm"); }}
          error={errors.confirm}
          valid={!!confirm && confirm === password}
        />
        <SubmitButton state={state}>Enregistrer le mot de passe</SubmitButton>
        <ResendCode
          onResend={async () => {
            const { error } = await authClient.emailOtp.requestPasswordReset({ email: email.trim().toLowerCase() });
            return !error;
          }}
        />
      </form>
    </div>
  );
}
