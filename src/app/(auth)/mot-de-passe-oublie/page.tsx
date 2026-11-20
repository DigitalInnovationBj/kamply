import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/app/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return <ResetPasswordForm />;
}
