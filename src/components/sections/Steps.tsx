import Image from "next/image";
import { Panel } from "@/components/ui/Panel";
import { MetaAd, PhotoVisual, SearchAd, ShoppingAd, FLOWERS } from "@/components/ui/Ads";
import { TypingDemo } from "./TypingDemo";
import { DragScroll } from "./DragScroll";

export function StepPaste() {
  return (
    <Panel id="comment" bg="#ff5b23" label="Étape 1 : collez votre adresse" className="grid gap-12 content-between" innerStyle={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 520px), 1fr))" }}>
      <div className="flex flex-col justify-between gap-10">
        <div className="t-meta flex justify-between gap-5" data-reveal>
          <span>01 / 03</span>
          <span>Étape une</span>
        </div>
        <h2 className="display t-big m-0" data-split>
          Collez
          <br />
          votre
          <br />
          adresse.
        </h2>
        <p className="t-lead m-0" data-reveal>
          Votre site ou votre boutique en ligne. L&apos;IA comprend ce que vous vendez, où vous livrez, et à qui vous parlez.
        </p>
      </div>
      <div className="relative min-h-[460px] flex flex-col justify-center">
        <div data-reveal>
          <TypingDemo />
        </div>
        <div className="display hidden lg:block absolute -right-2 -bottom-10 select-none" style={{ fontSize: 300, lineHeight: 0.8 }} data-speed="0.25" aria-hidden="true">
          01
        </div>
      </div>
    </Panel>
  );
}

export function StepWrite() {
  return (
    <Panel bg="#18cccd" label="Étape 2 : l'IA écrit vos annonces" className="flex flex-col gap-11">
      <div className="t-meta flex justify-between gap-5" data-reveal>
        <span>02 / 03</span>
        <span>Étape deux</span>
      </div>
      <div className="flex flex-wrap justify-between items-end gap-7">
        <h2 className="display t-big m-0" data-split>
          L&apos;IA écrit.
          <br />
          Vous choisissez.
        </h2>
        <p className="t-lead m-0" data-reveal>
          Titres, descriptions, mots-clés et visuels créés à partir de votre site. Vous gardez ce qui vous plaît, vous modifiez le reste.
        </p>
      </div>

      <DragScroll>
        <div className="flex gap-[22px] items-start" data-drift>
          <MetaAd
            name="Maison Lune"
            initials="ML"
            avatar={{ background: "#000", color: "#ff5b23" }}
            copy="Bouquets de saison, livrés le jour même."
            rotate={-2}
            visual={<PhotoVisual src={FLOWERS.whitePink} alt="Bouquet de fleurs blanches et roses" kicker="Livraison offerte dès 50 €" title="Le bouquet qui dit tout." />}
            url="maisonlune.com"
            cta="Composer mon bouquet"
            button="Acheter"
          />
          <SearchAd
            rotate={1.5}
            domain="maisonlune.com"
            title="Fleuriste à Paris — Livraison en 3 h, 7 j/7"
            text="Bouquets frais composés à la main. Roses, pivoines, compositions de saison. Commandez avant 16 h, livré aujourd'hui."
            links={["Bouquets", "Mariage", "Abonnement"]}
          />
          <MetaAd
            name="Atlas Fitness"
            initials="A"
            avatar={{ background: "#ff5b23", color: "#000" }}
            copy="Votre première semaine est offerte."
            rotate={-1}
            visualStyle={{ background: "#f5f5f3", color: "#000" }}
            visual={
              <>
                <div className="absolute rounded-full" style={{ left: -40, top: -40, width: 220, height: 220, background: "#18cccd" }} />
                <div className="absolute rounded-full" style={{ right: 24, top: 34, width: 70, height: 70, background: "#000" }} />
                <div className="ad-visual-kicker">Ouvert 7 j/7 · 6 h – 23 h</div>
                <div className="ad-visual-title">Le sport, sans l&apos;excuse.</div>
              </>
            }
            url="atlas-fitness.fr"
            cta="Réserver ma séance"
            button="S'inscrire"
          />
          <ShoppingAd
            rotate={2}
            domain="pepite-bijoux.com"
            products={[
              {
                name: "Créoles or 18 carats",
                price: "89,00 €",
                bg: "#ff5b23",
                visual: <div className="absolute rounded-full" style={{ left: "50%", top: "50%", width: 60, height: 60, border: "8px solid #000", transform: "translate(-50%,-50%)" }} />,
              },
              {
                name: "Pendentif perle",
                price: "54,00 €",
                bg: "#18cccd",
                visual: (
                  <>
                    <div className="absolute" style={{ left: "50%", top: "28%", width: 6, height: 50, background: "#000", transform: "translateX(-50%)" }} />
                    <div className="absolute rounded-full" style={{ left: "50%", top: "62%", width: 26, height: 26, background: "#000", transform: "translateX(-50%)" }} />
                  </>
                ),
              },
            ]}
          />
          <MetaAd
            name="Nova Coffee"
            initials="N"
            avatar={{ background: "#18cccd", color: "#000" }}
            copy="Café de spécialité, torréfié chaque semaine."
            rotate={-2.5}
            visualStyle={{ background: "#000", color: "#f5f5f3" }}
            visual={
              <>
                <div className="absolute rounded-full" style={{ right: -30, top: -30, width: 200, height: 200, border: "26px solid #18cccd" }} />
                <div className="ad-visual-kicker" style={{ color: "#ff5b23" }}>
                  Abonnement dès 14 €
                </div>
                <div className="ad-visual-title">Le bon café, chez vous chaque mois.</div>
              </>
            }
            url="novacoffee.co"
            cta="Découvrir l'abonnement"
            button="S'abonner"
          />
          <SearchAd
            rotate={1}
            domain="lumen-dentaire.fr"
            title="Dentiste à Lyon 6e — Rendez-vous sous 48 h"
            text="Soins, blanchiment, implants. Cabinet moderne, tiers payant. Prenez rendez-vous en ligne en 2 minutes."
            links={["Prendre RDV", "Tarifs", "Urgences"]}
          />
        </div>
      </DragScroll>
    </Panel>
  );
}

export function FlowerCutout() {
  return (
    <div className="relative overflow-hidden" style={{ width: 260, aspectRatio: "4 / 5", borderRadius: 18 }}>
      <Image src={FLOWERS.purple} alt="Bouquets de fleurs violettes et feuillage" fill sizes="260px" className="object-cover" />
    </div>
  );
}
