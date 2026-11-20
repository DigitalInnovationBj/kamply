import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IconAlertTriangle, IconDevices, IconLock, IconUserCircle } from "@tabler/icons-react";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/app/PageHeader";
import { ProfileForm } from "@/components/app/ProfileForm";
import { SignOutButton } from "@/components/app/SignOut";
import { ChangePassword, DeleteAccount, Sessions } from "@/components/app/settings/Security";

export const metadata: Metadata = { title: "Paramètres" };

function Card({ icon, title, text, children, danger }: { icon: ReactNode; title: string; text: string; children: ReactNode; danger?: boolean }) {
  return (
    <section className={`rise grid gap-6 rounded-[24px] bg-card p-5 sm:p-7 lg:grid-cols-[260px_minmax(0,1fr)] ${danger ? "shadow-[inset_0_0_0_1.5px_rgba(217,45,32,.35)]" : ""}`}>
      <div>
        <span className={`grid size-11 place-items-center rounded-2xl ${danger ? "bg-destructive/12 text-destructive" : "bg-black text-primary"}`} aria-hidden="true">
          {icon}
        </span>
        <h2 className="mt-4 text-lg font-black tracking-[-0.02em]">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const session = await requireUser();
  const { user } = session;
  return (
    <>
      <PageHeader
        eyebrow="Paramètres"
        title="Votre compte"
        description={user.email}
        actions={<SignOutButton name={user.name} className="inline-flex h-12 items-center gap-2 self-start rounded-full bg-card px-5 text-[15px] font-bold shadow-[inset_0_0_0_1.5px_var(--border)] transition-colors hover:bg-black hover:text-[#f5f5f3]" />}
      />
      <div className="grid gap-4">
        <Card icon={<IconUserCircle size={22} />} title="Profil" text="Ces informations servent à préparer vos annonces.">
          <ProfileForm mode="settings" initial={user} />
        </Card>
        <Card icon={<IconLock size={22} />} title="Mot de passe" text="Changer de mot de passe déconnecte vos autres appareils.">
          <ChangePassword />
        </Card>
        <Card icon={<IconDevices size={22} />} title="Appareils connectés" text="Déconnectez un appareil que vous ne reconnaissez pas.">
          <Sessions currentToken={session.session.token} />
        </Card>
        <Card danger icon={<IconAlertTriangle size={22} />} title="Zone sensible" text="La suppression du compte est définitive.">
          <DeleteAccount />
        </Card>
      </div>
    </>
  );
}
