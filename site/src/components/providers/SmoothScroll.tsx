"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Integra Lenis + GSAP + ScrollTrigger corretamente:
 * - sincroniza o RAF do Lenis com o ticker do GSAP
 * - atualiza o ScrollTrigger a cada scroll do Lenis
 * - respeita prefers-reduced-motion (desliga a rolagem suave)
 * - desativa em telas pequenas para preservar controle/nativo no toque
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isTouch = window.matchMedia("(max-width: 768px)").matches;

    if (prefersReduced || isTouch) {
      // rolagem nativa; só garante que o ScrollTrigger funcione
      ScrollTrigger.refresh();
      return;
    }

    const lenis = new Lenis({
      duration: 1.5,
      // easeOutExpo — desaceleração longa e suave (sensação "pesada"/premium)
      easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // âncoras internas funcionam com o Lenis
    const onAnchorClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (el) {
        e.preventDefault();
        lenis.scrollTo(el as HTMLElement, { offset: -80 });
      }
    };
    document.addEventListener("click", onAnchorClick);

    return () => {
      document.removeEventListener("click", onAnchorClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
