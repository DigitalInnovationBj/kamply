import { IconArrowRight, IconLink } from "@tabler/icons-react";
import { Panel } from "@/components/site/Panel";
import { Pricing } from "./Pricing";
import { Faq } from "./Faq";

export function PricingSection() {
  return (
    <Panel id="tarifs" bg="#ff5b23" label="Tarifs" className="flex flex-col gap-11">
      <div className="t-meta flex justify-between gap-5" data-reveal>
        <span>Tarifs</span>
        <span>Sans engagement · annulable à tout moment</span>
      </div>
      <div className="flex flex-wrap justify-between items-end gap-7">
        <h2 className="display t-big m-0" data-split>
          Un prix.
          <br />
          Tout compris.
        </h2>
        <p className="t-lead m-0" data-reveal>
          Le budget publicitaire, la création des annonces et l&apos;optimisation sont inclus. Choisissez votre canal, puis la formule qui suit votre ambition.
        </p>
      </div>
      <Pricing />
    </Panel>
  );
}

export function FaqSection() {
  return (
    <Panel id="faq" bg="#f5f5f3" grain={false} label="Questions fréquentes" className="flex flex-col gap-12">
      <div className="t-meta flex justify-between gap-5" data-reveal>
        <span>Questions</span>
        <span>Une équipe humaine, 7 j/7</span>
      </div>
      <h2 className="display t-big m-0" data-split>
        Vous vous
        <br />
        demandez&nbsp;?
      </h2>
      <Faq />
    </Panel>
  );
}

export function OnAir() {
  return (
    <Panel id="demarrer" bg="#000" fg="#f5f5f3" label="Commencer" className="flex flex-col justify-between gap-12">
      <div className="t-meta flex justify-between gap-5" style={{ color: "#a3a3a0" }} data-reveal>
        <span className="inline-flex items-center gap-2" style={{ color: "#ff5b23" }}>
          <span className="live-dot" /> Prêt à diffuser
        </span>
        <span>kamply.site</span>
      </div>

      <div>
        <h2 className="display m-0" style={{ fontSize: "clamp(120px, 24vw, 400px)", lineHeight: 0.8, color: "#ff5b23" }} data-split>
          On air.
        </h2>
        <p className="t-lead mt-7 mb-0" style={{ color: "#a3a3a0" }} data-reveal>
          Collez votre adresse, votre première campagne est prête dans 5 minutes.
        </p>
        <form className="url-field mt-7" style={{ width: "min(640px, 100%)" }} action="/inscription" method="get" data-reveal>
          <IconLink size={22} stroke={2} color="#5c5c58" aria-hidden="true" />
          <label htmlFor="start-url" className="sr-only">
            Adresse de votre site ou de votre page
          </label>
          <input id="start-url" name="site" type="text" inputMode="url" autoComplete="url" placeholder="votresite.com" />
          <button type="submit" className="url-go" aria-label="Lancer l'analyse">
            <IconArrowRight size={20} stroke={2.4} />
          </button>
        </form>
      </div>

      <footer className="flex flex-wrap justify-between items-end gap-7 pt-7" style={{ borderTop: "1px solid #2a2a2a", color: "#a3a3a0", font: "500 14px/1.6 var(--font-sans)" }}>
        <span className="display" style={{ fontSize: 64, lineHeight: 0.8, color: "#f5f5f3" }}>
          KAMPLY
        </span>
        <nav className="flex flex-wrap gap-7" aria-label="Pied de page">
          {[
            ["#comment", "Comment ça marche"],
            ["#tarifs", "Tarifs"],
            ["#faq", "FAQ"],
            ["/connexion", "Connexion"],
            ["mailto:contact@kamply.site", "Contact"],
            ["/conditions", "Conditions"],
            ["/confidentialite", "Confidentialité"],
          ].map(([href, label]) => (
            <a key={label} href={href} className="no-underline transition-colors duration-300 hover:text-[#f5f5f3]" style={{ color: "inherit" }}>
              {label}
            </a>
          ))}
        </nav>
        <span>© 2026 KAMPLY</span>
      </footer>
    </Panel>
  );
}
