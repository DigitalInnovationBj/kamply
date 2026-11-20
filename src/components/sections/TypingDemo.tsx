"use client";

import { useEffect, useRef, useState } from "react";
import { IconArrowRight, IconCheck, IconLink, IconMapPin, IconSparkles, IconTarget, IconUsers } from "@tabler/icons-react";

const URL_DEMO = "maisonlune.com";
const TAGS = [
  { step: 1, icon: IconCheck, label: "Fleuriste en ligne", tone: "dark" },
  { step: 1, icon: IconMapPin, label: "Livraison Paris & Lyon", tone: "dark" },
  { step: 2, icon: IconUsers, label: "25–55 ans · cadeaux", tone: "light" },
  { step: 2, icon: IconTarget, label: "32 mots-clés", tone: "light" },
  { step: 3, icon: IconSparkles, label: "6 annonces prêtes", tone: "signal" },
] as const;

/** Démo : l'adresse se tape, puis les informations détectées s'allument. Démarre quand elle entre à l'écran. */
export function TypingDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState("");
  const [step, setStep] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers: number[] = [];
    const at = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));
    let running = false;

    const run = () => {
      setTyped("");
      setStep(0);
      let t = 300;
      for (let i = 1; i <= URL_DEMO.length; i++) {
        at(() => setTyped(URL_DEMO.slice(0, i)), t);
        t += 68 + (i % 3) * 14;
      }
      at(() => setStep(1), (t += 450));
      at(() => setStep(2), (t += 650));
      at(() => setStep(3), (t += 650));
      at(run, t + 4200);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          if (reduce) {
            setTyped(URL_DEMO);
            setStep(3);
          } else run();
        }
        if (!entry.isIntersecting && running) {
          running = false;
          timers.splice(0).forEach(clearTimeout);
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div ref={ref} className="flex flex-col gap-6">
      <div className="url-field" role="img" aria-label={`Démonstration : saisie de l'adresse ${URL_DEMO}`}>
        <IconLink size={22} stroke={2} color="#5c5c58" aria-hidden="true" />
        <span className="flex-1 min-w-0 whitespace-nowrap overflow-hidden" aria-hidden="true">
          {typed}
          <span className="caret" />
        </span>
        <span className="url-go" aria-hidden="true">
          <IconArrowRight size={20} stroke={2.4} />
        </span>
      </div>
      <div className="flex flex-wrap gap-2.5 max-w-[560px]">
        {TAGS.map(({ step: s, icon: Icon, label, tone }) => {
          const on = step >= s;
          const style =
            tone === "dark"
              ? { background: "#000", color: "#f5f5f3" }
              : tone === "light"
                ? { background: "#f5f5f3", color: "#000" }
                : { background: "#18cccd", color: "#000" };
          return (
            <span
              key={label}
              className="tag"
              style={{
                ...style,
                opacity: on ? 1 : 0.14,
                transform: on ? "translateY(0) rotate(0deg)" : "translateY(10px) rotate(-2deg)",
                transition: "opacity .5s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1)",
              }}
            >
              <Icon size={15} stroke={2.4} /> {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
