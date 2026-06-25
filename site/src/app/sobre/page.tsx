import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { profissionais } from "@/data/profissionais";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "Conheça Patrícia Vidal e Júlio Aguiar, corretores de imóveis em São Gonçalo e região.",
};

export default function SobrePage() {
  return (
    <div className="pt-32 md:pt-44">
      <header className="editorial max-w-3xl">
        <p className="mb-5 text-fluid-sm uppercase tracking-[0.25em] text-teal">
          Quem somos
        </p>
        <h1 className="font-display text-fluid-2xl font-semibold leading-[1.02] tracking-tightest">
          Atendimento de gente, não de balcão.
        </h1>
        <p className="mt-6 text-fluid-base text-navy/70">
          Patrícia e Júlio atuam juntos na corretagem de imóveis em{" "}
          {site.regiao}. O foco é simples: entender o que você procura e
          conduzir cada negociação com clareza e segurança.
        </p>
      </header>

      <div className="editorial mt-20 space-y-24 pb-28 md:space-y-32 md:pb-36">
        {profissionais.map((p, i) => (
          <section
            key={p.id}
            className={`grid items-center gap-10 md:grid-cols-2 md:gap-16 ${
              i % 2 === 1 ? "md:[&>div:first-child]:order-2" : ""
            }`}
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sky/30">
              <Image
                src={p.foto}
                alt={p.fotoAlt}
                fill
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="font-display text-fluid-xl font-semibold tracking-tight">
                {p.nome}
              </h2>
              <p className="mt-1 text-fluid-base text-teal">
                {p.papel} · {p.creci}
              </p>
              <p className="mt-5 max-w-md text-fluid-base leading-relaxed text-navy/80">
                {p.bio}
              </p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {p.especialidades.map((e) => (
                  <li
                    key={e}
                    className="rounded-full border border-navy/15 px-3 py-1 text-fluid-sm text-navy/70"
                  >
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>

      <section className="border-t border-navy/10 bg-beige">
        <div className="editorial flex flex-col items-start gap-6 py-20 md:flex-row md:items-center md:justify-between md:py-24">
          <h2 className="font-display text-fluid-xl font-semibold tracking-tight">
            Quer conversar com a gente?
          </h2>
          <Link
            href="/contato"
            className="rounded-full bg-navy px-7 py-3.5 text-fluid-sm font-medium text-beige transition-colors hover:bg-ink"
          >
            Falar com a gente
          </Link>
        </div>
      </section>
    </div>
  );
}
