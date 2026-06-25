import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { getImovel, imoveis } from "@/data/imoveis";
import { getProfissional } from "@/data/profissionais";
import { Galeria } from "@/components/imovel/Galeria";
import { FichaTecnica } from "@/components/imovel/FichaTecnica";
import { CardImovel } from "@/components/imovel/CardImovel";
import { formatarValor } from "@/lib/format";
import { linkWhatsapp, mensagemInteresseImovel } from "@/lib/whatsapp";

export function generateStaticParams() {
  return imoveis.map((i) => ({ slug: i.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const imovel = getImovel(params.slug);
  if (!imovel) return { title: "Imóvel não encontrado" };
  return {
    title: imovel.titulo,
    description: imovel.resumo,
    openGraph: {
      title: imovel.titulo,
      description: imovel.resumo,
      images: imovel.imagens[0] ? [imovel.imagens[0].src] : undefined,
    },
  };
}

export default function ImovelPage({ params }: { params: { slug: string } }) {
  const imovel = getImovel(params.slug);
  if (!imovel) notFound();

  const responsavel = getProfissional(imovel.responsavel);
  const wa = linkWhatsapp({
    numero: responsavel?.whatsapp,
    mensagem: mensagemInteresseImovel(imovel.titulo),
  });
  const relacionados = imoveis.filter((i) => i.slug !== imovel.slug).slice(0, 2);

  return (
    <article className="pt-28 md:pt-36">
      <div className="editorial">
        <Link
          href="/imoveis"
          className="text-fluid-sm text-navy/60 underline-offset-4 hover:underline"
        >
          ← Voltar para imóveis
        </Link>

        <header className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            {imovel.exemplo && (
              <span className="mb-3 inline-block rounded-full bg-navy/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-navy/60">
                Imóvel de exemplo
              </span>
            )}
            <h1 className="font-display text-fluid-2xl font-semibold leading-[1.03] tracking-tightest">
              {imovel.titulo}
            </h1>
            <p className="mt-3 flex items-center gap-2 text-fluid-base text-navy/60">
              <MapPin size={18} /> {imovel.localizacao}
            </p>
          </div>
          <p className="font-display text-fluid-xl font-semibold text-teal">
            {formatarValor(imovel.valor)}
          </p>
        </header>
      </div>

      <div className="editorial mt-12">
        <Galeria imagens={imovel.imagens} />
        {imovel.maisFotosNoWhatsapp && (
          <a
            href={wa ?? "/contato"}
            {...(wa ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl bg-sky/40 px-6 py-5 text-navy transition-colors hover:bg-sky/60 sm:flex-row sm:items-center"
          >
            <span className="text-fluid-base">
              Quer ver mais fotos deste imóvel?{" "}
              <span className="text-teal">
                Fale com {responsavel ? responsavel.nome.split(" ")[0] : "a consultora"} no WhatsApp.
              </span>
            </span>
            <span className="whitespace-nowrap text-fluid-sm font-medium">
              Pedir mais fotos →
            </span>
          </a>
        )}
      </div>

      <div className="editorial mt-16 grid gap-12 pb-28 md:grid-cols-[1.4fr_0.8fr] md:gap-20 md:pb-36">
        <div>
          <FichaTecnica imovel={imovel} />

          <div className="mt-12">
            <h2 className="font-display text-fluid-lg font-semibold tracking-tight">
              Sobre o imóvel
            </h2>
            <p className="mt-4 max-w-prose text-fluid-base leading-relaxed text-navy/80">
              {imovel.descricao}
            </p>
          </div>

          {imovel.diferenciais.length > 0 && (
            <div className="mt-12">
              <h2 className="font-display text-fluid-lg font-semibold tracking-tight">
                Diferenciais
              </h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {imovel.diferenciais.map((d) => (
                  <li
                    key={d}
                    className="flex items-center gap-3 text-fluid-base text-navy/80"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-teal" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* coluna de contato (sticky) */}
        <aside className="md:sticky md:top-28 md:self-start">
          <div className="rounded-2xl border border-navy/15 p-7">
            <p className="text-fluid-sm uppercase tracking-wide text-navy/40">
              Atendimento
            </p>
            {responsavel && (
              <p className="mt-2 font-display text-fluid-lg font-semibold tracking-tight">
                {responsavel.nome}
                <span className="block text-fluid-sm font-normal text-teal">
                  {responsavel.papel} · {responsavel.creci}
                </span>
              </p>
            )}
            <p className="mt-5 text-fluid-base text-navy/70">
              Agende uma visita ou tire suas dúvidas direto no WhatsApp.
            </p>
            <a
              href={wa ?? "/contato"}
              {...(wa ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-navy px-6 py-3.5 text-fluid-sm font-medium text-beige transition-colors duration-400 ease-editorial hover:bg-ink"
            >
              Conversar no WhatsApp
            </a>
          </div>
        </aside>
      </div>

      {relacionados.length > 0 && (
        <section className="border-t border-navy/10 bg-beige">
          <div className="editorial py-20 md:py-28">
            <h2 className="mb-12 font-display text-fluid-xl font-semibold tracking-tight">
              Outros imóveis
            </h2>
            <div className="grid gap-x-8 gap-y-16 md:grid-cols-2">
              {relacionados.map((i) => (
                <CardImovel key={i.slug} imovel={i} />
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
