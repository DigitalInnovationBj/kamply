"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconCoins, IconHome, IconPlus, IconSettings, IconSpeakerphone } from "@tabler/icons-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserAvatar } from "./UserAvatar";
import { isActive, type ShellUser } from "./AppSidebar";

const ITEMS = [
  { href: "/app", label: "Accueil", icon: IconHome, exact: true },
  { href: "/app/campagnes", label: "Campagnes", icon: IconSpeakerphone },
  { href: "/app/campagnes/nouvelle", label: "Créer", icon: IconPlus, primary: true, exact: true },
  { href: "/app/portefeuille", label: "Solde", icon: IconCoins },
  { href: "/app/parametres", label: "Profil", icon: IconSettings },
];

/** En-tête de l'espace : bouton de barre latérale (desktop) ou logo + avatar (mobile). */
export function AppTopbar({ user }: { user: ShellUser }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/70 bg-background/85 px-4 backdrop-blur-md sm:px-6">
      <SidebarTrigger className="-ml-1 hidden size-10 rounded-xl md:inline-flex" />
      <Link href="/app" className="font-display text-[26px] leading-none text-foreground no-underline md:hidden" aria-label="KAMPLY, accueil">
        KAMPLY
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <Link href="/app/parametres" className="rounded-full md:hidden" aria-label="Mon profil">
          <UserAvatar name={user.name} image={user.image} size={36} />
        </Link>
        <SidebarTrigger className="size-10 rounded-xl md:hidden" aria-label="Ouvrir le menu" />
      </div>
    </header>
  );
}

/** Barre de navigation en bas d'écran, pour le pouce, sur mobile. */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav md:hidden" aria-label="Navigation principale">
      {ITEMS.map((it) => {
        const active = it.primary ? pathname === it.href : isActive(pathname, it.href, it.exact) && pathname !== "/app/campagnes/nouvelle";
        return (
          <Link key={it.href} href={it.href} data-active={active} aria-current={active ? "page" : undefined}>
            <it.icon size={22} stroke={active ? 2.4 : 2} />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
