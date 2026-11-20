"use client";

import { useState } from "react";
import { IconPlus } from "@tabler/icons-react";

const QA = [
  ["Faut-il un site internet ?", "Pour Google Ads, oui : vos annonces renvoient vers votre site. Pour Meta Ads, une page Facebook ou un compte Instagram suffit pour démarrer."],
  ["Google Ads ou Meta Ads, lequel choisir ?", "Google Ads touche les personnes qui cherchent déjà votre produit ou service. Meta Ads fait découvrir votre marque sur Facebook et Instagram. KAMPLY vous recommande le canal adapté à votre activité, et vous pouvez lancer les deux en parallèle."],
  ["Que comprend le prix de la formule ?", "Tout : le budget publicitaire versé à Google ou Meta, la création des annonces par l'IA, la configuration du compte, le suivi des conversions, l'optimisation et le tableau de bord. Aucun frais caché."],
  ["Quand ma pub sera-t-elle visible ?", "La création prend environ 5 minutes. Google ou Meta vérifient ensuite l'annonce, en général en moins de 24 heures."],
  ["Puis-je arrêter quand je veux ?", "Oui. Sans engagement : vous mettez une campagne en pause, changez de formule ou résiliez en un clic depuis votre tableau de bord."],
] as const;

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div style={{ borderBottom: "2px solid #000" }} data-reveal>
      {QA.map(([q, a], i) => {
        const isOpen = open === i;
        const id = `faq-${i}`;
        return (
          <div key={q} className="faq-item" data-open={isOpen}>
            <button type="button" className="faq-q" aria-expanded={isOpen} aria-controls={id} onClick={() => setOpen(isOpen ? -1 : i)}>
              <span className="t-meta">Q.0{i + 1}</span>
              <span className="faq-title">{q}</span>
              <span className="faq-sign" aria-hidden="true">
                <IconPlus size={22} stroke={2.4} />
              </span>
            </button>
            <div className="faq-body" id={id} role="region">
              <div>
                <p>{a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
