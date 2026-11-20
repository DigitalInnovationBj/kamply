import Link from "next/link";

export default function LegalLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="app-surface min-h-svh">
      <header className="mx-auto flex max-w-[760px] items-center justify-between px-5 py-6">
        <Link href="/" className="font-display text-[30px] leading-none text-foreground no-underline" aria-label="KAMPLY, accueil">
          KAMPLY
        </Link>
        <Link href="/inscription" className="inline-flex h-11 items-center rounded-full bg-black px-5 text-sm font-bold text-[#f5f5f3] no-underline hover:bg-primary hover:text-black">
          Créer un compte
        </Link>
      </header>
      <main className="mx-auto max-w-[760px] px-5 pb-20 pt-6">{children}</main>
    </div>
  );
}
