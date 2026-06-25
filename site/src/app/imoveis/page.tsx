import type { Metadata } from "next";
import { CardImovel } from "@/components/imovel/CardImovel";
import { imoveis } from "@/data/imoveis";

export const metadata: Metadata = {
  title: "Imóveis",
  description:
    "Imóveis disponíveis com Patrícia e Júlio em São Gonçalo e região. Apartamentos e casas para morar ou investir.",
};

export default function ImoveisPage() {
  return (
    <div className="editorial pt-32 pb-24 md:pt-44 md:pb-32">
      <header className="mb-16 max-w-3xl">
        <p className="mb-5 text-fluid-sm uppercase tracking-[0.25em] text-teal">
          Disponíveis
        </p>
        <h1 className="font-display text-fluid-2xl font-semibold leading-[1.02] tracking-tightest">
          Imóveis
        </h1>
        <p className="mt-6 text-fluid-base text-navy/70">
          Uma seleção de imóveis em São Gonçalo e região. Cada um com
          atendimento direto de quem entende a área.
        </p>
      </header>

      {imoveis.length === 0 ? (
        <p className="text-fluid-base text-navy/60">
          Em breve, novos imóveis por aqui.
        </p>
      ) : (
        <div className="grid gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
          {imoveis.map((imovel, i) => (
            <CardImovel key={imovel.slug} imovel={imovel} indice={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
