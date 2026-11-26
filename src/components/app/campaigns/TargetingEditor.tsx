"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { IconMapPin, IconPlus, IconSearch, IconTrash, IconX } from "@tabler/icons-react";
import { COUNTRY_CODES, countryName, flag, type CountryTarget, type Targeting } from "@/lib/targeting";
import { cn } from "@/lib/utils";

type Props = { value: Targeting; onChange: (t: Targeting) => void; error?: string };

/** Zones de diffusion : plusieurs pays, chacun entier ou limité à des villes avec rayon. */
export function TargetingEditor({ value, onChange, error }: Props) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const chosen = value.countries.map((c) => c.code);

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    return COUNTRY_CODES.filter((c) => !chosen.includes(c))
      .map((c) => ({ code: c, name: countryName(c) }))
      .filter((c) => !s || c.name.toLowerCase().includes(s) || c.code.toLowerCase() === s)
      .sort((a, b) => a.name.localeCompare(b.name, "fr"))
      .slice(0, s ? 8 : 6);
  }, [q, chosen]);

  const add = (code: string) => {
    onChange({ countries: [...value.countries, { code, mode: "all", cities: [] }] });
    setQ("");
    setOpen(false);
  };
  const update = (code: string, patch: Partial<CountryTarget>) => onChange({ countries: value.countries.map((c) => (c.code === code ? { ...c, ...patch } : c)) });
  const remove = (code: string) => onChange({ countries: value.countries.filter((c) => c.code !== code) });

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 [&>*]:min-w-0">
      <div className="grid min-w-0 gap-2">
        <span className="kf-label">Pays de diffusion</span>
        {value.countries.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {value.countries.map((c) => (
              <span key={c.code} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-black pl-3 pr-1.5 text-[13px] font-bold text-[#f5f5f3]">
                <span aria-hidden="true">{flag(c.code)}</span> {countryName(c.code)}
                <button type="button" onClick={() => remove(c.code)} className="grid size-6 place-items-center rounded-full hover:bg-white/20" aria-label={`Retirer ${countryName(c.code)}`}>
                  <IconX size={13} stroke={3} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="relative">
          <label className="kf-box !h-12" data-invalid={!!error && !value.countries.length}>
            <span className="kf-icon" aria-hidden="true">
              <IconSearch size={18} />
            </span>
            <input
              className="kf-input"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter" && matches[0]) {
                  e.preventDefault();
                  add(matches[0].code);
                }
              }}
              placeholder={value.countries.length ? "Ajouter un pays…" : "France, Belgique, Canada…"}
              aria-label="Rechercher un pays"
            />
          </label>
          {open && matches.length > 0 && (
            <ul className="absolute inset-x-0 top-[calc(100%+6px)] z-20 grid max-h-72 gap-0.5 overflow-y-auto rounded-2xl bg-white p-1.5 shadow-[0_24px_48px_-20px_rgba(0,0,0,.35)]">
              {matches.map((m) => (
                <li key={m.code}>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => add(m.code)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] font-semibold hover:bg-muted">
                    <span className="text-lg" aria-hidden="true">
                      {flag(m.code)}
                    </span>
                    {m.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {error && !value.countries.length && (
          <p className="kf-msg" data-tone="error" role="alert">
            {error}
          </p>
        )}
      </div>

      {value.countries.map((c) => (
        <CountryCard key={c.code} c={c} onChange={(patch) => update(c.code, patch)} onRemove={() => remove(c.code)} showError={!!error} />
      ))}
    </div>
  );
}

function CountryCard({ c, onChange, onRemove, showError }: { c: CountryTarget; onChange: (p: Partial<CountryTarget>) => void; onRemove: () => void; showError: boolean }) {
  const [city, setCity] = useState("");
  const addCity = () => {
    const name = city.trim();
    if (name.length < 2 || c.cities.some((v) => v.name.toLowerCase() === name.toLowerCase()) || c.cities.length >= 20) return setCity("");
    onChange({ cities: [...c.cities, { name, radiusKm: 20 }] });
    setCity("");
  };
  const missing = c.mode === "cities" && !c.cities.length;

  return (
    <section className="rounded-2xl bg-muted p-4" aria-label={countryName(c.code)}>
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">
          {flag(c.code)}
        </span>
        <span className="min-w-0 flex-1 truncate text-[16px] font-black tracking-[-0.02em]">{countryName(c.code)}</span>
        <button type="button" onClick={onRemove} className="grid size-9 place-items-center rounded-xl text-muted-foreground hover:bg-white hover:text-destructive" aria-label={`Retirer ${countryName(c.code)}`}>
          <IconTrash size={16} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-white p-1" role="radiogroup" aria-label={`Zone en ${countryName(c.code)}`}>
        {(
          [
            ["all", "Tout le pays"],
            ["cities", "Villes précises"],
          ] as const
        ).map(([m, l]) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={c.mode === m}
            onClick={() => onChange({ mode: m })}
            className={cn("h-10 rounded-full text-sm font-bold transition-colors duration-300", c.mode === m ? "bg-black text-[#f5f5f3]" : "text-muted-foreground hover:text-foreground")}
          >
            {l}
          </button>
        ))}
      </div>

      {c.mode === "cities" && (
        <div className="mt-3 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2">
          {c.cities.map((v, i) => (
            <div key={v.name} className="grid gap-2 rounded-xl bg-white p-3">
              <div className="flex items-center gap-2">
                <IconMapPin size={16} className="flex-none text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-[15px] font-bold">{v.name}</span>
                <span className="rounded-full bg-black px-2.5 py-0.5 text-[13px] font-bold tabular-nums text-[#f5f5f3]">{v.radiusKm} km</span>
                <button type="button" onClick={() => onChange({ cities: c.cities.filter((_, k) => k !== i) })} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive" aria-label={`Retirer ${v.name}`}>
                  <IconX size={15} stroke={2.6} />
                </button>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={v.radiusKm}
                onChange={(e) => onChange({ cities: c.cities.map((x, k) => (k === i ? { ...x, radiusKm: Number(e.target.value) } : x)) })}
                className="h-2 w-full cursor-pointer accent-[#ff5b23]"
                aria-label={`Rayon autour de ${v.name}, en kilomètres`}
              />
            </div>
          ))}
          <div className="flex gap-2">
            <label className="kf-box !h-12 min-w-0 flex-1" data-invalid={showError && missing}>
              <span className="kf-icon" aria-hidden="true">
                <IconMapPin size={18} />
              </span>
              <input
                className="kf-input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCity())}
                placeholder="Lyon, Bruxelles…"
                autoComplete="address-level2"
                aria-label={`Ajouter une ville en ${countryName(c.code)}`}
              />
            </label>
            <button type="button" onClick={addCity} className="inline-flex h-12 flex-none items-center gap-1.5 rounded-full bg-black px-4 text-sm font-bold text-[#f5f5f3] hover:bg-primary hover:text-black">
              <IconPlus size={16} stroke={2.6} /> Ajouter
            </button>
          </div>
          {showError && missing && (
            <p className="kf-msg" data-tone="error" role="alert">
              Ajoutez au moins une ville, ou choisissez « Tout le pays ».
            </p>
          )}
        </div>
      )}
    </section>
  );
}
