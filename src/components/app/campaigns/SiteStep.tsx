"use client";

import { useEffect, useRef, useState } from "react";
import { IconAlertTriangle, IconArrowRight, IconCheck, IconPencil, IconSparkles, IconWorld } from "@tabler/icons-react";
import { Field } from "@/components/app/form/Field";
import { analyzeSite, type Analysis } from "@/app/actions/ai";
import { cn } from "@/lib/utils";

const PHASES = ["Lecture de votre site", "Compréhension de votre offre", "Rédaction des annonces", "Choix des mots-clés et du ciblage"];

type Props = { website?: string | null; onDone: (a: Analysis) => void; onSkip: () => void };

/** Première étape : KAMPLY lit le site (ou une description) et prépare toute la campagne. */
export function SiteStep({ website, onDone, onSkip }: Props) {
  const [url, setUrl] = useState(website ?? "");
  const [describe, setDescribe] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<{ msg: string; offerDescribe: boolean } | null>(null);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [result, setResult] = useState<Analysis | null>(null);
  const [imgOk, setImgOk] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => void (timer.current && clearInterval(timer.current)), []);

  const run = async () => {
    setError(null);
    if (!describe && url.trim().length < 4) return setError({ msg: "Indiquez l'adresse de votre site.", offerDescribe: true });
    if (describe && text.trim().length < 20) return setError({ msg: "Décrivez votre activité en une ou deux phrases (20 caractères minimum).", offerDescribe: false });
    setRunning(true);
    setPhase(0);
    setResult(null);
    // Les étapes avancent au rythme moyen d'une analyse ; la dernière attend la réponse.
    timer.current = setInterval(() => setPhase((p) => Math.min(p + 1, PHASES.length - 1)), 2600);
    const r = await analyzeSite(describe ? { url, description: text } : { url });
    if (timer.current) clearInterval(timer.current);
    if (!r.ok) {
      setRunning(false);
      setError({ msg: r.error, offerDescribe: !describe && (r.code?.startsWith("SITE_") ?? false) });
      return;
    }
    setPhase(PHASES.length);
    setResult(r.data!);
    setTimeout(() => onDone(r.data!), 2300);
  };

  if (running) {
    const d = result?.draft;
    return (
      <div className="relative -m-5 overflow-hidden rounded-[24px] bg-black p-6 text-[#f5f5f3] sm:-m-7 sm:p-9" role="status" aria-live="polite">
        <div className="flex items-center gap-2.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#a3a3a0]">
          <span className={cn("size-2 rounded-full", result ? "bg-[#18cccd]" : "animate-pulse bg-primary")} />
          {result ? "Campagne prête" : "Analyse en cours"}
          <span className="ml-auto truncate font-mono normal-case tracking-normal text-[#5c5c58]">{describe ? "votre description" : url.replace(/^https?:\/\//, "")}</span>
        </div>

        <ol className="mt-8 grid gap-4">
          {PHASES.map((p, i) => {
            const done = i < phase;
            const now = i === phase;
            return (
              <li key={p} className={cn("flex items-center gap-4 transition-all duration-500", i > phase && "opacity-25")}>
                <span className={cn("grid size-9 flex-none place-items-center rounded-full transition-colors duration-500", done ? "bg-[#18cccd] text-black" : now ? "bg-primary text-black" : "bg-white/10")}>
                  {done ? <IconCheck size={18} stroke={3} /> : <span className="text-sm font-black tabular-nums">{i + 1}</span>}
                </span>
                <span className="text-[17px] font-bold sm:text-[19px]">{p}</span>
                {now && <span className="ai-scan ml-auto hidden h-[3px] w-24 overflow-hidden rounded-full bg-white/10 sm:block" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>

        {d && (
          <div className="rise mt-9 grid gap-4 rounded-[20px] bg-white/[.06] p-4 sm:grid-cols-[96px_1fr] sm:p-5">
            {result.images[0] && imgOk ? (
              // eslint-disable-next-line @next/next/no-img-element -- image du site du client
              <img src={result.images[0]} alt="" className="aspect-square w-24 rounded-2xl object-cover" referrerPolicy="no-referrer" onError={() => setImgOk(false)} />
            ) : (
              <span className="grid size-24 place-items-center rounded-2xl bg-white/10">
                <IconWorld size={30} />
              </span>
            )}
            <div className="min-w-0">
              <div className="font-display text-[34px] uppercase leading-[0.85]">{d.business.name}</div>
              <div className="mt-2 text-sm text-[#a3a3a0]">
                {d.business.sector}
                {d.business.city ? ` · ${d.business.city}` : ""}
              </div>
              <p className="mt-2 text-[15px] leading-relaxed">{d.business.summary}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#18cccd]/20 px-3 py-1 text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#08787a]">
        <IconSparkles size={14} /> Rédaction automatique
      </span>
      <h2 className="mt-4 text-[26px] font-black leading-tight tracking-[-0.03em] sm:text-[32px]">Partez de votre site.</h2>
      <p className="mb-6 mt-2 max-w-[520px] text-[15px] leading-relaxed text-muted-foreground">
        KAMPLY le lit, comprend ce que vous vendez et prépare tout : canal conseillé, ciblage, annonces, mots-clés et visuel. Vous validez ou modifiez chaque élément.
      </p>

      {!describe ? (
        <Field
          label="Adresse de votre site"
          icon={<IconWorld size={20} stroke={2} />}
          inputMode="url"
          autoCapitalize="none"
          autoComplete="url"
          placeholder="maisonlune.fr"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), void run())}
          error={error?.msg}
        />
      ) : (
        <div className="kf" data-invalid={!!error}>
          <label htmlFor="biz" className="kf-label">
            Votre activité en deux phrases
          </label>
          <div className="kf-box !h-auto">
            <textarea
              id="biz"
              className="kf-input min-h-[120px] resize-none py-3.5 pl-4 leading-relaxed"
              maxLength={600}
              placeholder="Fleuriste à Lyon 6e. Bouquets de saison composés à la main, livraison le jour même et décoration de mariages."
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError(null);
              }}
            />
          </div>
          {error && (
            <p className="kf-msg" data-tone="error" role="alert">
              {error.msg}
            </p>
          )}
        </div>
      )}

      {error?.offerDescribe && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-primary/12 px-4 py-3.5 text-sm">
          <IconAlertTriangle size={18} className="mt-0.5 flex-none text-[#bf3d0c]" />
          <span>
            Pas de souci :{" "}
            <button type="button" onClick={() => (setDescribe(true), setError(null))} className="font-bold underline underline-offset-4">
              décrivez votre activité
            </button>{" "}
            et KAMPLY rédige quand même vos annonces.
          </span>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={run}
          className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-primary px-7 text-[16px] font-extrabold text-black transition-colors duration-300 hover:bg-black hover:text-[#f5f5f3]"
        >
          <IconSparkles size={20} /> {describe ? "Rédiger ma campagne" : "Analyser mon site"}
          <IconArrowRight size={18} stroke={2.4} className="transition-transform duration-500 ease-[cubic-bezier(.76,0,.24,1)] group-hover:-rotate-45" />
        </button>
        <button
          type="button"
          onClick={() => (setDescribe((d) => !d), setError(null))}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-4 text-[15px] font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {describe ? "J'ai un site" : "Je n'ai pas de site"}
        </button>
      </div>
      <button type="button" onClick={onSkip} className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground underline underline-offset-4 hover:text-foreground">
        <IconPencil size={15} /> Je préfère tout remplir moi-même
      </button>
    </div>
  );
}
