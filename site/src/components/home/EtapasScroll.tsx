"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useGsapLayout } from "@/hooks/useGsapLayout";

/**
 * Seção "pinada" (ScrollTrigger pin + scrub): a tela trava, uma barra de
 * progresso avança no topo e os textos trocam um de cada vez no mesmo
 * lugar conforme o usuário rola. Ao terminar, libera para o resto do site.
 *
 * Inspirado na referência (site preto). Respeita prefers-reduced-motion:
 * sem pin, os passos viram uma lista vertical normal.
 */

const etapas = [
  {
    label: "Sem pressão",
    texto:
      "A gente escuta antes de mostrar. Você decide no seu tempo, sem ninguém te empurrando nada.",
  },
  {
    label: "Transparência",
    texto:
      "Cada etapa explicada com clareza — do primeiro contato à entrega das chaves.",
  },
  {
    label: "Conhecimento da região",
    texto:
      "Imóveis em São Gonçalo, Niterói e arredores, com quem realmente conhece a área.",
  },
  {
    label: "Do seu lado",
    texto:
      "Atendimento próximo e humano. Você fala direto com quem cuida do seu negócio.",
  },
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function EtapasScroll() {
  const root = useRef<HTMLElement>(null);

  useGsapLayout(root, (_ctx, reduced) => {
    if (reduced) return; // lista estática via CSS abaixo

    const passos = gsap.utils.toArray<HTMLElement>("[data-etapa]");
    const bar = root.current!.querySelector<HTMLElement>("[data-bar]");
    const barWrap = root.current!.querySelector<HTMLElement>("[data-barwrap]");
    const total = passos.length;

    // estado inicial: só o primeiro visível
    gsap.set(passos, { autoAlpha: 0, y: 40 });
    gsap.set(passos[0], { autoAlpha: 1, y: 0 });
    if (bar) gsap.set(bar, { scaleX: 0, transformOrigin: "left center" });
    if (barWrap) gsap.set(barWrap, { autoAlpha: 0 });

    let ativo = 0;

    ScrollTrigger.create({
      trigger: root.current,
      start: "top top",
      end: `+=${total * 100}%`,
      pin: "[data-pin]",
      scrub: true,
      onToggle: (self) => {
        // mostra a faixa fixa só enquanto a seção está ativa
        if (barWrap) gsap.to(barWrap, { autoAlpha: self.isActive ? 1 : 0, duration: 0.3 });
      },
      onUpdate: (self) => {
        const p = self.progress;
        if (bar) gsap.set(bar, { scaleX: p });

        const idx = Math.min(total - 1, Math.floor(p * total));
        if (idx !== ativo) {
          gsap.to(passos[ativo], {
            autoAlpha: 0,
            y: idx > ativo ? -40 : 40,
            duration: 0.4,
            ease: "power2.out",
            overwrite: true,
          });
          gsap.to(passos[idx], {
            autoAlpha: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out",
            overwrite: true,
          });
          ativo = idx;
        }
      },
    });
  });

  return (
    <section ref={root} className="bg-navy text-beige">
      {/* faixa de progresso FIXA na base da tela */}
      <div
        data-barwrap
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] h-1.5 bg-white/15"
      >
        <div
          data-bar
          className="h-full w-full origin-left bg-white"
          style={{ transform: "scaleX(0)" }}
        />
      </div>

      {/* painel fixado durante a rolagem */}
      <div
        data-pin
        className="relative flex h-screen flex-col justify-center overflow-hidden"
      >
        <div className="editorial w-full">
          <p className="mb-12 text-fluid-sm uppercase tracking-[0.25em] text-sky/70">
            Como trabalhamos
          </p>

          {/* área única onde os textos se trocam */}
          <div className="relative h-[46vh] w-full md:h-[38vh]">
            {etapas.map((etapa, i) => (
              <div
                key={i}
                data-etapa
                className="absolute inset-0 flex items-center"
              >
                <div className="grid w-full items-center gap-6 md:grid-cols-[0.4fr_1fr] md:gap-16">
                  <div className="flex items-center gap-4 md:flex-col md:items-start md:gap-2">
                    <span className="font-display text-fluid-lg font-medium text-beige/40">
                      {pad(i + 1)} / {pad(etapas.length)}
                    </span>
                    <span className="text-fluid-sm uppercase tracking-[0.2em] text-sky/70">
                      {etapa.label}
                    </span>
                  </div>
                  <p className="title-balance max-w-[20ch] font-display text-fluid-xl font-medium leading-tight tracking-tight md:text-fluid-2xl">
                    {etapa.texto}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
