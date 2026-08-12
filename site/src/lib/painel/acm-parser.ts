/**
 * acm-parser.ts — extração via regex do texto colado de portais imobiliários.
 *
 * Filosofia (regra arquitetural do MazyOS): o painel NÃO chama IA externa.
 * O parser aqui é regex simples que cobre os padrões óbvios (R$, m², "quartos").
 * O que ele não pegar, o corretor completa manualmente. Extração inteligente
 * completa (ex.: entender "3 dorms sendo 1 suíte") fica pro MazyOS offline.
 */

export interface ParsedAmostra {
  precoAnuncio?: number
  areaTotal?: number
  quartos?: number
  suites?: number
  banheiros?: number
  vagas?: number
  condominio?: number
  iptu?: number
  fonteSugerida?: string   // "ZAP", "VivaReal", "OLX", etc — deduzido do texto
  linkSugerido?: string    // primeiro http(s):// que encontrar
  bairroSugerido?: string  // primeira linha que parecer bairro
}

/** Converte "R$ 1.250.000,00" ou "1.250.000" em número (1250000). */
function parseCurrency(raw: string): number | undefined {
  if (!raw) return undefined
  // Remove "R$", espaços, e não-dígitos exceto vírgula e ponto
  const cleaned = raw.replace(/[R$\s]/gi, "").replace(/\./g, "").replace(",", ".")
  const n = parseFloat(cleaned)
  return isFinite(n) && n > 0 ? n : undefined
}

/** Converte "120,5" ou "120.5" ou "120" em número. */
function parseArea(raw: string): number | undefined {
  if (!raw) return undefined
  const cleaned = raw.replace(",", ".").trim()
  const n = parseFloat(cleaned)
  return isFinite(n) && n > 0 ? n : undefined
}

/** Extrai o primeiro grupo de captura de um regex, ou undefined. */
function firstMatch(texto: string, regex: RegExp): string | undefined {
  const m = texto.match(regex)
  return m?.[1]?.trim()
}

/**
 * Extrai os campos numéricos e sugestões do texto colado.
 * Nunca lança — retorna só o que conseguiu identificar.
 */
export function parseAmostraTexto(textoBruto: string): ParsedAmostra {
  if (!textoBruto || typeof textoBruto !== "string") return {}
  const t = textoBruto

  // Preço: pega o MAIOR "R$ X" que aparecer (evita pegar taxa de condomínio pequeno como preço)
  const precosBrutos = Array.from(t.matchAll(/R\$\s*([\d.]+(?:,\d{2})?)/gi))
    .map((m) => parseCurrency(m[1]))
    .filter((n): n is number => typeof n === "number")
  const precoAnuncio = precosBrutos.length > 0 ? Math.max(...precosBrutos) : undefined

  // Condomínio: procura por "condomínio: R$ X" ou "cond. R$ X"
  const condominioRaw = firstMatch(t, /condom[íi]nio[:\s]*R?\$?\s*([\d.]+(?:,\d{2})?)/i)
  const condominio = condominioRaw ? parseCurrency(condominioRaw) : undefined

  // IPTU: "IPTU: R$ X" ou "IPTU R$ X"
  const iptuRaw = firstMatch(t, /IPTU[:\s]*R?\$?\s*([\d.]+(?:,\d{2})?)/i)
  const iptu = iptuRaw ? parseCurrency(iptuRaw) : undefined

  // Área: "120 m²", "120m2", "120 m2"
  const areaRaw = firstMatch(t, /(\d+(?:[,.]\d+)?)\s*m[²2]/i)
  const areaTotal = areaRaw ? parseArea(areaRaw) : undefined

  // Quartos: "3 quartos", "3 dormitórios", "3 dorm", "3 qto"
  const quartosRaw = firstMatch(t, /(\d+)\s*(?:quartos?|dormit[óo]rios?|dorms?|qtos?)/i)
  const quartos = quartosRaw ? parseInt(quartosRaw, 10) : undefined

  // Suítes: "1 suíte", "2 suítes"
  const suitesRaw = firstMatch(t, /(\d+)\s*su[íi]tes?/i)
  const suites = suitesRaw ? parseInt(suitesRaw, 10) : undefined

  // Banheiros: "2 banheiros", "2 banh"
  const banheirosRaw = firstMatch(t, /(\d+)\s*banh(?:eiros?|s)?/i)
  const banheiros = banheirosRaw ? parseInt(banheirosRaw, 10) : undefined

  // Vagas: "1 vaga", "2 vagas", "2 garagens"
  const vagasRaw = firstMatch(t, /(\d+)\s*(?:vagas?|garagens?)/i)
  const vagas = vagasRaw ? parseInt(vagasRaw, 10) : undefined

  // Detectar fonte pelo domínio do link ou por menções
  const linkMatch = t.match(/https?:\/\/[^\s]+/i)
  const linkSugerido = linkMatch?.[0]
  let fonteSugerida: string | undefined
  const tLower = t.toLowerCase()
  if (tLower.includes("zapimoveis") || tLower.includes("zap imóveis") || tLower.includes(" zap ")) fonteSugerida = "ZAP"
  else if (tLower.includes("vivareal")) fonteSugerida = "VivaReal"
  else if (tLower.includes("olx.com.br") || tLower.includes(" olx ")) fonteSugerida = "OLX"
  else if (tLower.includes("chaves na mão") || tLower.includes("chavesnamao")) fonteSugerida = "Chaves na Mão"
  else if (tLower.includes("quintoandar")) fonteSugerida = "QuintoAndar"
  else if (tLower.includes("loft.com")) fonteSugerida = "Loft"

  return {
    precoAnuncio,
    areaTotal,
    quartos,
    suites,
    banheiros,
    vagas,
    condominio,
    iptu,
    fonteSugerida,
    linkSugerido,
  }
}

/** Quais campos o parser deixou sem preencher (pra UI destacar). */
export function camposFaltantes(parsed: ParsedAmostra): string[] {
  const faltando: string[] = []
  if (parsed.precoAnuncio === undefined) faltando.push("precoAnuncio")
  if (parsed.areaTotal === undefined) faltando.push("areaTotal")
  if (parsed.quartos === undefined) faltando.push("quartos")
  if (parsed.banheiros === undefined) faltando.push("banheiros")
  if (parsed.vagas === undefined) faltando.push("vagas")
  return faltando
}
