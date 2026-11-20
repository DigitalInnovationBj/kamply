"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { IconMailOpened } from "@tabler/icons-react";
import { OtpInput } from "@/components/app/form/OtpInput";
import { SubmitButton, pulseState, type SubmitState } from "@/components/app/form/SubmitButton";
import { ResendCode } from "./ResendCode";
import { AuthHeading } from "./AuthHeading";
import { authClient, authErrorMessage } from "@/lib/auth-client";

export function VerifyEmailForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [code, setCode] = useState("");
  const [otpState, setOtpState] = useState<"idle" | "error" | "success">("idle");
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);

  const verify = async (otp: string) => {
    if (otp.length !== 6 || state === "loading") return;
    setError(null);
    setState("loading");
    const { error: err } = await authClient.emailOtp.verifyEmail({ email, otp });
    if (err) {
      setError(authErrorMessage(err.code, err.message));
      setOtpState("error");
      await pulseState(setState, "error");
      setCode("");
      setOtpState("idle");
      return;
    }
    setOtpState("success");
    await pulseState(setState, "success", 1300);
    router.replace("/bienvenue");
    router.refresh();
  };

  if (!email) {
    return (
      <AuthHeading eyebrow="Vérification" title="Lien incomplet">
        Il manque votre adresse e-mail. <Link href="/connexion" className="font-bold text-foreground underline underline-offset-4">Connectez-vous</Link> pour recevoir un nouveau code.
      </AuthHeading>
    );
  }

  return (
    <div>
      <span className="rise mb-6 grid size-14 place-items-center rounded-2xl bg-black text-primary" aria-hidden="true">
        <IconMailOpened size={28} stroke={1.8} />
      </span>
      <AuthHeading eyebrow="Étape 2 sur 3" title="Vérifiez votre e-mail">
        Nous avons envoyé un code à 6 chiffres à <strong className="font-bold text-foreground">{email}</strong>. Il expire dans 10 minutes.
      </AuthHeading>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void verify(code);
        }}
        className="grid gap-6"
      >
        <div className="rise grid gap-3" style={{ animationDelay: ".05s" }}>
          <OtpInput value={code} onChange={setCode} onComplete={verify} state={otpState} disabled={state === "loading"} autoFocus />
          {error && (
            <p className="kf-msg justify-center" data-tone="error" role="alert" key={error}>
              {error}
            </p>
          )}
        </div>
        <div className="rise grid gap-4" style={{ animationDelay: ".1s" }}>
          <SubmitButton state={state} disabled={code.length !== 6}>
            Vérifier mon e-mail
          </SubmitButton>
          <ResendCode
            onResend={async () => {
              const { error: err } = await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
              if (err) setError(authErrorMessage(err.code, err.message));
              return !err;
            }}
          />
          <p className="text-center text-xs text-muted-foreground">Pensez à vérifier vos courriers indésirables.</p>
        </div>
      </form>
    </div>
  );
}
