"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";
import { useGsapLayout } from "@/hooks/useGsapLayout";
import { profissionais } from "@/data/profissionais";
import { linkWhatsapp, mensagemContatoGeral } from "@/lib/whatsapp";

/**
 * Apresentação dos dois profissionais.
 * Desktop: imagem fixada (pin) enquanto o foco alterna entre os dois.
 * Mobile: empilhado, vertical, sem pin.
 */
export function Profissionais() {
  const root = useRef<HTMLElement>(null);

  useGsapLayout(root, (_ctx, reduced) => {
    if (reduced) return;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 769px)", () => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-pessoa]");

      // pin da coluna de imagem enquanto os textos passam
      ScrollTriggerPin(root.current!);

      cards.forEach((card) => {
        gsap.from(card, {
          opacity: 0,
          y: 40,
          duration: 0.9,
          ease: "expo.out",
          scrollTrigger: {
            trigger: card,
            start: "top 75%",
          },
        });
      });
    });

    mm.add("(max-width: 768px)", () => {
      gsap.utils.toArray<HTMLElement>("[data-pessoa]").forEach((card) => {
        gsap.from(card, {
          opacity: 0,
          y: 24,
          duration: 0.7,
          ease: "expo.out",
          scrollTrigger: { trigger: card, start: "top 85%" },
        });
      });
    });

    return () => mm.revert();
  });

  return (
    <section ref={root} className="bg-sky/40 py-24 md:py-32">
      <div className="editorial">
        <p className="mb-12 text-fluid-sm uppercase tracking-[0.25em] text-teal">
          Quem atende você
        </p>

        <div className="grid gap-16 md:grid-cols-[0.9fr_1.1fr] md:gap-20">
          {/* coluna de imagem (fixada no desktop) */}
          <div data-pin className="md:h-[70vh]">
            <div className="relative h-[60vh] overflow-hidden rounded-2xl md:sticky md:top-[15vh] md:h-[70vh]">
              <Image
                src={profissionais[0].foto}
                alt="Patrícia e Júlio, corretores de imóveis"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            </div>
          </div>

          {/* textos dos profissionais */}
          <div className="flex flex-col gap-16 md:gap-28 md:py-[8vh]">
            {profissionais.map((p) => {
              const wa = linkWhatsapp({
                numero: p.whatsapp,
                mensagem: mensagemContatoGeral(),
              });
              return (
                <div key={p.id} data-pessoa>
                  <h3 className="font-display text-fluid-xl font-semibold tracking-tight">
                    {p.nome}
                  </h3>
                  <p className="mt-1 text-fluid-base text-teal">
                    {p.papel} · {p.creci}
                  </p>
                  <p className="mt-5 max-w-md text-fluid-base text-navy/80">
                    {p.bio}
                  </p>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {p.especialidades.map((e) => (
                      <li
                        key={e}
                        className="rounded-full border border-navy/15 px-3 py-1 text-fluid-sm text-navy/70"
                      >
                        {e}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={wa ?? "/contato"}
                    {...(wa
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="mt-6 inline-block text-fluid-base text-navy underline-offset-4 hover:underline"
                  >
                    Conversar com {p.nome.split(" ")[0]} →
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/** pin da coluna de imagem (mantém a foto enquanto os textos rolam) */
function ScrollTriggerPin(_root: HTMLElement) {
  // A fixação é feita via CSS sticky na própria coluna (md:sticky),
  // mantendo o comportamento simples e sem conflito de ScrollTrigger.
  // Função mantida para clareza semântica do layout.
}
