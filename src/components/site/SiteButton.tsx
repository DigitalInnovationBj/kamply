import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import type { ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
  variant?: "brand" | "black" | "white";
  size?: "md" | "sm";
  className?: string;
};

/** Bouton pilule : remplissage circulaire depuis la flèche, flèche qui pivote de 45° au survol. */
export function Button({ href, children, variant = "brand", size = "md", className = "" }: Props) {
  const cls = [
    "btn",
    variant === "black" && "btn--black",
    variant === "white" && "btn--white",
    size === "sm" && "btn--sm",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link href={href} className={cls}>
      <span className="btn-label">{children}</span>
      <span className="btn-arrow" aria-hidden="true">
        <IconArrowRight size={size === "sm" ? 16 : 19} stroke={2.4} />
      </span>
    </Link>
  );
}
