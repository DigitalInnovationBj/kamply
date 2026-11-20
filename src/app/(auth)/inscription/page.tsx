import type { Metadata } from "next";
import { AuthHeading } from "@/components/app/auth/AuthHeading";
import { SignUpForm } from "@/components/app/auth/SignUpForm";

export const metadata: Metadata = { title: "Créer un compte" };

export default function SignUpPage() {
  return (
    <>
      <AuthHeading eyebrow="Étape 1 sur 3" title="Créez votre compte KAMPLY">
        Votre première campagne Google Ads ou Meta Ads est à 5 minutes.
      </AuthHeading>
      <SignUpForm />
    </>
  );
}
