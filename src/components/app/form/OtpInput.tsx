"use client";

import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  state?: "idle" | "error" | "success";
  disabled?: boolean;
  autoFocus?: boolean;
};

const LEN = 6;

/**
 * Code à 6 chiffres en 6 cases :
 * passage automatique à la case suivante, retour arrière intelligent, flèches,
 * collage du code entier, remplissage automatique du code reçu (autocomplete one-time-code).
 */
export function OtpInput({ value, onChange, onComplete, state = "idle", disabled, autoFocus }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: LEN }, (_, i) => value[i] ?? "");

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  // Après une erreur, on revient sur la première case pour ressaisir.
  useEffect(() => {
    if (state === "error") refs.current[0]?.select();
  }, [state]);

  const commit = (next: string) => {
    const clean = next.replace(/\D/g, "").slice(0, LEN);
    onChange(clean);
    if (clean.length === LEN) onComplete?.(clean);
    return clean;
  };

  const setAt = (i: number, raw: string) => {
    const chars = raw.replace(/\D/g, "");
    if (!chars) return;
    // Saisie de plusieurs chiffres d'un coup (autofill iOS / Android) : on répartit.
    const arr = digits.slice();
    for (let k = 0; k < chars.length && i + k < LEN; k++) arr[i + k] = chars[k];
    const clean = commit(arr.join(""));
    const nextIndex = Math.min(i + chars.length, LEN - 1);
    if (clean.length < LEN) refs.current[nextIndex]?.focus();
    else refs.current[LEN - 1]?.blur();
  };

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const arr = digits.slice();
      if (arr[i]) {
        arr[i] = "";
        commit(arr.join(""));
      } else if (i > 0) {
        arr[i - 1] = "";
        commit(arr.join(""));
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault();
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < LEN - 1) {
      e.preventDefault();
      refs.current[i + 1]?.focus();
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (!/\d/.test(text)) return;
    e.preventDefault();
    const clean = commit(text);
    refs.current[Math.min(clean.length, LEN - 1)]?.focus();
  };

  return (
    <div className="otp" data-state={state} role="group" aria-label="Code de vérification à 6 chiffres">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="otp-cell"
          data-filled={!!d}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={i === 0 ? LEN : 1}
          value={d}
          disabled={disabled}
          aria-label={`Chiffre ${i + 1} sur ${LEN}`}
          onChange={(e) => {
            const v = e.target.value;
            setAt(i, v.length > 1 && d ? v.replace(d, "") || d : v);
          }}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
