"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";
import { useGsapLayout } from "@/hooks/useGsapLayout";

/**
 * Seção institucional: fundo navy, texto grande à esquerda e a chave
 * (PNG transparente) que DESCE ao entrar na viewport e depois fica
 * flutuando suavemente ao lado do texto.
 *
 * - entrada (descida): controlada por ScrollTrigger
 * - flutuação: loop contínuo num elemento interno (não conflita com a entrada)
 * - sem card/fundo: a imagem precisa ser transparente para o efeito funcionar
 */
export function Institucional() {
  const root = useRef<HTMLElement>(null);

  useGsapLayout(root, (_ctx, reduced) => {
    const entrada = root.current!.querySelector<HTMLElement>("[data-chave-entrada]");
    const flutua = root.current!.querySelector<HTMLElement>("[data-chave-flutua]");
    if (!entrada || !flutua) return;

    if (reduced) {
      gsap.set(entrada, { opacity: 1, y: 0 });
      return;
    }

    // 1) entrada amarrada ao scroll (igual ao card antigo): a chave desce
    //    conforme a seção entra, acompanhando a rolagem
    gsap.fromTo(
      entrada,
      { y: -160, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top 80%",
          end: "center center",
          scrub: true,
        },
      }
    );

    // 2) flutuação contínua (sobe e desce de leve, com leve giro)
    const floatY = gsap.to(flutua, {
      y: 18,
      duration: 3,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });
    const floatR = gsap.to(flutua, {
      rotation: 4,
      duration: 4.5,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });

    return () => {
      floatY.kill();
      floatR.kill();
    };
  });

  return (
    <section ref={root} className="relative overflow-hidden bg-navy text-beige">
      <div className="editorial grid items-center gap-12 py-24 md:grid-cols-2 md:py-36">
        <div>
          <p className="mb-6 text-fluid-sm uppercase tracking-[0.25em] text-sky/70">
            Nosso jeito
          </p>
          <p className="title-balance max-w-[20ch] font-display text-fluid-xl font-medium leading-tight tracking-tight md:text-fluid-2xl">
            Atendimento próximo, do primeiro contato à entrega das chaves.
          </p>
          <p className="mt-8 max-w-md text-fluid-base text-beige/70">
            Sem pressa e sem pressão. Entendemos o que você procura para
            apresentar só o que faz sentido — com a segurança de quem leva
            cada negociação a sério.
          </p>
        </div>

        {/* chave transparente que desce e flutua (sem card/fundo) */}
        <div className="flex items-center justify-center">
          <div data-chave-entrada className="will-change-transform">
            <div data-chave-flutua className="will-change-transform">
              <Image
                src="/imoveis/chavegsap.png"
                alt="Chave do seu próximo imóvel"
                width={420}
                height={560}
                quality={95}
                sizes="(max-width: 768px) 70vw, 35vw"
                className="h-auto w-[60vw] max-w-[360px] object-contain md:w-[32vw]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
