import Image from "next/image";
import Link from "next/link";
import type { Imovel } from "@/types/imovel";
import { formatarValor, formatarArea } from "@/lib/format";

interface Props {
  imovel: Imovel;
  indice?: number;
  /** vertical = card mais alto (para o grid assimétrico) */
  formato?: "horizontal" | "vertical";
}

export function CardImovel({ imovel, indice, formato = "horizontal" }: Props) {
  const capa = imovel.imagens[0];
  const area = formatarArea(imovel.area);

  return (
    <Link
      href={`/imoveis/${imovel.slug}`}
      className="group block"
      aria-label={`Ver imóvel: ${imovel.titulo}`}
    >
      <div
        data-capa
        className={`relative overflow-hidden rounded-2xl bg-sky/30 ${
          formato === "vertical" ? "aspect-[3/4]" : "aspect-[4/3]"
        }`}
      >
        <Image
          src={capa.src}
          alt={capa.alt}
          fill
          sizes="(max-width: 768px) 100vw, 45vw"
          className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.04]"
        />
        {imovel.exemplo && (
          <span className="absolute left-4 top-4 rounded-full bg-navy/80 px-3 py-1 text-xs font-medium uppercase tracking-wide text-beige">
            Exemplo
          </span>
        )}
        {indice != null && (
          <span className="absolute right-4 top-4 font-display text-fluid-sm text-beige/90">
            {String(indice).padStart(2, "0")}
          </span>
        )}
      </div>

      <div data-info className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-fluid-lg font-semibold tracking-tight">
            {imovel.titulo}
          </h3>
          <p className="mt-1 text-fluid-sm text-navy/60">{imovel.localizacao}</p>
        </div>
        <p className="whitespace-nowrap text-fluid-base font-medium text-teal">
          {formatarValor(imovel.valor)}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-fluid-sm text-navy/50">
        {imovel.quartos != null && <span>{imovel.quartos} quartos</span>}
        {imovel.vagas != null && <span>{imovel.vagas} vagas</span>}
        {area && <span>{area}</span>}
      </div>
    </Link>
  );
}
