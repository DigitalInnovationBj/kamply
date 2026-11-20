"use client";

/* Rendu hors du layout racine : styles en ligne, aucune dépendance aux feuilles globales. */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = error instanceof Error && "digest" in error ? String((error as Error & { digest?: string }).digest ?? "") : "";
  return (
    <html lang="fr">
      <body style={{ margin: 0, background: "#000", color: "#f5f5f3", fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif" }}>
        <title>Signal perdu · KAMPLY</title>
        <main style={{ minHeight: "100svh", display: "grid", alignContent: "center", padding: "40px clamp(20px,5vw,56px)" }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "#a3a3a0", margin: 0 }}>
            <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: 99, background: "#ff5b23", marginRight: 10 }} />
            Signal perdu
          </p>
          <div style={{ fontSize: "clamp(120px,30vw,360px)", fontWeight: 900, lineHeight: 0.8, letterSpacing: "-.06em", margin: "18px 0 10px" }}>OFF</div>
          <h1 style={{ fontSize: "clamp(28px,5vw,52px)", fontWeight: 900, letterSpacing: "-.04em", lineHeight: 1, margin: 0 }}>KAMPLY ne répond plus.</h1>
          <p style={{ maxWidth: 520, fontSize: 17, lineHeight: 1.55, color: "#a3a3a0", margin: "16px 0 0" }}>Une erreur grave a interrompu l&apos;application. Rechargez la page ; si le problème persiste, revenez dans quelques minutes.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 30 }}>
            <button type="button" onClick={() => retry()} style={{ height: 54, padding: "0 26px", borderRadius: 999, border: 0, background: "#ff5b23", color: "#000", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>
              Réessayer
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- rechargement complet volontaire hors layout racine */}
            <a href="/" style={{ height: 54, padding: "0 26px", borderRadius: 999, background: "rgba(255,255,255,.08)", color: "#f5f5f3", fontSize: 16, fontWeight: 800, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
              Accueil
            </a>
          </div>
          {digest && <p style={{ marginTop: 18, fontFamily: "ui-monospace, monospace", fontSize: 12, color: "#5c5c58" }}>Référence : {digest}</p>}
        </main>
      </body>
    </html>
  );
}
