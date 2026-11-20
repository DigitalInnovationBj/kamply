import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthHeading } from "@/components/app/auth/AuthHeading";
import { SignInForm } from "@/components/app/auth/SignInForm";
import { ResetNotice } from "@/components/app/auth/ResetNotice";

export const metadata: Metadata = { title: "Connexion" };

export default function SignInPage() {
  return (
    <>
      <AuthHeading eyebrow="Connexion" title="Bon retour parmi nous.">
        Retrouvez vos campagnes et vos résultats en direct.
      </AuthHeading>
      <Suspense>
        <ResetNotice />
        <SignInForm />
      </Suspense>
    </>
  );
}
