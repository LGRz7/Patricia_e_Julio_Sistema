"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useGsapLayout } from "@/hooks/useGsapLayout";

/**
 * Jornada imersiva — MESMA experiência no desktop e no mobile: linha brilhante
 * que serpenteia pela área com um ponto luminoso viajando conforme o scroll
 * (pin + scrub), parando em 3 passos. Só a FORMA do traçado muda por
 * orientação (paisagem no desktop, retrato no mobile) pra não cortar.
 */

// desktop (paisagem)
const VBW_D = 1200;
const VBH_D = 700;
const PATH_D =
  "M -40 600 C 150 580, 230 440, 400 445 C 560 450, 590 600, 470 630 C 360 656, 300 520, 430 470 C 620 398, 820 540, 840 380 C 856 250, 700 240, 760 150 C 810 78, 1010 120, 1260 40";

// mobile (retrato)
const VBW_M = 600;
const VBH_M = 1000;
const PATH_M =
  "M 300 -30 C 440 120, 480 220, 360 320 C 240 420, 140 480, 250 600 C 350 710, 480 720, 410 840 C 360 940, 290 970, 330 1070";

const passos = [
  {
    n: "Passo 1",
    titulo: "A gente entende o seu momento",
    texto: "Escutamos o que você procura antes de mostrar qualquer coisa.",
  },
  {
    n: "Passo 2",
    titulo: "Mostramos só o que faz sentido",
    texto: "Você recebe os imóveis certos pra você — com fotos, detalhes e visita.",
  },
  {
    n: "Passo 3",
    titulo: "Você recebe as chaves",
    texto: "Acompanhamos cada etapa até o imóvel ser seu de verdade.",
  },
];

const fracs = [0.2, 0.56, 0.94];

export function Jornada() {
  const root = useRef<HTMLElement>(null);

  useGsapLayout(root, (_ctx, reduced) => {
    const mm = gsap.matchMedia();

    // configura a animação para um conjunto de elementos (desktop OU mobile)
    const configurar = (sufixo: string) => {
      const q = (s: string) =>
        root.current!.querySelector<SVGGraphicsElement>(`[data-${s}-${sufixo}]`);
      const path = q("path") as SVGPathElement | null;
      const bright = q("bright") as SVGPathElement | null;
      const dot = q("dot") as SVGCircleElement | null;
      const halo = q("halo") as SVGCircleElement | null;
      const marcadores = gsap.utils.toArray<SVGCircleElement>(
        `[data-marker-${sufixo}]`
      );
      const textos = gsap.utils.toArray<HTMLElement>("[data-step]");
      if (!path || !dot) return;

      const len = path.getTotalLength();
      marcadores.forEach((m, i) => {
        const pt = path.getPointAtLength(len * fracs[i]);
        gsap.set(m, { attr: { cx: pt.x, cy: pt.y } });
      });
      const inicio = path.getPointAtLength(0);
      gsap.set([dot, halo], { attr: { cx: inicio.x, cy: inicio.y } });
      if (bright) gsap.set(bright, { strokeDasharray: len, strokeDashoffset: len });

      if (reduced) {
        if (bright) gsap.set(bright, { strokeDashoffset: 0 });
        const fim = path.getPointAtLength(len);
        gsap.set([dot, halo], { attr: { cx: fim.x, cy: fim.y } });
        gsap.set(textos, { autoAlpha: 1, y: 0 });
        return;
      }

      gsap.set(textos, { autoAlpha: 0, y: 24 });
      gsap.set(textos[0], { autoAlpha: 1, y: 0 });
      let ativo = 0;

      ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: `+=${passos.length * 100}%`,
        pin: "[data-pin]",
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress;
          const pt = path.getPointAtLength(len * p);
          gsap.set([dot, halo], { attr: { cx: pt.x, cy: pt.y } });
          if (bright) gsap.set(bright, { strokeDashoffset: len * (1 - p) });

          const idx = Math.min(passos.length - 1, Math.floor(p * passos.length));
          if (idx !== ativo) {
            gsap.to(textos[ativo], {
              autoAlpha: 0,
              y: idx > ativo ? -24 : 24,
              duration: 0.4,
              ease: "power2.out",
              overwrite: true,
            });
            gsap.to(textos[idx], {
              autoAlpha: 1,
              y: 0,
              duration: 0.5,
              ease: "power2.out",
              overwrite: true,
            });
            marcadores.forEach((m, i) =>
              gsap.to(m, {
                attr: { r: i === idx ? 10 : 5 },
                opacity: i <= idx ? 1 : 0.4,
                duration: 0.4,
                overwrite: true,
              })
            );
            ativo = idx;
          }
        },
      });
    };

    mm.add("(min-width: 768px)", () => configurar("d"));
    mm.add("(max-width: 767px)", () => configurar("m"));

    return () => mm.revert();
  });

  const Grade = ({ vbw, vbh, n }: { vbw: number; vbh: number; n: number }) => (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const x = (vbw / n) * (i + 0.5);
        return (
          <line
            key={i}
            x1={x}
            y1="20"
            x2={x}
            y2={vbh - 20}
            stroke="#F5EFEB"
            strokeOpacity="0.04"
            strokeWidth="1"
          />
        );
      })}
    </>
  );

  return (
    <section ref={root} className="bg-ink text-beige">
      <div data-pin className="relative h-screen overflow-hidden">
        {/* SVG desktop (paisagem) */}
        <svg
          viewBox={`0 0 ${VBW_D} ${VBH_D}`}
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 hidden h-full w-full md:block"
          aria-hidden
        >
          <defs>
            <filter id="glowjd" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <Grade vbw={VBW_D} vbh={VBH_D} n={9} />
          <path data-path-d d={PATH_D} fill="none" stroke="#F5EFEB" strokeOpacity="0.1" strokeWidth="3" strokeLinecap="round" />
          <path data-bright-d d={PATH_D} fill="none" stroke="#C8D9E6" strokeWidth="5" strokeLinecap="round" filter="url(#glowjd)" />
          {passos.map((_, i) => (
            <circle key={i} data-marker-d r="5" fill="#C8D9E6" opacity="0.4" />
          ))}
          <circle data-halo-d r="30" fill="#C8D9E6" opacity="0.22" filter="url(#glowjd)" />
          <circle data-dot-d r="11" fill="#FFFFFF" filter="url(#glowjd)" />
        </svg>

        {/* SVG mobile (retrato) */}
        <svg
          viewBox={`0 0 ${VBW_M} ${VBH_M}`}
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full md:hidden"
          aria-hidden
        >
          <defs>
            <filter id="glowjm" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <Grade vbw={VBW_M} vbh={VBH_M} n={5} />
          <path data-path-m d={PATH_M} fill="none" stroke="#F5EFEB" strokeOpacity="0.1" strokeWidth="4" strokeLinecap="round" />
          <path data-bright-m d={PATH_M} fill="none" stroke="#C8D9E6" strokeWidth="6" strokeLinecap="round" filter="url(#glowjm)" />
          {passos.map((_, i) => (
            <circle key={i} data-marker-m r="6" fill="#C8D9E6" opacity="0.4" />
          ))}
          <circle data-halo-m r="34" fill="#C8D9E6" opacity="0.22" filter="url(#glowjm)" />
          <circle data-dot-m r="13" fill="#FFFFFF" filter="url(#glowjm)" />
        </svg>

        {/* scrim p/ legibilidade do texto */}
        <div className="pointer-events-none absolute inset-0 bg-ink/45 md:inset-y-0 md:left-0 md:w-3/5 md:bg-ink/55 md:blur-2xl" />

        {/* texto (compartilhado) */}
        <div className="editorial relative z-10 flex h-full max-w-2xl flex-col justify-center">
          <h2 className="title-balance max-w-[15ch] font-display text-fluid-xl font-semibold leading-[1.1] tracking-tight md:text-fluid-2xl">
            Até quando você vai se frustrar por não ter um lugar pra chamar de
            seu?
          </h2>
          <p className="mt-5 max-w-md text-fluid-base text-beige/60">
            O aluguel não volta. O primeiro passo pra mudar isso é mais perto do
            que você imagina.
          </p>

          <p className="mb-6 mt-10 text-fluid-sm uppercase tracking-[0.25em] text-teal md:mt-12">
            Como funciona
          </p>
          <div className="relative h-[28vh] md:h-[22vh]">
            {passos.map((passo, i) => (
              <div
                key={i}
                data-step
                className="absolute inset-0 flex flex-col justify-start"
              >
                <span className="inline-flex w-fit items-center rounded-full border border-beige/25 bg-ink/40 px-5 py-2 text-fluid-sm tracking-wide text-beige/90">
                  {passo.n}
                </span>
                <h3 className="mt-4 max-w-[16ch] font-display text-fluid-lg font-semibold leading-tight tracking-tight md:text-fluid-xl">
                  {passo.titulo}
                </h3>
                <p className="mt-3 max-w-sm text-fluid-base text-beige/70">
                  {passo.texto}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
