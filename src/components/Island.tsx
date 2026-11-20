"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { IconArrowRight, IconArrowUp, IconMenu2, IconX } from "@tabler/icons-react";
import { useLenis } from "@/components/providers/SmoothScroll";
import { gsap } from "@/lib/gsap";

const LINKS = [
  { href: "#comment", label: "Comment ça marche" },
  { href: "#canaux", label: "Google & Meta" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#faq", label: "FAQ" },
];

/**
 * Barre de navigation « dynamic island » :
 * repliée = logo + bouton ; survol (desktop) = liens ;
 * remontée de page = bouton « retour en haut » qui se glisse dans l'île.
 */
export function Island() {
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [up, setUp] = useState(false);
  const islandRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  // Entrée : l'île descend depuis le haut une fois la page prête.
  useEffect(() => {
    const el = islandRef.current;
    if (!el) return;
    gsap.fromTo(el, { yPercent: -160, scale: 0.86 }, { yPercent: 0, scale: 1, duration: 1.3, delay: 0.25, ease: "expo.out" });
  }, []);

  // Direction du défilement : on ne montre le retour en haut qu'en remontant, loin du haut.
  useEffect(() => {
    let last = window.scrollY;
    const update = (y: number, dir: number) => {
      const far = y > window.innerHeight * 0.9;
      setUp(far && dir < 0);
      last = y;
    };
    if (lenis) {
      const onScroll = (l: { scroll: number; direction: number }) => update(l.scroll, l.direction);
      lenis.on("scroll", onScroll);
      return () => lenis.off("scroll", onScroll);
    }
    const onScroll = () => {
      const y = window.scrollY;
      update(y, y < last ? -1 : 1);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lenis]);

  const toTop = () => {
    if (lenis) lenis.scrollTo(0, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="island-wrap">
      <div
        ref={islandRef}
        className="island"
        data-open={open}
        data-up={up}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
        }}
      >
        <div className="drawer drawer--top">
          <div>
            <button type="button" className="island-top" onClick={toTop} aria-label="Revenir en haut de la page" tabIndex={up ? 0 : -1}>
              <IconArrowUp size={20} stroke={2.4} />
            </button>
          </div>
        </div>

        <Link href="/" className="island-logo" aria-label="KAMPLY, accueil">
          KAMPLY
        </Link>

        <div className="drawer drawer--links">
          <div>
            <nav className="island-links" aria-label="Navigation principale">
              {LINKS.map((l) => (
                <a key={l.href} href={l.href} tabIndex={open ? 0 : -1}>
                  {l.label}
                </a>
              ))}
            </nav>
          </div>
        </div>

        <Link href="#demarrer" className="btn btn--sm" aria-label="Commencer">
          <span className="island-cta-label">
            <span>Commencer</span>
          </span>
          <span className="btn-arrow" aria-hidden="true">
            <IconArrowRight size={16} stroke={2.4} />
          </span>
        </Link>

        <button
          type="button"
          className="island-menu"
          aria-label={sheet ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={sheet}
          onClick={() => setSheet((s) => !s)}
        >
          {sheet ? <IconX size={20} stroke={2.2} /> : <IconMenu2 size={20} stroke={2.2} />}
        </button>
      </div>

      <div className="island-sheet" data-open={sheet} style={{ pointerEvents: sheet ? "auto" : "none" }}>
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} onClick={() => setSheet(false)} tabIndex={sheet ? 0 : -1}>
            {l.label}
            <IconArrowRight size={18} stroke={2.2} />
          </a>
        ))}
      </div>
    </div>
  );
}
