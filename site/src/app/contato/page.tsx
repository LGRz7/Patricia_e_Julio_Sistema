import type { Metadata } from "next";
import { Phone, Mail, Instagram, Clock, MessageCircle } from "lucide-react";
import { FormularioContato } from "@/components/contato/FormularioContato";
import { site } from "@/data/site";
import { profissionais } from "@/data/profissionais";
import { linkWhatsapp, mensagemContatoGeral } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Fale com Patrícia e Júlio pelo WhatsApp. Atendimento de imóveis em São Gonçalo e região.",
};

export default function ContatoPage() {
  return (
    <div className="editorial pt-32 pb-28 md:pt-44 md:pb-36">
      <header className="max-w-3xl">
        <p className="mb-5 text-fluid-sm uppercase tracking-[0.25em] text-teal">
          Contato
        </p>
        <h1 className="font-display text-fluid-2xl font-semibold leading-[1.02] tracking-tightest">
          Vamos conversar.
        </h1>
        <p className="mt-6 text-fluid-base text-navy/70">
          Preencha o formulário e a mensagem abre direto no WhatsApp do
          corretor que você escolher. Sem complicação.
        </p>
      </header>

      <div className="mt-16 grid gap-16 md:grid-cols-[1fr_1fr] md:gap-24">
        <div>
          <FormularioContato />
        </div>

        <aside className="space-y-10">
          <div>
            <h2 className="text-fluid-sm uppercase tracking-wide text-navy/40">
              Canais
            </h2>
            <ul className="mt-5 space-y-4 text-fluid-base">
              <ContatoItem
                icon={<Phone size={18} />}
                texto={site.telefone ?? "Telefone em breve"}
                pendente={!site.telefone}
              />
              <ContatoItem
                icon={<Mail size={18} />}
                texto={site.email ?? "E-mail em breve"}
                pendente={!site.email}
              />
              <ContatoItem
                icon={<Instagram size={18} />}
                texto={site.instagram ?? "Instagram em breve"}
                pendente={!site.instagram}
                href={site.instagram ? site.instagramUrl : undefined}
              />
              {site.horarioAtendimento && (
                <ContatoItem
                  icon={<Clock size={18} />}
                  texto={site.horarioAtendimento}
                />
              )}
            </ul>
          </div>

          <div>
            <h2 className="text-fluid-sm uppercase tracking-wide text-navy/40">
              Falar direto
            </h2>
            <div className="mt-5 space-y-3">
              {profissionais.map((p) => {
                const wa = linkWhatsapp({
                  numero: p.whatsapp,
                  mensagem: mensagemContatoGeral(),
                });
                return (
                  <a
                    key={p.id}
                    href={wa ?? "#"}
                    {...(wa
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : { "aria-disabled": true })}
                    className={`flex items-center justify-between rounded-2xl border border-navy/15 p-5 transition-colors ${
                      wa ? "hover:border-navy hover:bg-navy hover:text-beige" : "opacity-60"
                    }`}
                  >
                    <span>
                      <span className="block font-display text-fluid-base font-semibold">
                        {p.nome}
                      </span>
                      <span className="block text-fluid-sm text-teal">
                        {p.creci}
                      </span>
                    </span>
                    <MessageCircle size={20} />
                  </a>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ContatoItem({
  icon,
  texto,
  pendente,
  href,
}: {
  icon: React.ReactNode;
  texto: string;
  pendente?: boolean;
  href?: string;
}) {
  const conteudo = (
    <>
      <span className="text-teal">{icon}</span>
      <span className={pendente ? "text-navy/40" : "text-navy/80"}>{texto}</span>
    </>
  );

  if (href) {
    return (
      <li>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 transition-colors hover:text-teal"
        >
          {conteudo}
        </a>
      </li>
    );
  }

  return <li className="flex items-center gap-3">{conteudo}</li>;
}
