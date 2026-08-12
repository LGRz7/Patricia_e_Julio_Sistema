"use client";

import Image from "next/image";
import { useRef } from "react";
import { profissionais } from "@/data/profissionais";
import {
  linkWhatsapp,
  mensagemContatoGeral,
} from "@/lib/whatsapp";
import { WhatsappIcon } from "@/components/ui/WhatsappIcon";
import { gsap } from "@/lib/gsap";
import { useGsapLayout } from "@/hooks/useGsapLayout";

/**
 * Chamada final. Um único CTA principal de WhatsApp e a escolha de corretor
 * de forma discreta (links), evitando excesso de botões.
 */
export function ContatoFinal() {
  const root = useRef<HTMLElement>(null);
  const waGeral = linkWhatsapp({ mensagem: mensagemContatoGeral() });

  useGsapLayout(root, (_ctx, reduced) => {
    const icone = root.current!.querySelector<HTMLElement>("[data-icone]");
    if (!icone || reduced) return;
    // flutuação suave + leve giro, contínuo
    gsap.to(icone, {
      y: -8,
      duration: 2.4,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });
    gsap.to(icone, {
      rotation: 5,
      duration: 3.6,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      transformOrigin: "center center",
    });
  });

  return (
    <section ref={root} id="contato" className="editorial py-28 md:py-40">
      <h2 className="title-balance max-w-[16ch] font-display text-fluid-2xl font-semibold leading-[1.02] tracking-tightest">
        Vamos encontrar
        <span data-icone className="mx-3 inline-flex translate-y-1 align-middle will-change-transform">
          <Image
            src="/imoveis/casa-icone.png"
            alt=""
            width={160}
            height={160}
            className="h-[1.35em] w-auto object-contain"
            aria-hidden
          />
        </span>
        o seu próximo imóvel.
      </h2>

      <p className="mt-8 max-w-md text-fluid-base text-navy/70">
        Sem formulário interminável e sem espera. Uma mensagem e a gente já
        começa a procurar com você.
      </p>

      {/* CTA principal único */}
      <a
        href={waGeral ?? "/contato"}
        {...(waGeral ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="mt-10 inline-flex items-center gap-3 rounded-full bg-[#25D366] px-8 py-4 text-fluid-base font-medium text-white shadow-lg shadow-[#25D366]/25 transition-transform duration-300 ease-editorial hover:scale-[1.03]"
      >
        <WhatsappIcon size={24} />
        Começar a conversa
      </a>

      {/* escolha discreta de corretor */}
      <p className="mt-7 flex flex-wrap items-center gap-x-2 gap-y-1 text-fluid-sm text-navy/50">
        <span>Prefere falar direto?</span>
        {profissionais.map((p, i) => {
          const wa = linkWhatsapp({
            numero: p.whatsapp,
            mensagem: mensagemContatoGeral(),
          });
          return (
            <span key={p.id}>
              <a
                href={wa ?? "/contato"}
                {...(wa
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="text-navy underline decoration-navy/30 underline-offset-4 transition-colors hover:decoration-navy"
              >
                {p.nome}
              </a>
              {i === 0 ? <span className="text-navy/30"> · </span> : null}
            </span>
          );
        })}
      </p>
    </section>
  );
}
