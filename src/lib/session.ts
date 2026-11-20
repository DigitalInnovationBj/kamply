import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";

/** Session de la requête en cours (dédupliquée dans un même rendu). */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/** Exige un utilisateur connecté, vérifié et au profil complété. */
export async function requireUser({ allowIncompleteProfile = false } = {}) {
  const session = await getSession();
  if (!session) redirect("/connexion");
  if (!session.user.emailVerified) redirect(`/verification?email=${encodeURIComponent(session.user.email)}`);
  if (!allowIncompleteProfile && !session.user.onboardingCompleted) redirect("/bienvenue");
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (session.user.role !== "admin") redirect("/app");
  return session;
}
