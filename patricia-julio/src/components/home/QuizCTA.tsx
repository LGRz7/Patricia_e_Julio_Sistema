"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { useGsapLayout } from "@/hooks/useGsapLayout";

/**
 * Chamada para o quiz: experiência interativa que entende o que a pessoa
 * procura e a leva ao WhatsApp.
 */
export function QuizCTA() {
  const root = useRef<HTMLElement>(null);

  useGsapLayout(root, (_ctx, reduced) => {
    if (reduced) return;
    gsap.from("[data-cta-inner]", {
      opacity: 0,
      y: 50,
      duration: 1,
      ease: "expo.out",
      scrollTrigger: { trigger: root.current, start: "top 80%" },
    });
  });

  return (
    <section ref={root} className="editorial py-24 md:py-32">
      <Link
        href="/quiz"
        data-cta-inner
        className="group block rounded-3xl bg-sky/40 p-10 transition-colors duration-500 ease-editorial hover:bg-sky/60 md:p-16"
      >
        <p className="text-fluid-sm uppercase tracking-[0.25em] text-teal">
          Não sabe por onde começar?
        </p>
        <div className="mt-5 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <h2 className="title-balance max-w-[16ch] font-display text-fluid-xl font-semibold leading-[1.05] tracking-tight md:text-fluid-2xl">
            Responde 4 perguntas e a gente acha o imóvel certo pra você.
          </h2>
          <span className="inline-flex items-center gap-3 whitespace-nowrap rounded-full bg-navy px-7 py-4 text-fluid-base font-medium text-beige transition-transform duration-300 ease-editorial group-hover:translate-x-1">
            Começar
            <ArrowRight size={18} />
          </span>
        </div>
      </Link>
    </section>
  );
}
