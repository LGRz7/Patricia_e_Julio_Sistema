import Link from "next/link";
import { categorias } from "@/data/site";

/**
 * Navegação horizontal discreta de categorias (atalhos visuais),
 * inspirada na 3ª referência. Não são botões genéricos — são links
 * editoriais alinhados numa faixa.
 */
export function Categorias() {
  return (
    <section className="border-y border-navy/10 bg-beige">
      <div className="editorial py-10 md:py-12">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-4 md:gap-x-6">
          <span className="mr-4 text-fluid-sm uppercase tracking-[0.25em] text-navy/40">
            Explore
          </span>
          {categorias.map((c) => (
            <Link
              key={c.id}
              href={`/imoveis?categoria=${c.id}`}
              className="rounded-full border border-navy/15 px-5 py-2 text-fluid-base text-navy/80 transition-colors duration-400 ease-editorial hover:border-navy hover:bg-navy hover:text-beige"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
