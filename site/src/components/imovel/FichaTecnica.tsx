import type { Imovel } from "@/types/imovel";
import { formatarArea } from "@/lib/format";

export function FichaTecnica({ imovel }: { imovel: Imovel }) {
  const itens: { label: string; valor: string }[] = [];

  if (imovel.quartos != null) itens.push({ label: "Quartos", valor: String(imovel.quartos) });
  if (imovel.suites != null) itens.push({ label: "Suítes", valor: String(imovel.suites) });
  if (imovel.banheiros != null) itens.push({ label: "Banheiros", valor: String(imovel.banheiros) });
  if (imovel.vagas != null) itens.push({ label: "Vagas", valor: String(imovel.vagas) });
  const area = formatarArea(imovel.area);
  if (area) itens.push({ label: "Área", valor: area });
  itens.push({ label: "Tipo", valor: capitalizar(imovel.tipo) });

  if (itens.length === 0) return null;

  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-6 border-y border-navy/10 py-8 sm:grid-cols-3">
      {itens.map((item) => (
        <div key={item.label}>
          <dt className="text-fluid-sm uppercase tracking-wide text-navy/40">
            {item.label}
          </dt>
          <dd className="mt-1 font-display text-fluid-lg font-medium">
            {item.valor}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function capitalizar(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
