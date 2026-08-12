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
      className="relative flex h-[100svh] min-h-[560px] md:min-h-[600px] flex-col overflow-hidden"
    >
      {/* imagem de fundo com foco ajustado por breakpoint */}
      <div data-img className="absolute inset-0 will-change-transform">
        <div data-img-inner className="absolute inset-[-3%]">
          <Image
            src="/imoveis/parada-40.png"
            alt="Edifício na Parada 40, São Gonçalo — imóvel em destaque"
            fill
            priority
            quality={100}
            sizes="100vw"
            className="object-cover object-[center_30%] md:object-center"
          />
        </div>
        {/* overlay diferente por breakpoint pra legibilidade */}
        <div className="absolute inset-0 bg-navy/40 md:bg-navy/30" />
        {/* gradient extra no mobile (parte inferior escurece) pra tipografia bater */}
        <div className="absolute inset-x-0 bottom-0 h-[55%] md:hidden bg-gradient-to-t from-navy/85 via-navy/55 to-transparent" />
        {/* gradient superior discreto pra menu mobile */}
        <div className="absolute inset-x-0 top-0 h-24 md:hidden bg-gradient-to-b from-navy/50 to-transparent" />
      </div>

      {/* ============= MOBILE (< md) ============= */}
      <div className="md:hidden relative z-10 flex-1 flex flex-col justify-end pb-10 px-5 pt-24">
        <p
          data-meta
          className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.22em] text-beige/85"
        >
          {site.assinatura}
        </p>

        <h1
          data-titulo
          className="title-balance font-display font-semibold leading-[1.02] tracking-tightest text-beige"
          style={{ fontSize: "clamp(2rem, 8.5vw, 2.75rem)" }}
        >
          O imóvel certo, com quem cuida de cada detalhe.
        </h1>

        <p
          data-apoio
          className="mt-4 text-[13.5px] leading-relaxed text-beige/80 max-w-[92%]"
        >
          Atendimento próximo em São Gonçalo e região. Compra, venda e
          investimento com quem entende do bairro.
        </p>

        <div data-cta className="mt-7 flex flex-col gap-2.5">
          <Link
            href="/imoveis"
            className="flex items-center justify-center gap-2 h-14 rounded-full bg-beige px-6 text-[14px] font-semibold text-navy shadow-[0_10px_24px_-8px_rgba(15,23,42,0.5)] active:scale-[0.98] transition-transform"
          >
            Ver imóveis disponíveis
          </Link>
          <Link
            href="/contato"
            className="flex items-center justify-center gap-2 h-14 rounded-full border border-beige/40 bg-beige/10 px-6 text-[14px] font-semibold text-beige backdrop-blur-sm active:scale-[0.98] transition-transform"
          >
            Falar no WhatsApp
          </Link>
        </div>

        <div
          data-scroll
          className="mt-6 flex items-center gap-1.5 text-[11px] text-beige/70"
        >
          <ArrowDown size={13} className="animate-bounce" />
          <span>Role pra descobrir mais</span>
        </div>
      </div>

      {/* ============= DESKTOP (md+) ============= */}
      <div className="hidden md:flex md:flex-col md:justify-end md:flex-1 relative">
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
      </div>
    </section>
  );
}
