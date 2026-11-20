import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function OnboardingLayout({ children }: LayoutProps<"/">) {
  return <div className="app-surface">{children}</div>;
}
