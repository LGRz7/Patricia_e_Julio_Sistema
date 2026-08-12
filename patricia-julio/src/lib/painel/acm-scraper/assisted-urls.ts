/**
 * assisted-urls.ts — gerador de URLs de busca pré-filtradas no ZAP
 * (e futuros portais). Serve de fallback quando o Playwright falhar
 * — o corretor abre 4 abas prontas, escolhe 4 anúncios, cola no painel.
 *
 * O parser regex do painel (acm-parser.ts) extrai os 9 campos do texto
 * do anúncio.
 */

import { coordenadasDeBairro, normalizarBairro } from "./geolocalizacao"

const CIDADE_URL_SLUG: Record<string, string> = {
  "niteroi":        "rj+niteroi",
  "marica":         "rj+marica",
  "rio de janeiro": "rj+rio-de-janeiro",
  "sao goncalo":    "rj+sao-goncalo",
}

const CIDADE_LOCATION_ID: Record<string, string> = {
  "niteroi":        "BR>Rio de Janeiro>NULL>Niteroi",
  "marica":         "BR>Rio de Janeiro>NULL>Marica",
  "rio de janeiro": "BR>Rio de Janeiro>NULL>Rio de Janeiro",
  "sao goncalo":    "BR>Rio de Janeiro>NULL>Sao Goncalo",
}

export interface UrlAssistida {
  titulo: string
  descricao: string
  href: string
  fonte: "ZAP"
}

export interface AssistedInput {
  cidade: string
  bairro: string
  areaAlvo: number
  quartos?: number
}

/**
 * Retorna 4 URLs de busca no ZAP com filtros diferentes:
 *   1. Bairro exato + área ±25% + quartos exatos
 *   2. Bairro exato + área ±50% (janela maior)
 *   3. Cidade + área ±25% + quartos exatos (fallback bairro)
 *   4. Cidade + área ±40% (janela ampla)
 *
 * O corretor abre as 4, escolhe as melhores em cada e cola o texto no wizard.
 */
export function gerarUrlsAssistidasZap(input: AssistedInput): UrlAssistida[] {
  const cidadeKey = normalizarBairro(input.cidade)
  const cidadeSlug = CIDADE_URL_SLUG[cidadeKey] || "rj+niteroi"
  const locationId = CIDADE_LOCATION_ID[cidadeKey] || "BR>Rio de Janeiro>NULL>Niteroi"
  const coordsCidade = coordenadasDeBairro(input.cidade, "")

  const area = input.areaAlvo

  const janelas: { titulo: string; descricao: string; min: number; max: number; usaBairro: boolean; quartosExatos: boolean }[] = [
    { titulo: `${input.bairro} — janela justa`, descricao: `${Math.max(20, Math.floor(area * 0.75))}-${Math.ceil(area * 1.25)} m² · ${input.quartos ?? "?"} quartos`, min: Math.max(20, Math.floor(area * 0.75)), max: Math.ceil(area * 1.25), usaBairro: true, quartosExatos: true },
    { titulo: `${input.bairro} — janela larga`, descricao: `${Math.max(20, Math.floor(area * 0.5))}-${Math.ceil(area * 1.5)} m² · ${input.quartos ?? "?"} quartos`, min: Math.max(20, Math.floor(area * 0.5)), max: Math.ceil(area * 1.5), usaBairro: true, quartosExatos: true },
    { titulo: `${input.cidade} inteira — mesmos m²`, descricao: `${Math.max(20, Math.floor(area * 0.85))}-${Math.ceil(area * 1.15)} m² · ${input.quartos ?? "?"} quartos`, min: Math.max(20, Math.floor(area * 0.85)), max: Math.ceil(area * 1.15), usaBairro: false, quartosExatos: true },
    { titulo: `${input.cidade} inteira — sem filtro rígido`, descricao: `${Math.max(20, Math.floor(area * 0.6))}-${Math.ceil(area * 1.4)} m² · qualquer quartos`, min: Math.max(20, Math.floor(area * 0.6)), max: Math.ceil(area * 1.4), usaBairro: false, quartosExatos: false },
  ]

  return janelas.map(({ titulo, descricao, min, max, usaBairro, quartosExatos }) => {
    const params: Record<string, string> = {
      transacao: "Venda",
      tipos: "apartamento_residencial",
      areaMinima: String(min),
      areaMaxima: String(max),
    }
    if (quartosExatos && input.quartos && input.quartos > 0) {
      params.quartos = String(input.quartos)
    }

    // Também passa o `onde` que o ZAP usa pra manter mapa consistente
    const ondeParts = [
      "",
      "Rio de Janeiro",
      capitalizar(input.cidade),
      "",
      "",
      "",
      "",
      "city",
      locationId,
      String(coordsCidade.lat),
      String(coordsCidade.lon),
      "",
    ]
    params.onde = ondeParts.join(",")

    const query = new URLSearchParams(params).toString()
    const href = `https://www.zapimoveis.com.br/venda/apartamentos/${cidadeSlug}/?${query}`

    return {
      titulo: usaBairro ? `${input.bairro} — ${descricao.split(" · ")[0]}` : titulo,
      descricao: descricao,
      href,
      fonte: "ZAP" as const,
    }
  })
}

function capitalizar(s: string): string {
  return s.split(" ").map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : "")).join(" ")
}
