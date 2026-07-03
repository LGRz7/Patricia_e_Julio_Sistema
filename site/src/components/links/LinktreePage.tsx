"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  Globe,
  Instagram,
  MessageCircle,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { gsap } from "@/lib/gsap";
import { useGsapLayout } from "@/hooks/useGsapLayout";
import { WhatsappIcon } from "@/components/ui/WhatsappIcon";
import { site } from "@/data/site";
import { profissionais } from "@/data/profissionais";
import { linkWhatsapp, mensagemContatoGeral } from "@/lib/whatsapp";

const wa = linkWhatsapp({ mensagem: mensagemContatoGeral() });

const links = [
  {
    id: "site",
    label: "Nosso site",
    desc: "Conheça os imóveis e a nossa forma de trabalhar",
    href: site.url,
    icon: Globe,
    variante: "principal",
    externo: true,
  },
  {
    id: "instagram",
    label: "Instagram",
    desc: "@julio_e_patricia_corretores",
    href: site.instagramUrl,
    icon: Instagram,
    variante: "secundario",
    externo: true,
  },
  {
    id: "catalogo",
    label: "Catálogo de imóveis",
    desc: "Veja os imóveis disponíveis em PDF",
    href: null, // ⚠️ a preencher quando o catálogo estiver pronto
    icon: BookOpen,
    variante: "secundario",
    externo: false,
  },
  {
    id: "whatsapp-patricia",
    label: "Falar com Patrícia",
    desc: "Corretora · CRECI 68850",
    href: linkWhatsapp({ numero: profissionais[0].whatsapp, mensagem: mensagemContatoGeral() }),
    icon: MessageCircle,
    variante: "whatsapp",
    externo: true,
  },
  {
    id: "whatsapp-julio",
    label: "Falar com Júlio",
    desc: "Corretor · CRECI 79271",
    href: linkWhatsapp({ numero: profissionais[1].whatsapp, mensagem: mensagemContatoGeral() }),
    icon: MessageCircle,
    variante: "whatsapp",
    externo: true,
  },
] as const;

const estilos = {
  principal:
    "bg-navy text-beige hover:bg-ink",
  secundario:
    "bg-beige/80 text-navy hover:bg-beige border border-navy/10",
  whatsapp:
    "bg-[#25D366] text-white hover:bg-[#1ebd5a]",
  desativado:
    "bg-beige/40 text-navy/40 cursor-not-allowed pointer-events-none border border-navy/10",
};

export function LinktreePage() {
  const root = useRef<HTMLElement>(null);

  useGsapLayout(root, (_ctx, reduced) => {
    if (reduced) return;

    const itens = gsap.utils.toArray<HTMLElement>("[data-link-item]");

    // avatar foto entra com escala
    gsap.from("[data-avatar-img]", {
      scale: 0.7,
      opacity: 0,
      duration: 0.8,
      ease: "back.out(1.5)",
    });

    // nome e subtítulo
    gsap.from("[data-header-text]", {
      y: 20,
      opacity: 0,
      duration: 0.7,
      ease: "expo.out",
      delay: 0.2,
    });

    // links entram em cascata
    gsap.from(itens, {
      y: 30,
      opacity: 0,
      duration: 0.5,
      ease: "expo.out",
      stagger: 0.1,
      delay: 0.35,
    });

    // casa flutua (sobe/desce + giro leve)
    gsap.to("[data-float-casa]", {
      y: -22,
      duration: 3.2,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });
    gsap.to("[data-float-casa]", {
      rotation: 6,
      duration: 4.8,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      transformOrigin: "center center",
    });

    // chave flutua (ritmo diferente pra não sincronizar com a casa)
    gsap.to("[data-float-chave]", {
      y: 18,
      duration: 2.8,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });
    gsap.to("[data-float-chave]", {
      rotation: -8,
      duration: 4.2,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      transformOrigin: "center center",
    });
  });

  return (
    <main
      ref={root}
      className="relative flex min-h-screen flex-col items-center justify-start overflow-hidden bg-beige px-4 py-16 font-sans md:py-24"
    >
      {/* ícone de casa flutuando no fundo */}
      <div
        data-avatar
        className="pointer-events-none absolute -right-16 top-16 opacity-[0.07] md:-right-8 md:top-24"
        style={{ width: 340 }}
        aria-hidden
      >
        <div data-float-casa className="will-change-transform">
          <img
            src="/imoveis/casa-icone.png"
            alt=""
            style={{ width: "100%", height: "auto" }}
          />
        </div>
      </div>

      {/* ícone de chave flutuando (outro canto) */}
      <div
        className="pointer-events-none absolute -left-14 bottom-[55%] opacity-[0.06] md:-left-6 md:bottom-40"
        style={{ width: 220 }}
        aria-hidden
      >
        <div data-float-chave className="will-change-transform">
          <img
            src="/imoveis/chavegsap.png"
            alt=""
            style={{ width: "100%", height: "auto" }}
          />
        </div>
      </div>
      {/* avatar + header */}
      <div className="mb-10 flex flex-col items-center text-center">
        <div
          data-avatar-img
          className="relative mb-6 h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-xl shadow-navy/15"
        >
          <Image
            src="/equipe/patricia-julio.png"
            alt="Patrícia e Júlio — Corretores de Imóveis"
            fill
            sizes="112px"
            className="object-cover"
            priority
          />
        </div>

        <div data-header-text>
          <h1 className="font-display text-2xl font-bold tracking-tight text-navy">
            Patrícia e Júlio
          </h1>
          <p className="mt-1 text-sm font-medium text-teal">
            Corretores de Imóveis · São Gonçalo / RJ
          </p>
          <p className="mt-3 max-w-[22ch] text-sm text-navy/60 leading-relaxed">
            Atendimento próximo, do primeiro contato à entrega das chaves.
          </p>
        </div>
      </div>

      {/* links */}
      <div className="flex w-full max-w-sm flex-col gap-3">
        {links.map((link) => {
          const Icon = link.icon;
          const inativo = !link.href;
          const estilo = inativo
            ? estilos.desativado
            : estilos[link.variante as keyof typeof estilos];

          const inner = (
            <div className="flex items-center gap-4">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  link.variante === "principal"
                    ? "bg-beige/15"
                    : link.variante === "whatsapp"
                    ? "bg-white/25"
                    : "bg-navy/8"
                }`}
              >
                {link.variante === "whatsapp" ? (
                  <WhatsappIcon size={20} />
                ) : (
                  <Icon size={20} />
                )}
              </span>
              <div className="flex-1 text-left">
                <p className="text-base font-semibold leading-tight">
                  {link.label}
                  {inativo && (
                    <span className="ml-2 text-xs font-normal opacity-60">
                      em breve
                    </span>
                  )}
                </p>
                <p className="text-xs opacity-70 mt-0.5">{link.desc}</p>
              </div>
              {!inativo && (
                <ExternalLink size={16} className="shrink-0 opacity-50" />
              )}
            </div>
          );

          return (
            <div key={link.id} data-link-item>
              {inativo ? (
                <div className={`rounded-2xl px-5 py-4 transition-all duration-300 ${estilo}`}>
                  {inner}
                </div>
              ) : (
                <a
                  href={link.href!}
                  {...(link.externo
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className={`block rounded-2xl px-5 py-4 transition-all duration-300 ease-editorial hover:-translate-y-0.5 hover:shadow-lg hover:shadow-navy/10 ${estilo}`}
                >
                  {inner}
                </a>
              )}
            </div>
          );
        })}
      </div>

      {/* rodapé */}
      <div className="mt-12 flex flex-col items-center gap-1 text-center text-xs text-navy/40">
        <p>Patrícia Vidal · CRECI 68850</p>
        <p>Júlio Aguiar · CRECI 79271</p>
      </div>
    </main>
  );
}
