"use client";

import { WhatsappIcon } from "./WhatsappIcon";
import { linkWhatsapp, mensagemContatoGeral } from "@/lib/whatsapp";

/**
 * Botão flutuante de WhatsApp com o logo oficial.
 * Círculo verde WhatsApp, com um anel de "pulso" sutil e expansão do
 * rótulo no hover (desktop). Se não houver número, leva ao /contato.
 */
export function WhatsappFloat() {
  const link = linkWhatsapp({ mensagem: mensagemContatoGeral() });
  const href = link ?? "/contato";
  const external = Boolean(link);

  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      aria-label="Conversar no WhatsApp"
      className="group fixed bottom-5 right-5 z-40 flex items-center md:bottom-8 md:right-8"
    >
      {/* anel de pulso */}
      <span className="absolute right-0 h-14 w-14 rounded-full bg-[#25D366]/40 opacity-70 transition-transform duration-700 ease-editorial group-hover:scale-125 motion-safe:animate-ping" />

      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30 transition-transform duration-300 ease-editorial group-hover:scale-105">
        <WhatsappIcon size={30} />
      </span>

      {/* rótulo que expande no hover (desktop) */}
      <span className="pointer-events-none ml-0 max-w-0 overflow-hidden whitespace-nowrap rounded-full text-fluid-sm font-medium text-navy opacity-0 transition-all duration-400 ease-editorial group-hover:ml-3 group-hover:max-w-[160px] group-hover:opacity-100">
        Fale no WhatsApp
      </span>
    </a>
  );
}
