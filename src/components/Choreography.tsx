"use client";

import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";

/**
 * Toute la mise en mouvement de la page, en un seul endroit :
 * - empilement des affiches (chaque section recouvre la précédente) ;
 * - révélation des titres ligne par ligne (masque) ;
 * - apparition des blocs, découpes, compteurs, bandeau.
 * Les sections restent des composants serveur : elles portent seulement des attributs data-*.
 */
export function Choreography() {
  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("all", () => {
      /* ---------- Empilement ---------- */
      const panels = gsap.utils.toArray<HTMLElement>(".panel");
      const spacers: HTMLElement[] = [];

      // Une section plus haute que l'écran se fige quand son bas arrive en bas de l'écran.
      // Sans pause, la suivante la recouvrirait aussitôt et son contenu du bas (cartes, tarifs)
      // ne serait jamais vu en entier : on insère donc un temps de pause invisible derrière elle.
      const sizeSpacers = () =>
        spacers.forEach((s, i) => {
          const tall = panels[i].offsetHeight > window.innerHeight + 2;
          s.style.height = tall ? `${Math.round(window.innerHeight * 0.45)}px` : "0px";
        });
      ScrollTrigger.addEventListener("refreshInit", sizeSpacers);

      panels.forEach((panel, i) => {
        panel.style.zIndex = String(i + 1);
        const next = panels[i + 1];
        if (!next) return;

        const spacer = document.createElement("div");
        spacer.setAttribute("aria-hidden", "true");
        spacer.className = "panel-hold";
        panel.after(spacer);
        spacers.push(spacer);

        sizeSpacers();
        ScrollTrigger.create({
          trigger: panel,
          start: () => (panel.offsetHeight <= window.innerHeight + 2 ? "top top" : "bottom bottom"),
          end: () => "+=" + (next.offsetHeight + spacer.offsetHeight),
          pin: true,
          pinSpacing: false,
          invalidateOnRefresh: true,
        });

        const inner = panel.querySelector<HTMLElement>(".panel-inner");
        const shade = panel.querySelector<HTMLElement>(".panel-shade");
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: next,
            start: "top bottom",
            end: "top top",
            scrub: true,
            invalidateOnRefresh: true,
          },
          defaults: { ease: "none" },
        });
        if (inner) tl.to(inner, { scale: 0.92, yPercent: -2, borderRadius: 44 }, 0);
        if (shade) tl.to(shade, { opacity: 0.55 }, 0);
      });

      /* ---------- Titres : révélation ligne par ligne ---------- */
      const splits: SplitText[] = [];
      gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el) => {
        const onLoad = el.dataset.split === "load";
        const split = SplitText.create(el, {
          type: "lines",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          onSplit(self) {
            return gsap.from(self.lines, {
              yPercent: 112,
              rotate: 2.5,
              transformOrigin: "0% 100%",
              duration: 1.25,
              stagger: 0.09,
              ease: "expo.out",
              delay: onLoad ? 0.35 : 0,
              scrollTrigger: onLoad ? undefined : { trigger: el, start: "top 86%", once: true },
            });
          },
        });
        splits.push(split);
      });

      /* ---------- Blocs ---------- */
      gsap.set("[data-reveal]", { y: 46, autoAlpha: 0 });
      ScrollTrigger.batch("[data-reveal]", {
        start: "top 90%",
        once: true,
        onEnter: (els) =>
          gsap.to(els, { y: 0, autoAlpha: 1, duration: 1.1, stagger: 0.08, ease: "expo.out", overwrite: true }),
      });

      /* ---------- Découpes collées ---------- */
      gsap.utils.toArray<HTMLElement>("[data-drop]").forEach((el, i) => {
        const rot = parseFloat(el.dataset.drop || "4");
        const onLoad = el.dataset.dropLoad === "true";
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: -70, rotate: rot - 14, scale: 1.08 },
          {
            autoAlpha: 1,
            y: 0,
            rotate: rot,
            scale: 1,
            duration: 1.4,
            ease: "expo.out",
            delay: onLoad ? 0.75 + i * 0.12 : 0,
            scrollTrigger: onLoad ? undefined : { trigger: el, start: "top 88%", once: true },
          },
        );
      });

      /* ---------- Parallaxe douce ---------- */
      gsap.utils.toArray<HTMLElement>("[data-speed]").forEach((el) => {
        const speed = parseFloat(el.dataset.speed || "0.2");
        gsap.to(el, {
          yPercent: -100 * speed,
          ease: "none",
          scrollTrigger: { trigger: el.closest(".panel") ?? el, start: "top bottom", end: "bottom top", scrub: true },
        });
      });

      /* ---------- Galerie : dérive horizontale liée au scroll ---------- */
      gsap.utils.toArray<HTMLElement>("[data-drift]").forEach((el) => {
        gsap.fromTo(
          el,
          { x: 120 },
          {
            x: -120,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });

      /* ---------- Compteurs ---------- */
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const target = parseFloat(el.dataset.count || "0");
        const decimals = parseInt(el.dataset.decimals || "0", 10);
        const suffix = el.dataset.suffix || "";
        const fmt = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
        const obj = { v: 0 };
        el.textContent = fmt.format(0) + suffix;
        gsap.to(obj, {
          v: target,
          duration: 2.2,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
          onUpdate: () => {
            el.textContent = fmt.format(obj.v) + suffix;
          },
        });
      });

      /* ---------- Bandeau : boucle dont la vitesse suit le scroll ---------- */
      gsap.utils.toArray<HTMLElement>(".marquee-track").forEach((track) => {
        const loop = gsap.to(track, { xPercent: -50, duration: 32, ease: "none", repeat: -1 });
        ScrollTrigger.create({
          trigger: track,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            const v = Math.min(Math.abs(self.getVelocity()) / 400, 5);
            gsap.to(loop, { timeScale: (self.direction < 0 ? -1 : 1) * (1 + v), duration: 0.3, overwrite: true });
            gsap.to(loop, { timeScale: self.direction < 0 ? -1 : 1, duration: 1.2, delay: 0.3, overwrite: false });
          },
        });
      });

      // Recalcule une fois les polices chargées (les hauteurs de lignes changent).
      document.fonts?.ready.then(() => ScrollTrigger.refresh());

      return () => {
        splits.forEach((s) => s.revert());
        ScrollTrigger.removeEventListener("refreshInit", sizeSpacers);
        spacers.forEach((s) => s.remove());
      };
    });
  });

  return null;
}
