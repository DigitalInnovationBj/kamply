/** Écran de chargement : le mot KAMPLY se dévoile, un fin trait orange file dessous. */
export function PageLoader({ fullscreen = false, label = "Chargement" }: { fullscreen?: boolean; label?: string }) {
  return (
    <div className={fullscreen ? "app-surface grid min-h-svh place-items-center" : "grid min-h-[50svh] place-items-center"} role="status" aria-live="polite">
      <div className="loader">
        <div className="loader-word" aria-hidden="true">
          <span>KAMPLY</span>
        </div>
        <div className="loader-line" aria-hidden="true" />
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}
