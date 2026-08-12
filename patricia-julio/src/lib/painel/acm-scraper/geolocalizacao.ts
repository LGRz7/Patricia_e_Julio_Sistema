/**
 * geolocalizacao.ts — mapa hardcoded bairro→coordenadas dos bairros que
 * Patrícia e Júlio atendem (Niterói, Maricá, Rio).
 *
 * O ZAP aceita busca por lat/lon + raio, então mesmo sem o `addressLocationId`
 * mágico deles a gente consegue pesquisar. Se o bairro não estiver no mapa,
 * cai pra busca por cidade e filtra client-side.
 *
 * TODO(siai): expandir esse mapa via Nominatim (já usado no /painel/mapa) ou
 * via cache dinâmico quando um novo bairro for buscado.
 */

export interface BairroInfo {
  bairro: string
  cidade: string
  lat: number
  lon: number
  /** LocationId do ZAP quando conhecido (opcional). */
  zapLocationId?: string
}

/** Chave: "cidade|bairro" lowercase sem acentos. */
export type BairroKey = string

function keyOf(cidade: string, bairro: string): BairroKey {
  return (
    (cidade + "|" + bairro)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
  )
}

// ============================================================
// Base de bairros conhecidos
// ============================================================
const BAIRROS: BairroInfo[] = [
  // Niterói
  { bairro: "Icaraí",       cidade: "Niterói", lat: -22.9008, lon: -43.1071 },
  { bairro: "Ingá",         cidade: "Niterói", lat: -22.8969, lon: -43.1105 },
  { bairro: "Santa Rosa",   cidade: "Niterói", lat: -22.8946, lon: -43.0929 },
  { bairro: "São Francisco",cidade: "Niterói", lat: -22.9142, lon: -43.0947 },
  { bairro: "Piratininga",  cidade: "Niterói", lat: -22.9422, lon: -43.0700 },
  { bairro: "Camboinhas",   cidade: "Niterói", lat: -22.9525, lon: -43.0453 },
  { bairro: "Itaipu",       cidade: "Niterói", lat: -22.9663, lon: -43.0389 },
  { bairro: "Charitas",     cidade: "Niterói", lat: -22.9260, lon: -43.0929 },
  { bairro: "Jurujuba",     cidade: "Niterói", lat: -22.9297, lon: -43.1121 },
  { bairro: "Fonseca",      cidade: "Niterói", lat: -22.8792, lon: -43.0879 },
  { bairro: "Centro",       cidade: "Niterói", lat: -22.8865, lon: -43.1155 },
  { bairro: "Boa Viagem",   cidade: "Niterói", lat: -22.9070, lon: -43.1229 },
  { bairro: "Barreto",      cidade: "Niterói", lat: -22.8636, lon: -43.0997 },
  { bairro: "Cachoeiras",   cidade: "Niterói", lat: -22.9250, lon: -43.0533 },

  // Maricá
  { bairro: "Centro",           cidade: "Maricá", lat: -22.9192, lon: -42.8189 },
  { bairro: "Itaipuaçu",        cidade: "Maricá", lat: -22.9722, lon: -42.9483 },
  { bairro: "Barra de Maricá",  cidade: "Maricá", lat: -22.9631, lon: -42.8281 },
  { bairro: "Ponta Negra",      cidade: "Maricá", lat: -22.9542, lon: -42.6889 },
  { bairro: "Inoã",             cidade: "Maricá", lat: -22.9219, lon: -42.9633 },
  { bairro: "Manu Manuela",     cidade: "Maricá", lat: -22.9450, lon: -42.7975 },
  { bairro: "Guaratiba",        cidade: "Maricá", lat: -22.9328, lon: -42.7369 },

  // Rio de Janeiro (Zona Norte)
  { bairro: "Tijuca",       cidade: "Rio de Janeiro", lat: -22.9269, lon: -43.2350 },
  { bairro: "Vila Isabel",  cidade: "Rio de Janeiro", lat: -22.9161, lon: -43.2464 },
  { bairro: "Grajaú",       cidade: "Rio de Janeiro", lat: -22.9231, lon: -43.2650 },
  { bairro: "Méier",        cidade: "Rio de Janeiro", lat: -22.9028, lon: -43.2789 },
  { bairro: "Andaraí",      cidade: "Rio de Janeiro", lat: -22.9256, lon: -43.2444 },
  { bairro: "Maracanã",     cidade: "Rio de Janeiro", lat: -22.9128, lon: -43.2325 },
  { bairro: "Cachambi",     cidade: "Rio de Janeiro", lat: -22.8869, lon: -43.2828 },

  // Rio de Janeiro (Zona Oeste)
  { bairro: "Barra da Tijuca", cidade: "Rio de Janeiro", lat: -23.0033, lon: -43.3644 },
  { bairro: "Recreio dos Bandeirantes", cidade: "Rio de Janeiro", lat: -23.0192, lon: -43.4650 },
  { bairro: "Freguesia",   cidade: "Rio de Janeiro", lat: -22.9425, lon: -43.3572 },
  { bairro: "Taquara",     cidade: "Rio de Janeiro", lat: -22.9247, lon: -43.3600 },
  { bairro: "Jacarepaguá", cidade: "Rio de Janeiro", lat: -22.9497, lon: -43.3489 },
]

// Centros das cidades (fallback quando o bairro não está no mapa)
export const CENTROS_CIDADE: Record<string, { lat: number; lon: number }> = {
  "niteroi":         { lat: -22.8807, lon: -43.1014 },
  "marica":          { lat: -22.9192, lon: -42.8189 },
  "rio de janeiro":  { lat: -22.9068, lon: -43.1729 },
  "sao goncalo":     { lat: -22.8267, lon: -43.0537 },
}

const INDEX = new Map<BairroKey, BairroInfo>()
BAIRROS.forEach((b) => INDEX.set(keyOf(b.cidade, b.bairro), b))

/**
 * Retorna coordenadas do bairro, ou centro da cidade como fallback.
 * `sabeBairro` indica se veio do mapa (true) ou é fallback (false).
 */
export function coordenadasDeBairro(cidade: string, bairro: string): {
  lat: number
  lon: number
  sabeBairro: boolean
} {
  const b = INDEX.get(keyOf(cidade, bairro))
  if (b) return { lat: b.lat, lon: b.lon, sabeBairro: true }

  const centro = CENTROS_CIDADE[normalize(cidade)]
  if (centro) return { ...centro, sabeBairro: false }

  // Ultimate fallback: centro do Rio
  return { lat: -22.9068, lon: -43.1729, sabeBairro: false }
}

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
}

/** Normaliza para comparação (lowercase, sem acentos). */
export function normalizarBairro(s: string): string {
  return normalize(s)
}
