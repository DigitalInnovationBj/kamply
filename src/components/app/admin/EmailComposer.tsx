"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { IconLink, IconMail, IconSearch, IconSend, IconUser, IconUsers, IconUsersGroup, IconX, IconBroadcast, IconUserPlus, IconHeading, IconClick } from "@tabler/icons-react";
import { Field } from "@/components/app/form/Field";
import { SubmitButton, pulseState, type SubmitState } from "@/components/app/form/SubmitButton";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { countRecipients, sendAdminEmail } from "@/app/actions/admin-users";
import { AUDIENCES, MAIL_VARIABLES, type Audience } from "@/lib/audiences";
import { cn } from "@/lib/utils";

type Person = { id: string; name: string; email: string; companyName: string | null };

const ICONS = { all: IconUsersGroup, live: IconBroadcast, none: IconUserPlus, selected: IconUsers } as const;

function fill(text: string, p?: Person) {
  const u = p ?? { name: "Claire Martin", email: "claire@maisonlune.fr", companyName: "Maison Lune" };
  return text
    .replaceAll("{prenom}", u.name.split(" ")[0])
    .replaceAll("{nom}", u.name)
    .replaceAll("{entreprise}", u.companyName || u.name)
    .replaceAll("{email}", u.email);
}

export function EmailComposer({ people, preselected }: { people: Person[]; preselected: string[] }) {
  const router = useRouter();
  const [audience, setAudience] = useState<Audience>(preselected.length ? "selected" : "all");
  const [ids, setIds] = useState<string[]>(preselected);
  const [count, setCount] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [state, setState] = useState<SubmitState>("idle");
  const [confirm, setConfirm] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const lastField = useRef<"subject" | "title" | "body">("body");

  useEffect(() => {
    let live = true;
    countRecipients(audience, ids)
      .then((n) => live && setCount(n))
      .catch(() => live && setCount(null));
    return () => {
      live = false;
    };
  }, [audience, ids]);

  const chosen = people.filter((p) => ids.includes(p.id));
  const matches = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return [];
    return people.filter((p) => !ids.includes(p.id) && [p.name, p.email, p.companyName ?? ""].some((x) => x.toLowerCase().includes(s))).slice(0, 6);
  }, [search, people, ids]);

  const sample = audience === "selected" ? chosen[0] : undefined;
  const clear = (k: string) => setErrors((e) => ({ ...e, [k]: undefined }));

  const insertVar = (v: string) => {
    const target = lastField.current;
    if (target === "body" && bodyRef.current) {
      const el = bodyRef.current;
      const s = el.selectionStart ?? body.length;
      const e = el.selectionEnd ?? body.length;
      const next = body.slice(0, s) + v + body.slice(e);
      setBody(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(s + v.length, s + v.length);
      });
    } else if (target === "subject") setSubject((x) => x + v);
    else setTitle((x) => x + v);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (subject.trim().length < 3) e.subject = "Objet trop court.";
    if (body.trim().length < 10) e.body = "Message trop court (10 caractères minimum).";
    if (ctaLabel && !/^https:\/\/\S+\.\S+/.test(ctaUrl)) e.ctaUrl = "Lien du bouton invalide (https://…).";
    if (ctaUrl && !ctaLabel) e.ctaLabel = "Donnez un texte au bouton.";
    if (audience === "selected" && !ids.length) e.recipients = "Ajoutez au moins un destinataire.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const send = async () => {
    setState("loading");
    const r = await sendAdminEmail({ audience, userIds: ids, subject, title, body, ctaLabel, ctaUrl });
    if (!r.ok) {
      setErrors(r.fields ?? {});
      toast.error(r.error);
      await pulseState(setState, "error");
      return false;
    }
    await pulseState(setState, "success", 1400);
    toast.success(`${r.data?.sent} e-mail${(r.data?.sent ?? 0) > 1 ? "s" : ""} envoyé${(r.data?.sent ?? 0) > 1 ? "s" : ""}${r.data?.failed ? `, ${r.data.failed} en échec` : ""}.`);
    setSubject("");
    setTitle("");
    setBody("");
    setCtaLabel("");
    setCtaUrl("");
    router.refresh();
    return true;
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="grid min-w-0 content-start gap-4">
        {/* Destinataires */}
        <section className="rounded-[24px] bg-card p-5 sm:p-6" aria-label="Destinataires">
          <h2 className="mb-4 text-lg font-black tracking-[-0.02em]">Destinataires</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Public">
            {(Object.keys(AUDIENCES) as Audience[]).map((a) => {
              const I = ICONS[a];
              const on = audience === a;
              return (
                <button
                  key={a}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => {
                    setAudience(a);
                    clear("recipients");
                  }}
                  className={cn("grid gap-2 rounded-2xl p-3.5 text-left transition-all duration-300", on ? "bg-black text-[#f5f5f3]" : "bg-muted hover:bg-[#dcdcd6]")}
                >
                  <I size={20} className={on ? "text-primary" : ""} />
                  <span className="text-sm font-bold leading-tight">{AUDIENCES[a].label}</span>
                  <span className={cn("text-[12px] leading-snug", on ? "text-[#a3a3a0]" : "text-muted-foreground")}>{AUDIENCES[a].hint}</span>
                </button>
              );
            })}
          </div>

          {audience === "selected" && (
            <div className="mt-4 grid gap-2">
              {chosen.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {chosen.map((p) => (
                    <span key={p.id} className="inline-flex h-9 max-w-full items-center gap-1.5 rounded-full bg-black pl-3 pr-1.5 text-[13px] font-bold text-[#f5f5f3]">
                      <span className="truncate">{p.name}</span>
                      <button type="button" onClick={() => setIds((x) => x.filter((i) => i !== p.id))} className="grid size-6 flex-none place-items-center rounded-full hover:bg-white/20" aria-label={`Retirer ${p.name}`}>
                        <IconX size={13} stroke={3} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="relative">
                <label className="kf-box !h-12">
                  <span className="kf-icon" aria-hidden="true">
                    <IconSearch size={18} />
                  </span>
                  <input className="kf-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ajouter un destinataire : nom, e-mail…" aria-label="Rechercher un destinataire" />
                </label>
                {matches.length > 0 && (
                  <ul className="absolute inset-x-0 top-[calc(100%+6px)] z-20 grid gap-0.5 rounded-2xl bg-white p-1.5 shadow-[0_24px_48px_-20px_rgba(0,0,0,.35)]">
                    {matches.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setIds((x) => [...x, p.id]);
                            setSearch("");
                            clear("recipients");
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-muted"
                        >
                          <IconUser size={16} className="flex-none text-muted-foreground" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold">{p.name}</span>
                            <span className="block truncate text-[12px] text-muted-foreground">{p.email}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {errors.recipients && (
                <p className="kf-msg" data-tone="error" role="alert">
                  {errors.recipients}
                </p>
              )}
            </div>
          )}
          <p className="mt-4 flex items-center gap-2 text-sm">
            <IconMail size={16} className="text-muted-foreground" />
            <span>
              <strong className="tabular-nums">{count ?? "…"}</strong> destinataire{count === 1 ? "" : "s"}
              <span className="text-muted-foreground"> · comptes suspendus et non vérifiés exclus</span>
            </span>
          </p>
        </section>

        {/* Message */}
        <section className="rounded-[24px] bg-card p-5 sm:p-6" aria-label="Message">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-black tracking-[-0.02em]">Message</h2>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[12px] font-semibold text-muted-foreground">Insérer :</span>
              {MAIL_VARIABLES.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertVar(v.key)}
                  className="h-8 rounded-full bg-[#18cccd]/20 px-3 text-[12.5px] font-bold text-[#08787a] transition-colors hover:bg-[#18cccd]/40"
                  title={`Remplacé par : ${v.label}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-5">
            <Field
              label="Objet"
              icon={<IconMail size={18} />}
              placeholder="{prenom}, votre campagne a un nouveau record"
              maxLength={120}
              value={subject}
              onFocus={() => (lastField.current = "subject")}
              onChange={(e) => {
                setSubject(e.target.value);
                clear("subject");
              }}
              error={errors.subject}
            />
            <Field
              label="Titre dans l'e-mail (facultatif)"
              icon={<IconHeading size={18} />}
              placeholder="Bonne nouvelle, {prenom}."
              maxLength={120}
              value={title}
              onFocus={() => (lastField.current = "title")}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="kf" data-invalid={!!errors.body}>
              <div className="flex items-baseline justify-between">
                <label htmlFor="mail-body" className="kf-label">
                  Message
                </label>
                <span className="text-xs font-bold tabular-nums text-muted-foreground">{body.length}/5000</span>
              </div>
              <div className="kf-box !h-auto">
                <textarea
                  id="mail-body"
                  ref={bodyRef}
                  className="kf-input min-h-[200px] resize-y py-3.5 pl-4 leading-relaxed"
                  maxLength={5000}
                  placeholder={"Bonjour {prenom},\n\nVotre campagne pour {entreprise} a dépassé les 1 000 clics ce mois-ci.\n\nL'équipe KAMPLY"}
                  value={body}
                  onFocus={() => (lastField.current = "body")}
                  onChange={(e) => {
                    setBody(e.target.value);
                    clear("body");
                  }}
                />
              </div>
              {errors.body ? (
                <p className="kf-msg" data-tone="error" role="alert">
                  {errors.body}
                </p>
              ) : (
                <p className="kf-msg">Une ligne vide sépare deux paragraphes.</p>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
              <Field
                label="Bouton (facultatif)"
                icon={<IconClick size={18} />}
                placeholder="Voir mes résultats"
                maxLength={40}
                value={ctaLabel}
                onChange={(e) => {
                  setCtaLabel(e.target.value);
                  clear("ctaLabel");
                }}
                error={errors.ctaLabel}
              />
              <Field
                label="Lien du bouton"
                icon={<IconLink size={18} />}
                inputMode="url"
                autoCapitalize="none"
                placeholder="https://kamply.com/app"
                value={ctaUrl}
                onChange={(e) => {
                  setCtaUrl(e.target.value);
                  clear("ctaUrl");
                }}
                error={errors.ctaUrl}
              />
            </div>
          </div>
          <div className="mt-6">
            <SubmitButton
              type="button"
              state={state}
              onClick={() => {
                if (validate()) setConfirm(true);
                else void pulseState(setState, "error");
              }}
              className="sm:mx-0 sm:max-w-[300px]"
            >
              <IconSend size={18} /> Envoyer
            </SubmitButton>
          </div>
        </section>
      </div>

      {/* Aperçu */}
      <aside className="min-w-0">
        <div className="sticky top-24 grid gap-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Aperçu{sample ? ` pour ${sample.name}` : " (exemple)"}</span>
          <div className="rounded-[24px] bg-[#ebebe7] p-3 sm:p-4">
            <div className="mb-3 grid gap-0.5 px-1 text-[12.5px]">
              <span className="truncate">
                <span className="text-muted-foreground">De :</span> <strong>KAMPLY</strong>
              </span>
              <span className="truncate">
                <span className="text-muted-foreground">Objet :</span> <strong>{fill(subject, sample) || "Votre objet"}</strong>
              </span>
            </div>
            <div className="rounded-[20px] bg-white px-6 py-7 text-[#0a0a0a]">
              <div className="text-[22px] font-black tracking-[-0.02em]">
                KAMPLY<span className="text-primary">.</span>
              </div>
              <div className="mt-6">
                {title && <p className="mb-3 text-[22px] font-black leading-tight tracking-[-0.03em]">{fill(title, sample)}</p>}
                {(body || "Votre message apparaît ici.")
                  .split(/\n{2,}/)
                  .filter(Boolean)
                  .map((p, i) => (
                    <p key={i} className={cn("mb-4 whitespace-pre-line text-[14px] leading-[22px]", body ? "text-[#3a3a37]" : "text-[#a3a3a0]")}>
                      {fill(p, sample)}
                    </p>
                  ))}
                {ctaLabel && <span className="inline-block rounded-full bg-primary px-6 py-3 text-[14px] font-extrabold text-black">{ctaLabel}</span>}
              </div>
              <div className="mt-7 border-t border-[#ebebe7] pt-4 text-[11px] leading-[16px] text-[#8a8a84]">Message envoyé par l&apos;équipe KAMPLY. Vous pouvez y répondre directement.</div>
            </div>
          </div>
        </div>
      </aside>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={count === 1 ? "Envoyer cet e-mail ?" : `Envoyer à ${count ?? "…"} personnes ?`}
        description={
          <>
            « <strong className="text-foreground">{subject}</strong> » part immédiatement
            {audience === "selected" ? (chosen.length === 1 ? ` à ${chosen[0].name}` : ` aux ${chosen.length} comptes sélectionnés`) : ` : ${AUDIENCES[audience].label.toLowerCase()}`}. Un envoi ne peut pas être annulé.
          </>
        }
        confirmLabel="Envoyer maintenant"
        onConfirm={send}
      />
    </div>
  );
}
