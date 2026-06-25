import Link from "next/link";

export default function NotFound() {
  return (
    <div className="editorial flex min-h-[70vh] flex-col items-start justify-center py-32">
      <p className="font-display text-fluid-mono font-semibold leading-none tracking-tightest text-sky">
        404
      </p>
      <h1 className="mt-6 font-display text-fluid-xl font-semibold tracking-tight">
        Página não encontrada
      </h1>
      <p className="mt-4 max-w-md text-fluid-base text-navy/70">
        O endereço que você procurou não existe ou foi movido. Vamos voltar
        para um lugar conhecido.
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href="/"
          className="rounded-full bg-navy px-7 py-3.5 text-fluid-sm font-medium text-beige transition-colors hover:bg-ink"
        >
          Voltar ao início
        </Link>
        <Link
          href="/imoveis"
          className="rounded-full border border-navy/30 px-7 py-3.5 text-fluid-sm font-medium text-navy transition-colors hover:bg-navy hover:text-beige"
        >
          Ver imóveis
        </Link>
      </div>
    </div>
  );
}
