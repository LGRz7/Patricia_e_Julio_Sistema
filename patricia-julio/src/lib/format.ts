export function formatarValor(valor: number | null): string {
  if (valor === null) return "Sob consulta";
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function formatarArea(area?: number): string | null {
  if (!area) return null;
  return `${area} m²`;
}
