"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap } from "@/lib/gsap";
import { useGsapLayout } from "@/hooks/useGsapLayout";
import { CardImovel } from "@/components/imovel/CardImovel";
import { getImoveisDestaque } from "@/data/imoveis";

export function Destaques() {
  const root = useRef<HTMLElement>(null);
  const imoveis = getImoveisDestaque();

  useGsapLayout(root, (_ctx, reduced) => {
    const itens = gsap.utils.toArray<HTMLElement>("[data-item]");
    if (reduced) {
      gsap.set(itens, { opacity: 1, y: 0 });
      return;
    }
    itens.forEach((item) => {
      const capa = item.querySelector<HTMLElement>("[data-capa]");
      const conteudo = item.querySelector<HTMLElement>("[data-info]");

      const tl = gsap.timeline({
        scrollTrigger: { trigger: item, start: "top 85%" },
      });

      // card sobe e aparece
      tl.fromTo(
        item,
        { yPercent: 14, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: "power3.out" },
        0
      );
      // imagem revela por máscara (de baixo p/ cima) + leve zoom
      if (capa) {
        tl.fromTo(
          capa,
          { clipPath: "inset(100% 0 0 0)" },
          { clipPath: "inset(0% 0 0 0)", duration: 0.7, ease: "power3.out" },
          0
        );
        const img = capa.querySelector("img");
        if (img) {
          tl.fromTo(
            img,
            { scale: 1.18 },
            { scale: 1, duration: 0.9, ease: "power3.out" },
            0
          );
        }
      }
      // texto/infos entram logo depois
      if (conteudo) {
        tl.fromTo(
          conteudo,
          { y: 16, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" },
          0.15
        );
      }
    });
  });

  return (
    <section ref={root} className="editorial py-24 md:py-32">
      <div className="mb-14 flex items-end justify-between gap-6">
        <div>
          <p className="mb-4 text-fluid-sm uppercase tracking-[0.25em] text-teal">
            Seleção
          </p>
          <h2 className="font-display text-fluid-xl font-semibold tracking-tight">
            Imóveis em destaque
          </h2>
        </div>
        <Link
          href="/imoveis"
          className="hidden whitespace-nowrap text-fluid-base text-navy underline-offset-4 hover:underline md:inline-block"
        >
          Ver todos →
        </Link>
      </div>

      {/* composição assimétrica: alterna alinhamento e formato */}
      <div className="grid gap-x-8 gap-y-16 md:grid-cols-2">
        {imoveis.map((imovel, i) => (
          <div
            key={imovel.slug}
            data-item
            className={i % 2 === 1 ? "md:mt-24" : ""}
          >
            <CardImovel
              imovel={imovel}
              indice={i + 1}
              formato={i % 2 === 1 ? "vertical" : "horizontal"}
            />
          </div>
        ))}
      </div>

      <Link
        href="/imoveis"
        className="mt-14 inline-block text-fluid-base text-navy underline-offset-4 hover:underline md:hidden"
      >
        Ver todos os imóveis →
      </Link>
    </section>
  );
}
