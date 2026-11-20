import type { CSSProperties, ReactNode } from "react";

type Props = {
  id?: string;
  bg: string;
  fg?: string;
  grain?: boolean;
  label?: string;
  className?: string;
  innerStyle?: CSSProperties;
  children: ReactNode;
};

/** Une affiche plein écran. Elle s'épingle puis se fait recouvrir par la suivante (voir Choreography). */
export function Panel({ id, bg, fg = "#000", grain = true, label, className = "", innerStyle, children }: Props) {
  return (
    <section id={id} className="panel" aria-label={label} style={{ background: "#000" }}>
      <div className={`panel-inner ${grain ? "grain" : ""} ${className}`} style={{ background: bg, color: fg, ...innerStyle }}>
        {children}
      </div>
      <div className="panel-shade" aria-hidden="true" />
    </section>
  );
}
