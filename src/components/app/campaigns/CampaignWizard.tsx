"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { toast } from "sonner";
import {
  IconArrowLeft,
  IconBrandFacebook,
  IconBrandGoogle,
  IconBrandInstagram,
  IconCheck,
  IconEye,
  IconHash,
  IconLink,
  IconLoader2,
  IconMapPin,
  IconPhotoUp,
  IconSpeakerphone,
  IconTrash,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { Field } from "@/components/app/form/Field";
import { SubmitButton, pulseState, type SubmitState } from "@/components/app/form/SubmitButton";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { AdPreview } from "./AdPreview";
import { uploadToCloudinary, type UploadedImage } from "@/components/app/AvatarUploader";
import { createCampaign } from "@/app/actions/campaigns";
import { OBJECTIVES, type ChannelKey } from "@/lib/campaigns";
import { PLANS, formatEuros, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

const STEPS = ["Canal", "Objectif", "Zone", "Annonce", "Formule", "Récapitulatif"] as const;

type Props = { company: string; website?: string | null; balance: number };

export function CampaignWizard({ company, website, balance }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [channel, setChannel] = useState<ChannelKey | null>(null);
  const [objective, setObjective] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState(20);
  const [national, setNational] = useState(false);
  const [audience, setAudience] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [kw, setKw] = useState("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [landingUrl, setLandingUrl] = useState(website ?? "");
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const [plan, setPlan] = useState<PlanId>("BASIC");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [state, setState] = useState<SubmitState>("idle");
  const [showPreview, setShowPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const price = PLANS.find((p) => p.id === plan)!.price;
  const canPay = balance >= price;
  const clear = (k: string) => setErrors((e) => ({ ...e, [k]: undefined }));

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 0 && !channel) e.channel = "Choisissez Google Ads ou Meta Ads.";
    if (s === 1) {
      if (!objective) e.objective = "Choisissez un objectif.";
      if (name.trim().length < 3) e.name = "Donnez un nom à votre campagne (3 caractères minimum).";
    }
    if (s === 2) {
      if (!national && location.trim().length < 2) e.location = "Indiquez une ville ou une région.";
      if (channel === "GOOGLE" && keywords.length < 3) e.keywords = "Ajoutez au moins 3 mots-clés.";
    }
    if (s === 3) {
      if (headline.trim().length < 10) e.headline = "Le titre doit faire au moins 10 caractères.";
      if (description.trim().length < 20) e.description = "La description doit faire au moins 20 caractères.";
      if (!/^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/i.test(landingUrl.trim())) e.landingUrl = "Adresse invalide (ex. monsite.com/offre).";
      if (channel === "META" && !image) e.image = "Un visuel est obligatoire pour Meta Ads.";
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const go = (to: number) => {
    if (to > step && !validate(step)) {
      toast.error("Complétez cette étape pour continuer.");
      return;
    }
    setStep(to);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const addKeyword = () => {
    const v = kw.trim().replace(/,$/, "");
    if (v.length < 2 || keywords.includes(v.toLowerCase()) || keywords.length >= 30) return setKw("");
    setKeywords((k) => [...k, v.toLowerCase()]);
    setKw("");
    clear("keywords");
  };
  const onKwKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeyword();
    } else if (e.key === "Backspace" && !kw && keywords.length) setKeywords((k) => k.slice(0, -1));
  };

  const pickImage = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setErrors((e) => ({ ...e, image: "Choisissez une image (JPG, PNG ou WebP)." }));
    if (file.size > 8 * 1024 * 1024) return setErrors((e) => ({ ...e, image: "Image trop lourde : 8 Mo maximum." }));
    clear("image");
    setUploading(0);
    try {
      setImage(await uploadToCloudinary(file, "ads", setUploading));
    } catch (err) {
      setErrors((e) => ({ ...e, image: (err as Error).message }));
    } finally {
      setUploading(null);
    }
  };

  const submit = async () => {
    setState("loading");
    const res = await createCampaign({
      name,
      channel: channel!,
      objective,
      location: national ? "National" : location,
      radiusKm: national ? undefined : radius,
      audience: channel === "META" ? audience : undefined,
      keywords: channel === "GOOGLE" ? keywords : [],
      headline,
      description,
      landingUrl,
      plan,
      image,
    });
    if (!res.ok) {
      setErrors(res.fields ?? {});
      toast.error(res.error);
      await pulseState(setState, "error");
      return false;
    }
    await pulseState(setState, "success", 1300);
    if (res.data?.launched) {
      toast.success("Campagne envoyée en validation. Diffusion sous 24 h.");
      router.replace(`/app/campagnes/${res.data.id}`);
    } else {
      toast.message("Campagne enregistrée en brouillon", { description: `Rechargez ${formatEuros(res.data?.missing ?? 0, { decimals: true })} pour la lancer.` });
      router.replace(`/app/portefeuille?campagne=${res.data?.id}`);
    }
    return true;
  };

  const preview = <AdPreview channel={channel ?? "META"} company={company} headline={headline} description={description} landingUrl={landingUrl} imageUrl={image?.url} />;

  return (
    <div ref={topRef} className="scroll-mt-24">
      {/* Progression */}
      <div className="rise mb-6">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
          <span>
            Étape {step + 1} sur {STEPS.length} · <span className="text-foreground">{STEPS[step]}</span>
          </span>
          <span className="tabular-nums">{Math.round(((step + 1) / STEPS.length) * 100)} %</span>
        </div>
        <ol className="mt-3 grid grid-cols-6 gap-1.5" aria-label="Étapes">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => i < step && go(i)}
                disabled={i >= step}
                aria-current={i === step ? "step" : undefined}
                aria-label={`${s}${i < step ? " (terminée, revenir)" : ""}`}
                className="block h-2 w-full overflow-hidden rounded-full bg-[#dcdcd6] disabled:cursor-default"
              >
                <span className="block h-full rounded-full bg-primary transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)]" style={{ transform: `scaleX(${i <= step ? 1 : 0})`, transformOrigin: "0 50%" }} />
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div key={step} className="rise min-w-0 rounded-[24px] bg-card p-5 sm:p-7">
          {step === 0 && (
            <Step title="Où voulez-vous être vu ?" text="Une campagne vit sur un seul canal. Vous pourrez en lancer une autre ensuite.">
              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Canal">
                {(
                  [
                    { id: "GOOGLE", title: "Google Ads", text: "Soyez trouvé par ceux qui cherchent déjà ce que vous vendez.", icons: [IconBrandGoogle] },
                    { id: "META", title: "Meta Ads", text: "Faites-vous découvrir sur Facebook et Instagram.", icons: [IconBrandFacebook, IconBrandInstagram] },
                  ] as const
                ).map((c) => (
                  <Choice
                    key={c.id}
                    selected={channel === c.id}
                    onClick={() => {
                      setChannel(c.id);
                      setObjective("");
                      clear("channel");
                    }}
                  >
                    <span className="flex gap-2">
                      {c.icons.map((I, k) => (
                        <span key={k} className={cn("grid size-11 place-items-center rounded-full", channel === c.id ? "bg-primary text-black" : "bg-black text-[#f5f5f3]")}>
                          <I size={22} stroke={2} />
                        </span>
                      ))}
                    </span>
                    <span className="mt-4 block font-display text-[34px] uppercase leading-[0.85]">{c.title}</span>
                    <span className={cn("mt-2 block text-sm leading-relaxed", channel === c.id ? "text-[#a3a3a0]" : "text-muted-foreground")}>{c.text}</span>
                  </Choice>
                ))}
              </div>
              <Err msg={errors.channel} />
            </Step>
          )}

          {step === 1 && channel && (
            <Step title="Quel est votre objectif ?" text="Il oriente le ciblage et la façon dont les résultats sont mesurés.">
              <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Objectif">
                {OBJECTIVES[channel].map((o) => (
                  <button
                    key={o}
                    type="button"
                    role="radio"
                    aria-checked={objective === o}
                    onClick={() => {
                      setObjective(o);
                      clear("objective");
                      if (!name) setName(`${o} · ${company}`.slice(0, 60));
                    }}
                    className={cn(
                      "flex min-h-14 items-center gap-3 rounded-2xl px-4 text-left text-[15px] font-bold transition-all duration-300",
                      objective === o ? "bg-black text-[#f5f5f3]" : "bg-muted text-foreground hover:bg-[#dcdcd6]",
                    )}
                  >
                    <span className={cn("grid size-6 flex-none place-items-center rounded-full", objective === o ? "bg-primary text-black" : "bg-white")}>
                      {objective === o && <IconCheck size={14} stroke={3} />}
                    </span>
                    {o}
                  </button>
                ))}
              </div>
              <Err msg={errors.objective} />
              <Field
                className="mt-6"
                label="Nom de la campagne"
                icon={<IconSpeakerphone size={20} stroke={2} />}
                placeholder="Bouquets de la fête des mères"
                maxLength={60}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clear("name");
                }}
                error={errors.name}
                hint="Visible par vous seulement."
              />
            </Step>
          )}

          {step === 2 && (
            <Step title="Qui doit voir votre annonce ?" text="Plus la zone est précise, plus le budget est efficace.">
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-muted px-4 py-3.5">
                <span>
                  <span className="block text-[15px] font-bold">Diffuser dans tout le pays</span>
                  <span className="block text-[13px] text-muted-foreground">Idéal pour la vente en ligne avec livraison.</span>
                </span>
                <Switch checked={national} onChange={setNational} label="Diffuser dans tout le pays" />
              </label>
              {!national && (
                <div className="mt-5 grid gap-5">
                  <Field
                    label="Ville ou région"
                    icon={<IconMapPin size={20} stroke={2} />}
                    placeholder="Lyon"
                    autoComplete="address-level2"
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      clear("location");
                    }}
                    error={errors.location}
                  />
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <span className="kf-label">Rayon autour</span>
                      <span className="rounded-full bg-black px-3 py-1 text-sm font-bold tabular-nums text-[#f5f5f3]">{radius} km</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={100}
                      step={5}
                      value={radius}
                      onChange={(e) => setRadius(Number(e.target.value))}
                      className="h-2 w-full cursor-pointer accent-[#ff5b23]"
                      aria-label="Rayon autour de la ville, en kilomètres"
                    />
                    <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                      <span>5 km</span>
                      <span>100 km</span>
                    </div>
                  </div>
                </div>
              )}

              {channel === "GOOGLE" ? (
                <div className="mt-6 grid gap-2" data-invalid={!!errors.keywords}>
                  <label htmlFor="kw" className="kf-label">
                    Mots-clés recherchés par vos clients
                  </label>
                  <div className="kf-box flex-wrap gap-1.5 !h-auto min-h-14 py-2 pl-12 pr-2 relative">
                    <span className="kf-icon absolute left-0 top-0 h-14" aria-hidden="true">
                      <IconHash size={20} stroke={2} />
                    </span>
                    {keywords.map((k) => (
                      <span key={k} className="inline-flex h-8 items-center gap-1 rounded-full bg-black pl-3 pr-1.5 text-[13px] font-bold text-[#f5f5f3]">
                        {k}
                        <button type="button" onClick={() => setKeywords((all) => all.filter((x) => x !== k))} aria-label={`Retirer ${k}`} className="grid size-5 place-items-center rounded-full hover:bg-white/20">
                          <IconX size={12} stroke={3} />
                        </button>
                      </span>
                    ))}
                    <input
                      id="kw"
                      value={kw}
                      onChange={(e) => setKw(e.target.value)}
                      onKeyDown={onKwKey}
                      onBlur={addKeyword}
                      enterKeyHint="enter"
                      placeholder={keywords.length ? "Ajouter…" : "fleuriste lyon, bouquet livraison…"}
                      className="h-10 min-w-[140px] flex-1 bg-transparent px-1 text-[15px] font-medium outline-none placeholder:text-[#a3a3a0]"
                    />
                  </div>
                  {errors.keywords ? <Err msg={errors.keywords} /> : <p className="kf-msg">Validez chaque mot-clé avec Entrée. {keywords.length}/30.</p>}
                </div>
              ) : (
                <Field
                  className="mt-6"
                  label="Centres d'intérêt de votre clientèle"
                  icon={<IconUsers size={20} stroke={2} />}
                  placeholder="décoration, mariage, cadeaux…"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  hint="Facultatif : sans précision, l'IA de Meta trouve elle-même votre public."
                />
              )}
            </Step>
          )}

          {step === 3 && (
            <Step title="Rédigez votre annonce" text="Un titre court et un bénéfice clair. L'aperçu se met à jour pendant la saisie.">
              <div className="grid gap-5">
                <Counted label="Titre" value={headline} max={60} error={errors.headline}>
                  <input
                    className="kf-input pl-4"
                    value={headline}
                    maxLength={60}
                    placeholder="Fleuriste à Lyon, livraison en 3 h"
                    onChange={(e) => {
                      setHeadline(e.target.value);
                      clear("headline");
                    }}
                  />
                </Counted>
                <Counted label="Description" value={description} max={160} error={errors.description} multiline>
                  <textarea
                    className="kf-input min-h-[104px] resize-none py-3.5 pl-4 leading-relaxed"
                    value={description}
                    maxLength={160}
                    placeholder="Bouquets frais composés à la main. Commandez avant 16 h, livré aujourd'hui."
                    onChange={(e) => {
                      setDescription(e.target.value);
                      clear("description");
                    }}
                  />
                </Counted>
                <Field
                  label="Page de destination"
                  icon={<IconLink size={20} stroke={2} />}
                  inputMode="url"
                  autoCapitalize="none"
                  placeholder="monsite.com/bouquets"
                  value={landingUrl}
                  onChange={(e) => {
                    setLandingUrl(e.target.value);
                    clear("landingUrl");
                  }}
                  error={errors.landingUrl}
                  hint="Là où arrivent les personnes qui cliquent."
                />

                <div className="grid gap-2">
                  <span className="kf-label">
                    Visuel {channel === "META" ? <span className="text-destructive">*</span> : <span className="font-medium text-muted-foreground">(facultatif)</span>}
                  </span>
                  {image ? (
                    <div className="flex items-center gap-4 rounded-2xl bg-muted p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element -- miniature Cloudinary */}
                      <img src={image.url.replace("/image/upload/", "/image/upload/c_fill,w_160,h_160,f_auto,q_auto/")} alt="" className="size-16 rounded-xl object-cover" />
                      <span className="flex-1 text-sm font-semibold">Visuel ajouté</span>
                      <button type="button" onClick={() => setImage(null)} className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                        <IconTrash size={16} /> Retirer
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        void pickImage(e.dataTransfer.files?.[0]);
                      }}
                      disabled={uploading !== null}
                      className={cn(
                        "grid min-h-[132px] place-items-center rounded-2xl border-2 border-dashed px-4 text-center transition-colors",
                        errors.image ? "border-destructive bg-destructive/5" : "border-[#c4c4be] hover:border-foreground hover:bg-muted",
                      )}
                    >
                      {uploading !== null ? (
                        <span className="grid justify-items-center gap-2 text-sm font-bold">
                          <IconLoader2 className="animate-spin" /> Envoi… {Math.round(uploading * 100)} %
                        </span>
                      ) : (
                        <span className="grid justify-items-center gap-1.5">
                          <IconPhotoUp size={28} stroke={1.7} />
                          <span className="text-[15px] font-bold">Ajouter une image</span>
                          <span className="text-xs text-muted-foreground">Carrée de préférence, JPG ou PNG, 8 Mo max.</span>
                        </span>
                      )}
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => void pickImage(e.target.files?.[0])} />
                  <Err msg={errors.image} />
                </div>
              </div>
            </Step>
          )}

          {step === 4 && channel && (
            <Step title="Choisissez votre formule" text="Prix mensuel tout compris : budget publicitaire, création et optimisation.">
              <div className="grid gap-2.5" role="radiogroup" aria-label="Formule">
                {PLANS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={plan === p.id}
                    onClick={() => setPlan(p.id)}
                    className={cn(
                      "grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 rounded-2xl px-4 py-4 text-left transition-all duration-300 sm:px-5",
                      plan === p.id ? "bg-black text-[#f5f5f3]" : "bg-muted text-foreground hover:bg-[#dcdcd6]",
                    )}
                  >
                    <span className="font-display text-[30px] uppercase leading-[0.85]">{p.name}</span>
                    <span className="row-span-2 text-right">
                      <span className="block text-[22px] font-black tabular-nums tracking-[-0.03em]">{formatEuros(p.price)}</span>
                      <span className={cn("block text-[11px] font-bold uppercase tracking-[0.12em]", plan === p.id ? "text-[#a3a3a0]" : "text-muted-foreground")}>par mois</span>
                    </span>
                    <span className={cn("text-[13px]", plan === p.id ? "text-[#a3a3a0]" : "text-muted-foreground")}>
                      {channel === "GOOGLE" ? p.google : p.meta} · {p.feat}
                    </span>
                  </button>
                ))}
              </div>
              <div className={cn("mt-4 flex items-start gap-3 rounded-2xl px-4 py-3.5 text-sm", canPay ? "bg-[#18cccd]/20" : "bg-primary/15")}>
                <span className="font-bold tabular-nums">Solde : {formatEuros(balance, { decimals: true })}</span>
                <span className="text-muted-foreground">
                  {canPay ? "Votre solde couvre le premier mois." : `Il manque ${formatEuros(price - balance, { decimals: true })} : la campagne sera enregistrée en brouillon, à lancer après recharge.`}
                </span>
              </div>
            </Step>
          )}

          {step === 5 && channel && (
            <Step title="Tout est prêt ?" text="Vérifiez une dernière fois. Notre équipe valide l'annonce avant sa mise en ligne, sous 24 h.">
              <dl className="grid gap-px overflow-hidden rounded-2xl bg-border">
                {[
                  ["Canal", channel === "GOOGLE" ? "Google Ads" : "Meta Ads", 0],
                  ["Objectif", objective, 1],
                  ["Nom", name, 1],
                  ["Zone", national ? "Tout le pays" : `${location} · ${radius} km`, 2],
                  [channel === "GOOGLE" ? "Mots-clés" : "Centres d'intérêt", channel === "GOOGLE" ? keywords.join(", ") : audience || "Ciblage automatique", 2],
                  ["Titre", headline, 3],
                  ["Destination", landingUrl, 3],
                  ["Formule", `${PLANS.find((p) => p.id === plan)!.name} · ${formatEuros(price)} / mois`, 4],
                ].map(([k, v, s]) => (
                  <div key={String(k)} className="grid grid-cols-[110px_1fr_auto] items-center gap-3 bg-card px-4 py-3 sm:grid-cols-[140px_1fr_auto]">
                    <dt className="text-[13px] font-semibold text-muted-foreground">{k}</dt>
                    <dd className="m-0 min-w-0 break-words text-sm font-bold">{v}</dd>
                    <button type="button" onClick={() => go(Number(s))} className="text-[13px] font-bold text-muted-foreground underline underline-offset-4 hover:text-foreground">
                      Modifier
                    </button>
                  </div>
                ))}
              </dl>
            </Step>
          )}

          {/* Actions */}
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            {step > 0 ? (
              <button type="button" onClick={() => go(step - 1)} className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <IconArrowLeft size={18} stroke={2.4} /> Retour
              </button>
            ) : (
              <span />
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => go(step + 1)}
                className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-primary px-7 text-[16px] font-extrabold text-black transition-colors duration-300 hover:bg-black hover:text-[#f5f5f3]"
              >
                Continuer
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-500 ease-[cubic-bezier(.76,0,.24,1)] group-hover:-rotate-45" aria-hidden="true">
                  <path d="M5 12h14M13 18l6-6M13 6l6 6" />
                </svg>
              </button>
            ) : (
              <ConfirmDialog
                title={canPay ? "Lancer la campagne ?" : "Enregistrer en brouillon ?"}
                description={
                  canPay ? (
                    <>
                      <strong className="text-foreground">{formatEuros(price, { decimals: true })}</strong> seront débités de votre portefeuille pour le premier mois. L&apos;annonce part en validation et sera diffusée sous 24 h.
                    </>
                  ) : (
                    <>Votre solde ne couvre pas le premier mois. La campagne sera enregistrée en brouillon : vous pourrez la lancer après avoir rechargé votre portefeuille.</>
                  )
                }
                confirmLabel={canPay ? `Payer ${formatEuros(price)} et lancer` : "Enregistrer le brouillon"}
                onConfirm={submit}
                trigger={
                  <span className="block sm:w-auto">
                    <SubmitButton type="button" state={state} className="sm:w-[280px] sm:mx-0">
                      {canPay ? "Lancer la campagne" : "Enregistrer en brouillon"}
                    </SubmitButton>
                  </span>
                }
              />
            )}
          </div>
        </div>

        {/* Aperçu */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 grid gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Aperçu en direct</span>
            {preview}
          </div>
        </aside>
      </div>

      {/* Aperçu mobile */}
      {step >= 3 && (
        <>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="fixed bottom-[calc(96px+env(safe-area-inset-bottom))] right-4 z-30 inline-flex h-12 items-center gap-2 rounded-full bg-black px-4 text-sm font-bold text-[#f5f5f3] shadow-xl lg:hidden"
          >
            <IconEye size={18} /> Aperçu
          </button>
          {showPreview && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5 backdrop-blur-sm lg:hidden" role="dialog" aria-modal="true" aria-label="Aperçu de l'annonce" onClick={() => setShowPreview(false)}>
              <div className="rise w-full max-w-[360px]" onClick={(e) => e.stopPropagation()}>
                {preview}
                <button type="button" onClick={() => setShowPreview(false)} className="mx-auto mt-4 flex h-12 items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-black">
                  <IconX size={18} /> Fermer
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Step({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-[24px] font-black leading-tight tracking-[-0.03em] sm:text-[28px]">{title}</h2>
      <p className="mb-6 mt-2 text-[15px] leading-relaxed text-muted-foreground">{text}</p>
      {children}
    </div>
  );
}

function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "relative rounded-[22px] p-5 text-left transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)]",
        selected ? "-translate-y-1 bg-black text-[#f5f5f3]" : "bg-muted text-foreground hover:-translate-y-1 hover:bg-[#dcdcd6]",
      )}
    >
      {selected && (
        <span className="absolute right-4 top-4 grid size-7 place-items-center rounded-full bg-primary text-black" aria-hidden="true">
          <IconCheck size={16} stroke={3} />
        </span>
      )}
      {children}
    </button>
  );
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.preventDefault();
        onChange(!checked);
      }}
      className={cn("relative h-8 w-14 flex-none rounded-full transition-colors duration-300", checked ? "bg-primary" : "bg-[#c4c4be]")}
    >
      <span className={cn("absolute top-1 size-6 rounded-full bg-white shadow transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)]", checked ? "translate-x-7" : "translate-x-1")} />
    </button>
  );
}

function Counted({ label, value, max, error, multiline, children }: { label: string; value: string; max: number; error?: string; multiline?: boolean; children: ReactNode }) {
  const left = max - value.length;
  return (
    <div className="kf" data-invalid={!!error}>
      <div className="flex items-baseline justify-between">
        <span className="kf-label">{label}</span>
        <span className={cn("text-xs font-bold tabular-nums", left < 10 ? "text-primary" : "text-muted-foreground")}>
          {value.length}/{max}
        </span>
      </div>
      <div className={cn("kf-box", multiline && "!h-auto")}>{children}</div>
      <Err msg={error} />
    </div>
  );
}

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="kf-msg mt-2" data-tone="error" role="alert" key={msg}>
      {msg}
    </p>
  );
}
