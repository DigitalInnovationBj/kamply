"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
  gsap.defaults({ ease: "expo.out", duration: 1 });
}

/** Courbes maison : une seule source pour tout le site. */
export const EASE = {
  out: "expo.out",
  inOut: "power4.inOut",
  soft: "power3.out",
} as const;

export { gsap, ScrollTrigger, SplitText, useGSAP };
