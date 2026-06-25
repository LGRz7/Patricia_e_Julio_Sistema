"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import SplitType from "split-type";
import { gsap } from "@/lib/gsap";
import { useGsapLayout } from "@/hooks/useGsapLayout";
import { site } from "@/data/site";

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGsapLayout(
    root,
    (ctx, reduced) => {
      const tituloEl = root.current!.querySelector<HTMLElement>("[data-titulo]");
      const split = tituloEl
        ? new SplitType(tituloEl, { types: "lines", lineClass: "hero-line" })
        : null;

      // envolve cada linha numa máscara para revelação limpa
      split?.lines?.forEach((line) => {
        const wrap = document.createElement("span");
        wrap.style.display = "block";
        wrap.style.overflow = "hidden";
        line.parentNode?.insertBefore(wrap, line);
        wrap.appendChild(line);
      });

      if (reduced) {
        gsap.set(
          root.current!.querySelectorAll(
            "[data-img], .hero-line, [data-apoio], [data-cta], [data-scroll], [data-meta]"
          ),
          { clearProps: "all", opacity: 1, y: 0 }
        );
        return () => split?.revert();
      }

      // timeline de entrada
      const tl = gsap.timeline({
        defaults: { ease: "expo.out" },
      });

      tl.fromTo(
        "[data-img]",
        { clipPath: "inset(100% 0 0 0)", scale: 1.06 },
        { clipPath: "inset(0% 0 0 0)", scale: 1, duration: 1.3 }
      )
        .from(
          ".hero-line",
          { yPercent: 110, duration: 1, stagger: 0.12 },
          "-=0.7"
        )
        .from("[data-meta]", { opacity: 0, y: 16, duration: 0.8 }, "-=0.6")
        .from("[data-apoio]", { opacity: 0, y: 20, duration: 0.8 }, "-=0.6")
        .from("[data-cta]", { opacity: 0, y: 20, duration: 0.7 }, "-=0.5")
        .from("[data-scroll]", { opacity: 0, duration: 0.6 }, "-=0.3");

      // movimento sutil da imagem durante o scroll (parallax discreto)
      gsap.to("[data-img-inner]", {
        yPercent: 6,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      return () => {
        split?.revert();
      };
    },
    []
  );

  return (
    <section
      ref={root}
      className="relative flex h-[100svh] min-h-[600px] flex-col justify-end overflow-hidden"
    >
      {/* imagem de fundo (placeholder até foto real) */}
      <div data-img className="absolute inset-0 will-change-transform">
        <div data-img-inner className="absolute inset-[-3%]">
          <Image
            src="/imoveis/parada-40.png"
            alt="Edifício na Parada 40, São Gonçalo — imóvel em destaque"
            fill
            priority
            quality={100}
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-navy/30" />
      </div>

      {/* conteúdo do hero */}
      <div className="editorial relative z-10 pb-16 md:pb-24">
        <p
          data-meta
          className="mb-6 text-fluid-sm uppercase tracking-[0.25em] text-beige/80"
        >
          {site.assinatura} · {site.regiao}
        </p>

        <h1
          data-titulo
          className="title-balance max-w-[14ch] font-display text-fluid-2xl font-semibold leading-[0.95] tracking-tightest text-beige"
        >
          O imóvel certo, com quem cuida de cada detalhe.
        </h1>

        <p
          data-apoio
          className="mt-6 max-w-md text-fluid-base text-beige/80"
        >
          Atendimento próximo e seguro para você comprar, vender ou investir
          em São Gonçalo e região.
        </p>

        <div data-cta className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/imoveis"
            className="rounded-full bg-beige px-7 py-3.5 text-fluid-sm font-medium text-navy transition-colors duration-400 ease-editorial hover:bg-white"
          >
            Ver imóveis
          </Link>
          <Link
            href="/contato"
            className="rounded-full border border-beige/40 px-7 py-3.5 text-fluid-sm font-medium text-beige transition-colors duration-400 ease-editorial hover:bg-beige hover:text-navy"
          >
            Falar com a gente
          </Link>
        </div>
      </div>

      <div
        data-scroll
        className="editorial relative z-10 flex items-center gap-2 pb-6 text-fluid-sm text-beige/60"
      >
        <ArrowDown size={16} className="animate-bounce" />
        <span>Role para descobrir</span>
      </div>
    </section>
  );
}
