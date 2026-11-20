import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { getAdminUsers } from "@/lib/server/queries";
import { PageHeader } from "@/components/app/PageHeader";
import { UserRows } from "@/components/app/admin/AdminLists";

export const metadata: Metadata = { title: "Utilisateurs · Admin" };

export default async function AdminUsersPage() {
  const { user } = await requireAdmin();
  const list = await getAdminUsers();
  return (
    <>
      <PageHeader eyebrow="Administration" title="Utilisateurs" description={`${list.length} compte${list.length > 1 ? "s" : ""}.`} />
      <div className="rise">
        <UserRows
          meId={user.id}
          items={list.map((u) => ({ id: u.id, name: u.name, email: u.email, image: u.image, role: u.role, companyName: u.companyName, emailVerified: u.emailVerified, createdAt: u.createdAt.toISOString(), balance: u.wallet?.balance ?? 0, campaigns: u._count.campaigns }))}
        />
      </div>
    </>
  );
}
