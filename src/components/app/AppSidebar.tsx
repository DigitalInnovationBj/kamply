"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  IconChartDots3,
  IconChevronUp,
  IconCoins,
  IconHome,
  IconLogout,
  IconPlus,
  IconSettings,
  IconShieldLock,
  IconSpeakerphone,
  IconUsers,
  IconMail,
  IconCash,
  IconExternalLink,
} from "@tabler/icons-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserAvatar } from "./UserAvatar";
import { SignOutDialog } from "./SignOut";

export type ShellUser = { name: string; email: string; image?: string | null; role?: string | null; companyName?: string | null };

export const NAV = [
  { href: "/app", label: "Accueil", icon: IconHome, exact: true },
  { href: "/app/campagnes", label: "Campagnes", icon: IconSpeakerphone },
  { href: "/app/portefeuille", label: "Portefeuille", icon: IconCoins },
  { href: "/app/parametres", label: "Paramètres", icon: IconSettings },
];

const ADMIN = [
  { href: "/app/admin", label: "Vue d'ensemble", icon: IconChartDots3, exact: true },
  { href: "/app/admin/campagnes", label: "Campagnes", icon: IconSpeakerphone },
  { href: "/app/admin/recharges", label: "Recharges", icon: IconCash },
  { href: "/app/admin/utilisateurs", label: "Utilisateurs", icon: IconUsers },
  { href: "/app/admin/emails", label: "E-mails", icon: IconMail },
];

export function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

export function AppSidebar({ user, badges }: { user: ShellUser; badges?: { pendingCampaigns?: number; pendingTopups?: number } }) {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();
  const close = () => isMobile && setOpenMobile(false);

  const [leaving, setLeaving] = useState(false);

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="px-3 pt-4">
        <Link href="/app" onClick={close} className="flex h-10 items-center gap-2 px-1.5 text-sidebar-foreground no-underline" aria-label="KAMPLY, accueil">
          <span className="grid size-8 flex-none place-items-center rounded-lg bg-primary font-display text-[20px] leading-none text-black">K</span>
          <span className="font-display text-[26px] leading-none group-data-[collapsible=icon]:hidden">KAMPLY</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-1 pt-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Nouvelle campagne"
                  className="h-11 bg-primary font-bold text-black hover:bg-[#f5f5f3] hover:text-black active:bg-[#f5f5f3] active:text-black data-[active=true]:bg-[#f5f5f3] data-[active=true]:text-black"
                  isActive={pathname === "/app/campagnes/nouvelle"}
                >
                  <Link href="/app/campagnes/nouvelle" onClick={close}>
                    <IconPlus stroke={2.4} />
                    <span>Nouvelle campagne</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5c5c58]">Mon espace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    isActive={isActive(pathname, item.href, item.exact) && pathname !== "/app/campagnes/nouvelle"}
                    className="h-11 font-semibold text-[#a3a3a0] hover:text-[#f5f5f3] data-[active=true]:bg-[#1a1a1a] data-[active=true]:text-[#f5f5f3]"
                  >
                    <Link href={item.href} onClick={close}>
                      <item.icon stroke={2} />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user.role === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5c5c58]">
              <IconShieldLock size={14} className="mr-1.5" /> Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {ADMIN.map((item) => {
                  const badge = item.href.endsWith("campagnes") ? badges?.pendingCampaigns : item.href.endsWith("recharges") ? badges?.pendingTopups : 0;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.label}
                        isActive={isActive(pathname, item.href, item.exact)}
                        className="h-11 font-semibold text-[#a3a3a0] hover:text-[#f5f5f3] data-[active=true]:bg-[#1a1a1a] data-[active=true]:text-[#f5f5f3]"
                      >
                        <Link href={item.href} onClick={close}>
                          <item.icon stroke={2} />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                      {!!badge && <SidebarMenuBadge className="rounded-full bg-primary font-bold text-black">{badge}</SidebarMenuBadge>}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2 pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="h-14 rounded-2xl hover:bg-[#1a1a1a] data-[state=open]:bg-[#1a1a1a]">
                  <UserAvatar name={user.name} image={user.image} size={36} />
                  <span className="grid min-w-0 flex-1 text-left leading-tight">
                    <span className="truncate text-sm font-bold text-[#f5f5f3]">{user.name}</span>
                    <span className="truncate text-xs text-[#a3a3a0]">{user.companyName || user.email}</span>
                  </span>
                  <IconChevronUp className="ml-auto text-[#a3a3a0]" size={18} />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-[--radix-dropdown-menu-trigger-width] min-w-60 rounded-2xl p-1.5">
                <DropdownMenuLabel className="font-normal">
                  <div className="truncate text-sm font-bold">{user.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="h-10 rounded-xl">
                  <Link href="/app/parametres" onClick={close}>
                    <IconSettings size={18} /> Paramètres
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="h-10 rounded-xl">
                  <Link href="/" target="_blank">
                    <IconExternalLink size={18} /> Voir le site
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setTimeout(() => setLeaving(true), 120)} className="h-10 rounded-xl text-destructive focus:text-destructive">
                  <IconLogout size={18} /> Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
      <SignOutDialog open={leaving} onOpenChange={setLeaving} name={user.name} />
    </Sidebar>
  );
}
