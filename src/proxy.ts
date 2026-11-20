import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Vérification optimiste : sans cookie de session, on renvoie vers la connexion.
 * La vraie vérification (session valide, e-mail vérifié, rôle) se fait côté serveur dans les layouts.
 */
export function proxy(request: NextRequest) {
  const hasSession = !!getSessionCookie(request);
  const { pathname, search } = request.nextUrl;

  if (!hasSession) {
    const url = new URL("/connexion", request.url);
    url.searchParams.set("suite", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/bienvenue"],
};
