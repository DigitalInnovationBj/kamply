"use client";

import { useRef, type ReactNode, type PointerEvent } from "react";

/** Galerie défilable à la souris (glisser) avec inertie, au doigt nativement. */
export function DragScroll({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const state = useRef({ down: false, x: 0, left: 0, v: 0, last: 0, raf: 0, moved: false });

  const glide = () => {
    const el = ref.current;
    const s = state.current;
    if (!el) return;
    s.v *= 0.94;
    el.scrollLeft -= s.v;
    if (Math.abs(s.v) > 0.3) s.raf = requestAnimationFrame(glide);
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(state.current.raf);
    state.current = { ...state.current, down: true, x: e.clientX, left: el.scrollLeft, v: 0, last: e.clientX, moved: false };
    el.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const s = state.current;
    const el = ref.current;
    if (!s.down || !el) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 4 && !s.moved) {
      s.moved = true;
      el.classList.add("is-dragging");
    }
    el.scrollLeft = s.left - dx;
    s.v = e.clientX - s.last;
    s.last = e.clientX;
  };
  const onUp = () => {
    const s = state.current;
    const el = ref.current;
    if (!s.down || !el) return;
    s.down = false;
    el.classList.remove("is-dragging");
    s.raf = requestAnimationFrame(glide);
  };

  return (
    <div
      ref={ref}
      className="gallery"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      role="region"
      aria-label="Exemples d'annonces générées, faire défiler horizontalement"
      tabIndex={0}
    >
      {children}
    </div>
  );
}
