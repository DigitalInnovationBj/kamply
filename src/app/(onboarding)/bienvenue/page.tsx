import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { ProfileForm } from "@/components/app/ProfileForm";
import { PageLoader } from "@/components/app/PageLoader";
import { SignOutButton } from "@/components/app/SignOut";

export const metadata: Metadata = { title: "Bienvenue" };

async function Onboarding() {
  const { user } = await requireUser({ allowIncompleteProfile: true });
  if (user.onboardingCompleted) redirect("/app");
  const first = user.name.split(" ")[0];
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-[640px] flex-col px-5 pb-10 pt-5 sm:px-8">
      <header className="flex items-center justify-between">
        <span className="font-display text-[30px] leading-none">KAMPLY</span>
        <SignOutButton name={user.name} />
      </header>
      <main className="flex-1 py-10">
        <div className="rise mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Étape 3 sur 3</p>
          <h1 className="mt-3 text-[34px] font-black leading-[1.02] tracking-[-0.035em] sm:text-[42px]">Ravi de vous voir, {first}.</h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-muted-foreground">
            Quelques informations sur votre activité, et l&apos;IA pourra préparer des annonces qui vous ressemblent.
          </p>
        </div>
        <ProfileForm mode="onboarding" initial={user} />
      </main>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<PageLoader fullscreen />}>
      <Onboarding />
    </Suspense>
  );
}
