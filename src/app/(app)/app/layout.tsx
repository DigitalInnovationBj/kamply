import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/AppSidebar";
import { AppTopbar, BottomNav } from "@/components/app/MobileChrome";
import { PageLoader } from "@/components/app/PageLoader";
import { requireUser } from "@/lib/session";
import { getAdminOverview } from "@/lib/server/queries";

export const metadata: Metadata = {
  title: { default: "Mon espace", template: "%s | KAMPLY" },
  robots: { index: false, follow: false },
};

async function Shell({ children }: { children: React.ReactNode }) {
  const [{ user }, store] = await Promise.all([requireUser(), cookies()]);
  const badges = user.role === "admin" ? await getAdminOverview() : undefined;
  const defaultOpen = store.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen} style={{ ["--sidebar-width" as string]: "17rem" }}>
      <AppSidebar user={user} badges={badges ? { pendingCampaigns: badges.pendingCampaigns, pendingTopups: badges.pendingTopups } : undefined} />
      <SidebarInset className="min-w-0 bg-background">
        <AppTopbar user={user} />
        <div className="mx-auto w-full min-w-0 max-w-[1200px] flex-1 overflow-x-clip px-4 pb-32 pt-6 sm:px-6 md:pb-12 lg:px-8">{children}</div>
      </SidebarInset>
      <BottomNav />
    </SidebarProvider>
  );
}

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <div className="app-surface">
      <Suspense fallback={<PageLoader fullscreen label="Chargement de votre espace" />}>
        <Shell>{children}</Shell>
      </Suspense>
    </div>
  );
}
