"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { IconBriefcase, IconBuildingStore, IconChevronDown, IconPhone, IconUser, IconWorld } from "@tabler/icons-react";
import { Field } from "@/components/app/form/Field";
import { SubmitButton, pulseState, type SubmitState } from "@/components/app/form/SubmitButton";
import { AvatarUploader, type UploadedImage } from "./AvatarUploader";
import { saveProfile } from "@/app/actions/profile";
import { SECTORS } from "@/lib/sectors";
import { cn } from "@/lib/utils";

type Initial = {
  name: string;
  companyName?: string | null;
  sector?: string | null;
  website?: string | null;
  phone?: string | null;
  image?: string | null;
};

/** Formulaire de profil, utilisé pour l'onboarding et dans les paramètres. */
export function ProfileForm({ initial, mode }: { initial: Initial; mode: "onboarding" | "settings" }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name ?? "");
  const [companyName, setCompanyName] = useState(initial.companyName ?? "");
  const [sector, setSector] = useState(initial.sector ?? "");
  const [website, setWebsite] = useState(initial.website ?? "");
  useEffect(() => {
    if (initial.website) return;
    try {
      const s = sessionStorage.getItem("kamply:site");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture sessionStorage après hydratation
      if (s) setWebsite(s);
    } catch {}
  }, [initial.website]);
  const [phone, setPhone] = useState(initial.phone ?? "");
  // undefined = inchangée · null = retirée · objet = nouvelle image
  const [image, setImage] = useState<UploadedImage | null | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [state, setState] = useState<SubmitState>("idle");
  const clearError = (k: string) => setErrors((prev) => (k in prev || "form" in prev ? { ...prev, [k]: undefined, form: undefined } : prev));

  const filled = [image !== undefined ? image : initial.image, companyName, sector, website, phone].filter(Boolean).length;
  const progress = Math.round(((filled + (name ? 1 : 0)) / 6) * 100);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setState("loading");
    const res = await saveProfile({ name, companyName, sector: sector as (typeof SECTORS)[number], website, phone, image }, { completeOnboarding: mode === "onboarding" });
    if (!res.ok) {
      setErrors(res.fields ?? {});
      toast.error(res.error);
      return void pulseState(setState, "error");
    }
    setErrors({});
    await pulseState(setState, "success", mode === "onboarding" ? 1300 : 1100);
    if (mode === "onboarding") {
      router.replace("/app");
    } else {
      setState("idle");
      setImage(undefined);
      toast.success("Profil enregistré.");
      router.refresh();
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6">
      {mode === "onboarding" && (
        <div className="rise grid gap-2" aria-label={`Profil complété à ${progress} %`}>
          <div className="flex justify-between text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            <span>Profil complété</span>
            <span className="tabular-nums text-foreground">{progress} %</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-[width] duration-700 ease-[cubic-bezier(.16,1,.3,1)]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="rise" style={{ animationDelay: ".05s" }}>
        <AvatarUploader name={name} value={image ?? null} current={image === undefined ? initial.image : null} onChange={setImage} />
      </div>

      <div className="rise grid gap-5 sm:grid-cols-2" style={{ animationDelay: ".1s" }}>
        <Field className="sm:col-span-2" label="Nom complet" icon={<IconUser size={20} stroke={2} />} autoComplete="name" value={name} onChange={(e) => { setName(e.target.value); clearError("name"); }} error={errors.name} />
        <Field
          label="Entreprise"
          icon={<IconBuildingStore size={20} stroke={2} />}
          autoComplete="organization"
          placeholder="Maison Lune"
          value={companyName}
          onChange={(e) => { setCompanyName(e.target.value); clearError("companyName"); }}
          error={errors.companyName}
          valid={companyName.trim().length >= 2}
        />
        <div className="kf" data-invalid={!!errors.sector} data-valid={!!sector && !errors.sector}>
          <label htmlFor="sector" className="kf-label">
            Secteur d&apos;activité
          </label>
          <div className="kf-box">
            <span className="kf-icon" aria-hidden="true">
              <IconBriefcase size={20} stroke={2} />
            </span>
            <select id="sector" className={cn("kf-input appearance-none bg-transparent", !sector && "text-[#a3a3a0]")} value={sector} onChange={(e) => { setSector(e.target.value); clearError("sector"); }} aria-invalid={!!errors.sector}>
              <option value="" disabled>
                Choisissez…
              </option>
              {SECTORS.map((s) => (
                <option key={s} value={s} className="text-foreground">
                  {s}
                </option>
              ))}
            </select>
            <IconChevronDown size={18} stroke={2.2} className="pointer-events-none absolute right-4 text-muted-foreground" aria-hidden="true" />
          </div>
          {errors.sector && (
            <p className="kf-msg" data-tone="error" role="alert">
              {errors.sector}
            </p>
          )}
        </div>
        <Field
          label="Site web"
          icon={<IconWorld size={20} stroke={2} />}
          inputMode="url"
          autoComplete="url"
          autoCapitalize="none"
          placeholder="monsite.com"
          value={website}
          onChange={(e) => { setWebsite(e.target.value); clearError("website"); }}
          error={errors.website}
          hint="Facultatif, mais indispensable pour Google Ads."
        />
        <Field
          label="Téléphone"
          icon={<IconPhone size={20} stroke={2} />}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+33 6 12 34 56 78"
          value={phone}
          onChange={(e) => { setPhone(e.target.value); clearError("phone"); }}
          error={errors.phone}
          hint="Facultatif."
        />
      </div>

      <div className="rise pt-1" style={{ animationDelay: ".15s" }}>
        <SubmitButton state={state} className={mode === "settings" ? "sm:max-w-[260px] sm:ml-0" : ""}>
          {mode === "onboarding" ? "Accéder à mon espace" : "Enregistrer"}
        </SubmitButton>
      </div>
    </form>
  );
}
