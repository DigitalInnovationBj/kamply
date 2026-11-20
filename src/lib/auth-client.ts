"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient, emailOTPClient, inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>(), emailOTPClient(), adminClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;

/** Traduit les codes d'erreur Better Auth en messages clairs. */
export function authErrorMessage(code?: string, fallback?: string) {
  switch (code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "E-mail ou mot de passe incorrect.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "Un compte existe déjà avec cette adresse.";
    case "EMAIL_NOT_VERIFIED":
      return "Votre adresse e-mail n'est pas encore vérifiée.";
    case "INVALID_OTP":
      return "Code incorrect. Vérifiez les 6 chiffres.";
    case "OTP_EXPIRED":
      return "Ce code a expiré. Demandez-en un nouveau.";
    case "TOO_MANY_ATTEMPTS":
      return "Trop de tentatives. Demandez un nouveau code.";
    case "PASSWORD_TOO_SHORT":
      return "Le mot de passe doit contenir au moins 8 caractères.";
    case "INVALID_PASSWORD":
      return "Mot de passe actuel incorrect.";
    case "USER_NOT_FOUND":
      return "Aucun compte avec cette adresse.";
    default:
      return fallback || "Une erreur est survenue. Réessayez dans un instant.";
  }
}
