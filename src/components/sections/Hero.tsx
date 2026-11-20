import { IconBolt } from "@tabler/icons-react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { MetaAd, PhotoVisual, SearchAd, FLOWERS, PHOTOS } from "@/components/ui/Ads";

const SECTORS = ["E-commerce", "Fleuristes", "Restaurants", "Salons de beauté", "Cabinets", "Artisans", "Coachs", "Immobilier", "Hôtels", "Agences"];

export function Hero() {
  return (
    <Panel bg="#000" fg="#f5f5f3" label="Présentation" className="flex flex-col justify-between gap-10" innerStyle={{ paddingBottom: 0 }}>
      <div className="relative flex-1 flex flex-col justify-center pt-6">
        <h1 className="display t-mega m-0 relative z-[2]" data-split="load">
          Vos pubs
          <br />
          <span style={{ color: "#ff5b23" }}>
            Google
            <br />
            &amp; Meta
          </span>
          <br />
          en 5 min.
        </h1>

        <div
          className="relative z-[3] mt-10 mx-auto lg:mx-0 lg:mt-0 lg:absolute lg:right-[2%] lg:top-1/2 lg:-translate-y-1/2"
          style={{ width: "min(100%, 560px)", height: 610 }}
          aria-label="Exemples de campagnes générées"
        >
          <div className="absolute left-0 top-[96px]" data-drop="-7" data-drop-load="true">
            <SearchAd
              hover={false}
              domain="lumen-dentaire.fr"
              title="Dentiste à Lyon 6e | Rendez-vous sous 48 h"
              text="Soins, blanchiment, implants. Prenez rendez-vous en ligne en 2 minutes."
              links={["Prendre RDV", "Tarifs"]}
              image={PHOTOS.dentist}
              imageAlt="Fauteuil de cabinet dentaire moderne"
            />
          </div>

          <div className="absolute right-0 top-0" data-drop="4" data-drop-load="true">
            <span className="tape" style={{ left: "38%", top: -13, transform: "rotate(-6deg)" }} aria-hidden="true" />
            <MetaAd
              name="Maison Lune"
              initials="ML"
              avatar={{ background: "#ff5b23", color: "#000" }}
              ai
              hover={false}
              visual={
                <PhotoVisual
                  src={FLOWERS.pinkWhite}
                  alt="Bouquet de fleurs roses et blanches"
                  kicker="Fleuriste · Livré en 3 h"
                  title="Des fleurs qui font parler d'elles."
                  priority
                />
              }
              url="maisonlune.com"
              cta="Commander un bouquet"
              button="Acheter"
            />
          </div>

          <div className="absolute z-[5] -left-2 bottom-[18px] lg:-left-12" data-drop="-5" data-drop-load="true">
            <span className="tag" style={{ background: "#18cccd", color: "#000" }}>
              <IconBolt size={15} stroke={2.4} /> Campagne lancée en 4 min 52 s
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-between items-end gap-7 pb-[var(--pad)]" data-reveal>
        <p className="t-lead m-0" style={{ color: "#a3a3a0" }}>
          KAMPLY crée vos campagnes Google Ads ou Meta Ads avec l&apos;IA, les lance pour vous et vous montre les résultats en direct. Sans agence, sans
          expertise.
        </p>
        <Button href="#demarrer">Créer ma première campagne</Button>
      </div>

      <div className="marquee -mx-[var(--pad)]" style={{ background: "#18cccd", color: "#000" }} aria-hidden="true">
        <div className="marquee-track py-4" style={{ font: "800 15px/1 var(--font-sans)", letterSpacing: ".14em", textTransform: "uppercase" }}>
          {[...SECTORS, ...SECTORS].map((s, i) => (
            <span key={i}>✦ {s}</span>
          ))}
        </div>
      </div>
    </Panel>
  );
}
