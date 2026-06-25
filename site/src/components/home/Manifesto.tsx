"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import SplitType from "split-type";
import { gsap } from "@/lib/gsap";
import { useGsapLayout } from "@/hooks/useGsapLayout";

export function Manifesto() {
  const root = useRef<HTMLElement>(null);

  useGsapLayout(root, (_ctx, reduced) => {
    const frase = root.current!.querySelector<HTMLElement>("[data-frase]");
    if (!frase) return;

    const split = new SplitType(frase, { types: "words" });

    if (reduced) {
      gsap.set(split.words, { opacity: 1 });
      return () => split.revert();
    }

    // palavras ganham opacidade conforme a seção entra (texto progressivo)
    gsap.fromTo(
      split.words,
      { opacity: 0.15 },
      {
        opacity: 1,
        stagger: 0.04,
        ease: "none",
        scrollTrigger: {
          trigger: frase,
          start: "top 75%",
          end: "bottom 60%",
          scrub: true,
        },
      }
    );

    return () => split.revert();
  });

  return (
    <section ref={root} className="editorial py-28 md:py-40">
      <p className="mb-10 text-fluid-sm uppercase tracking-[0.25em] text-teal">
        Como trabalhamos
      </p>

      <h2
        data-frase
        className="title-balance max-w-[18ch] font-display text-fluid-xl font-medium leading-tight tracking-tight md:text-fluid-2xl"
      >
        Acreditamos que comprar um imóvel
        <span className="mx-2 inline-flex translate-y-2 align-middle">
          <Image
            src="/imoveis/placeholder-interior.svg"
            alt=""
            width={96}
            height={64}
            className="h-[0.85em] w-auto rounded-md object-cover md:h-[0.9em]"
            aria-hidden
          />
        </span>
        é uma decisão de confiança — e tratamos cada negociação com esse
        cuidado.
      </h2>

      <Link
        href="/sobre"
        className="mt-12 inline-block text-fluid-base text-teal underline-offset-4 hover:underline"
      >
        Conheça a Patrícia e o Júlio →
      </Link>
    </section>
  );
}
