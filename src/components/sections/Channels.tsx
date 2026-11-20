import { IconBrandFacebook, IconBrandGoogle, IconBrandInstagram, IconCheck } from "@tabler/icons-react";
import { Panel } from "@/components/site/Panel";

const GOOGLE = ["Annonces sur la recherche Google", "Google Shopping pour les boutiques en ligne", "Suivi des appels, formulaires et ventes"];
const META = ["Visuels et textes générés par l'IA", "Catalogue produits et pixel Meta inclus", "Ciblage par intérêts, âge et zone"];

export function Channels() {
  return (
    <Panel id="canaux" bg="#f5f5f3" grain={false} label="Étape 3 : Google Ads ou Meta Ads" className="flex flex-col gap-12">
      <div className="t-meta flex justify-between gap-5" data-reveal>
        <span>03 / 03</span>
        <span>Étape trois</span>
      </div>
      <div className="flex flex-wrap justify-between items-end gap-7">
        <h2 className="display t-big m-0" data-split>
          Google
          <br />
          ou <span style={{ color: "#ff5b23" }}>Meta.</span>
        </h2>
        <p className="t-lead m-0" style={{ color: "#3a3a37" }} data-reveal>
          Chaque campagne vit sur un canal. Vous choisissez celui qui colle à votre objectif, KAMPLY la configure, la lance et l&apos;optimise chaque jour.
        </p>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))" }}>
        <article className="channel" data-reveal>
          <span className="channel-ico" style={{ background: "#000", color: "#f5f5f3" }}>
            <IconBrandGoogle size={30} stroke={2} />
          </span>
          <h3 className="display m-0" style={{ fontSize: "clamp(56px, 7vw, 112px)", lineHeight: 0.82 }}>
            Google Ads
          </h3>
          <p className="m-0" style={{ font: "700 20px/1.35 var(--font-sans)", letterSpacing: "-.01em" }}>
            Soyez trouvé par ceux qui cherchent déjà ce que vous vendez.
          </p>
          <ul className="channel-sub m-0 p-0 list-none grid gap-2.5" style={{ font: "500 16px/1.4 var(--font-sans)" }}>
            {GOOGLE.map((g) => (
              <li key={g} className="flex gap-2.5">
                <IconCheck size={20} stroke={2.4} className="flex-none" /> {g}
              </li>
            ))}
          </ul>
          <span className="tag self-start whitespace-normal h-auto py-2.5 leading-snug" style={{ background: "#ff5b23", color: "#000" }}>
            Idéal : services, urgences, e-commerce
          </span>
        </article>

        <article className="channel" data-reveal>
          <span className="flex gap-2">
            <span className="channel-ico" style={{ background: "#ff5b23", color: "#000" }}>
              <IconBrandFacebook size={30} stroke={2} />
            </span>
            <span className="channel-ico" style={{ background: "#18cccd", color: "#000" }}>
              <IconBrandInstagram size={30} stroke={2} />
            </span>
          </span>
          <h3 className="display m-0" style={{ fontSize: "clamp(56px, 7vw, 112px)", lineHeight: 0.82 }}>
            Meta Ads
          </h3>
          <p className="m-0" style={{ font: "700 20px/1.35 var(--font-sans)", letterSpacing: "-.01em" }}>
            Faites-vous découvrir sur Facebook et Instagram.
          </p>
          <ul className="channel-sub m-0 p-0 list-none grid gap-2.5" style={{ font: "500 16px/1.4 var(--font-sans)" }}>
            {META.map((g) => (
              <li key={g} className="flex gap-2.5">
                <IconCheck size={20} stroke={2.4} className="flex-none" /> {g}
              </li>
            ))}
          </ul>
          <span className="tag self-start whitespace-normal h-auto py-2.5 leading-snug" style={{ background: "#18cccd", color: "#000" }}>
            Idéal : produits, mode, restauration, événements
          </span>
        </article>
      </div>
    </Panel>
  );
}
