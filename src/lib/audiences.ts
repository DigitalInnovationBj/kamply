export const AUDIENCES = {
  all: { label: "Tous les comptes", hint: "Comptes vérifiés et non suspendus" },
  live: { label: "Campagne en direct", hint: "Clients qui diffusent en ce moment" },
  none: { label: "Sans campagne", hint: "Inscrits qui n'ont encore rien lancé" },
  selected: { label: "Sélection", hint: "Choisissez un ou plusieurs comptes" },
} as const;
export type Audience = keyof typeof AUDIENCES;

export const MAIL_VARIABLES = [
  { key: "{prenom}", label: "Prénom" },
  { key: "{nom}", label: "Nom complet" },
  { key: "{entreprise}", label: "Entreprise" },
  { key: "{email}", label: "E-mail" },
] as const;
