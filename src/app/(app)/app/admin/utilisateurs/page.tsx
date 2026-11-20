import type { Metadata } from "next";
import Link from "next/link";
import { IconMail } from "@tabler/icons-react";
import { requireAdmin } from "@/lib/session";
import { getAdminUsers } from "@/lib/server/queries";
import { PageHeader } from "@/components/app/PageHeader";
import { UserTable } from "@/components/app/admin/UserTable";

export const metadata: Metadata = { title: "Utilisateurs · Admin" };

export default async function AdminUsersPage() {
  const { user } = await requireAdmin();
  const list = await getAdminUsers();
  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Utilisateurs"
        description="Recherchez un compte, écrivez-lui, gérez son rôle ou suspendez-le."
        actions={
          <Link href="/app/admin/emails" className="inline-flex h-12 items-center gap-2 self-start rounded-full bg-primary px-5 text-[15px] font-bold text-black no-underline hover:bg-black hover:text-[#f5f5f3]">
            <IconMail size={18} /> Écrire à tous
          </Link>
        }
      />
      <div className="rise">
        <UserTable
          meId={user.id}
          items={list.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            image: u.image,
            role: u.role,
            companyName: u.companyName,
            emailVerified: u.emailVerified,
            banned: !!u.banned,
            banReason: u.banReason,
            banExpires: u.banExpires?.toISOString() ?? null,
            createdAt: u.createdAt.toISOString(),
            balance: u.wallet?.balance ?? 0,
            campaigns: u._count.campaigns,
          }))}
        />
      </div>
    </>
  );
}
