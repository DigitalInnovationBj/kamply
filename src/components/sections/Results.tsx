import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { FlowerCutout } from "./Steps";

const FIGS = [
  { value: 48210, label: "Personnes touchées", color: "#f5f5f3" },
  { value: 146, label: "Commandes en ligne", color: "#18cccd" },
  { value: 6.2, decimals: 1, suffix: "×", label: "Retour sur dépense publicitaire", color: "#ff5b23" },
];

export function Results() {
  return (
    <Panel bg="#000" fg="#f5f5f3" label="Résultats" className="flex flex-col justify-between gap-14">
      <div className="t-meta flex justify-between gap-5" style={{ color: "#a3a3a0" }} data-reveal>
        <span className="inline-flex items-center gap-2" style={{ color: "#18cccd" }}>
          <span className="live-dot" /> En direct
        </span>
        <span>Maison Lune · Meta Ads · 30 jours</span>
      </div>

      <div className="relative">
        <h2 className="display t-big m-0" data-split>
          Et vous,
          <br />
          vous <span style={{ color: "#18cccd" }}>vendez.</span>
        </h2>
        <div className="hidden md:block absolute right-[4%] -top-6" data-drop="-6">
          <span className="tape" style={{ left: "34%", top: -13, transform: "rotate(5deg)" }} aria-hidden="true" />
          <FlowerCutout />
          <span className="tag absolute -left-10 bottom-8" style={{ background: "#18cccd", color: "#000", transform: "rotate(4deg)" }}>
            +146 commandes
          </span>
        </div>
      </div>

      <div className="grid gap-9" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))" }}>
        {FIGS.map((f) => (
          <div key={f.label} className="grid gap-2.5" data-reveal>
            <b
              className="display tabular-nums"
              style={{ fontSize: "clamp(90px, 11.5vw, 190px)", lineHeight: 0.8, color: f.color }}
              data-count={f.value}
              data-decimals={f.decimals ?? 0}
              data-suffix={f.suffix ?? ""}
            >
              {new Intl.NumberFormat("fr-FR", { minimumFractionDigits: f.decimals ?? 0 }).format(f.value)}
              {f.suffix ?? ""}
            </b>
            <span className="t-meta" style={{ color: "#a3a3a0" }}>
              {f.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-between items-end gap-7 pt-7" style={{ borderTop: "1px solid #2a2a2a" }} data-reveal>
        <p className="t-lead m-0" style={{ color: "#a3a3a0" }}>
          Pas de « CPM » ni de « CTR ». Votre tableau de bord parle de visites, d&apos;appels et de ventes.
        </p>
        <Button href="#demarrer" variant="white">
          Voir un tableau de bord
        </Button>
      </div>
    </Panel>
  );
}
