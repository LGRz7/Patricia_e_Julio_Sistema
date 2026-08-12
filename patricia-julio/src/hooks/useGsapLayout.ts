"use client";

import { useLayoutEffect, type RefObject, type DependencyList } from "react";
import { gsap } from "@/lib/gsap";

type SetupFn = (
  context: gsap.Context,
  reduced: boolean
) => void | (() => void);

/**
 * Centraliza o ciclo de vida das animações GSAP dentro do React:
 * - usa gsap.context() com escopo no elemento (cleanup automático)
 * - detecta prefers-reduced-motion e repassa para o setup
 * - executa o cleanup retornado pelo setup ao desmontar
 *
 * Evita vazamento de memória e múltiplas instâncias de ScrollTrigger.
 */
export function useGsapLayout(
  scope: RefObject<HTMLElement>,
  setup: SetupFn,
  deps: DependencyList = []
) {
  useLayoutEffect(() => {
    if (!scope.current) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let cleanup: void | (() => void);
    const ctx = gsap.context((self) => {
      cleanup = setup(self, reduced);
    }, scope);

    return () => {
      if (typeof cleanup === "function") cleanup();
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
