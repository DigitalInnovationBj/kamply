import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailForm } from "@/components/app/auth/VerifyEmailForm";
import { PageLoader } from "@/components/app/PageLoader";

export const metadata: Metadata = { title: "Vérification de l'e-mail" };

export default function VerifyPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <VerifyEmailForm />
    </Suspense>
  );
}
