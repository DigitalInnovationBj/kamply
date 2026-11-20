"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { IconArrowRight, IconBrandGoogle, IconBrandMeta } from "@tabler/icons-react";
import { Button } from "@/components/ui/Button";

const CHANNELS = [
  { id: "google", label: "Google Ads", icon: IconBrandGoogle },
  { id: "meta", label: "Meta Ads", icon: IconBrandMeta },
] as const;

const PLANS = [
  { name: "Standard", price: 149, google: "≈ 120 visites qualifiées", meta: "≈ 25 000 personnes touchées", feat: "1 campagne · annonces IA · rapport mensuel" },
  { name: "Basique", price: 299, google: "≈ 270 visites qualifiées", meta: "≈ 55 000 personnes touchées", feat: "Suivi des conversions · rapport hebdomadaire" },
  { name: "Essentiel", price: 599, google: "≈ 570 visites qualifiées", meta: "≈ 115 000 personnes touchées", feat: "Optimisation quotidienne · tests d'annonces" },
  { name: "Premium", price: 1199, google: "≈ 1 150 visites qualifiées", meta: "≈ 235 000 personnes touchées", feat: "Accompagnement dédié · audiences avancées" },
];

const fmt = new Intl.NumberFormat("fr-FR");

export function Pricing() {
  const [channel, setChannel] = useState(0);
  const [plan, setPlan] = useState(1);
  const segRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ left: 5, width: 0 });

  // Le curseur noir du sélecteur glisse sous l'option active.
  useLayoutEffect(() => {
    const seg = segRef.current;
    if (!seg) return;
    const place = () => {
      const btn = seg.querySelectorAll("button")[channel] as HTMLElement | undefined;
      if (btn) setThumb({ left: btn.offsetLeft, width: btn.offsetWidth });
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(seg);
    return () => ro.disconnect();
  }, [channel]);

  const key = CHANNELS[channel].id;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-center justify-between gap-5" data-reveal>
        <div ref={segRef} className="seg" role="radiogroup" aria-label="Canal publicitaire">
          <span className="seg-thumb" style={{ left: thumb.left, width: thumb.width }} aria-hidden="true" />
          {CHANNELS.map((c, i) => (
            <button key={c.id} type="button" role="radio" aria-checked={channel === i} onClick={() => setChannel(i)}>
              <c.icon size={18} stroke={2.2} /> {c.label}
            </button>
          ))}
        </div>
        <span className="t-meta">Budget publicitaire inclus · sans engagement</span>
      </div>

      <div role="radiogroup" aria-label="Choisir une formule" data-reveal>
        {PLANS.map((p, i) => (
          <button key={p.name} type="button" role="radio" aria-checked={plan === i} className="plan-row" onClick={() => setPlan(i)}>
            <span className="display" style={{ fontSize: "clamp(44px, 5.4vw, 84px)", lineHeight: 0.85 }}>
              {p.name}
            </span>
            <span className="grid gap-1.5">
              <span style={{ font: "800 18px/1.3 var(--font-sans)", letterSpacing: "-.01em" }}>{p[key]} / mois</span>
              <span style={{ font: "500 15px/1.45 var(--font-sans)", opacity: 0.75 }}>{p.feat}</span>
            </span>
            <span className="text-right whitespace-nowrap" style={{ font: "900 clamp(30px, 3.2vw, 48px)/1 var(--font-sans)", letterSpacing: "-.035em" }}>
              {fmt.format(p.price)} €<small className="block t-meta mt-1.5">par mois</small>
            </span>
            <span className="plan-arrow" aria-hidden="true">
              <IconArrowRight size={20} stroke={2.4} />
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-between items-center gap-5" data-reveal>
        <p className="m-0" style={{ font: "600 15px/1.4 var(--font-sans)" }}>
          Estimations indicatives selon votre secteur et votre zone. Changez de formule à tout moment.
        </p>
        <Button href="#demarrer" variant="black">
          {`Choisir ${PLANS[plan].name} · ${CHANNELS[channel].label}`}
        </Button>
      </div>
    </div>
  );
}
