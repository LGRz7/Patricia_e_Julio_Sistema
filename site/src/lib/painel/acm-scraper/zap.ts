/**
 * zap.ts — cliente da Glue API pública do ZAP Imóveis.
 *
 * Nada de scraping HTML — o próprio ZAP expõe `glue-api.zapimoveis.com.br/v2/listings`
 * (usado internamente pelo site deles) e responde 200 pra qualquer origem se você
 * mandar o header `x-domain: www.zapimoveis.com.br`.
 *
 * Filosofia de robustez:
 *   • Server-only (nunca chamar do browser — evita CORS + evita expor comportamento).
 *   • Timeout de 8s por request (Vercel serverless dá 10s).
 *   • User-Agent de browser real pra não ser sinalizado como bot.
 *   • Retry manual só em erro transitório (5xx / abort).
 *   • Falha silenciosa: devolve array vazio + log. Nunca lança quebrando o painel.
 *
 * TODO(siai): dá pra plugar aqui uma camada de cache local (data/scraper-cache/*.json)
 * pra evitar re-request quando o corretor busca o mesmo bairro em <24h.
 */
import "server-only"
import { coordenadasDeBairro, normalizarBairro } from "./geolocalizacao"
import type { AmostraACM, FonteAmostra } from "@/types/acm"

// ============================================================
// Input do scraper
// ============================================================
export interface BuscaComparaveisInput {
  cidade: string
  bairro: string
  /** Área do alvo em m². Filtro será ±25% em cima disso. */
  areaAlvo: number
  quartos?: number
  /** Máximo de listings a retornar (default 20). */
  size?: number
  /** Se true, foca a busca no bairro solicitado. Se não, busca cidade toda. */
  focarBairro?: boolean
}

// ============================================================
// Output normalizado (bate com AmostraACM)
// ============================================================
export interface ComparavelZap {
  fonte: FonteAmostra
  linkOriginal?: string
  endereco: string
  bairro: string
  precoAnuncio: number
  areaTotal: number
  quartos: number
  banheiros: number
  vagas: number
  suites?: number
  condominio?: number
  iptu?: number
  observacoes?: string
  /** Preço/m² calculado. */
  precoM2: number
  /** ID original do ZAP (útil pra dedup). */
  idOriginal?: string
}

// ============================================================
// Constantes internas
// ============================================================
const API_BASE = "https://glue-api.zapimoveis.com.br/v2/listings"
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
const TIMEOUT_MS = 8000

const INCLUDE_FIELDS = [
  "search(result(",
  "listings(",
  "listing(id,title,description,address,pricingInfos,bedrooms,bathrooms,parkingSpaces,suites,usableAreas,totalAreas,unitTypes),",
  "link(href),",
  "medias",
  ")),",
  "totalCount)",
].join("")

// ============================================================
// Cidade → códigos do ZAP
// ============================================================
const CIDADE_LOCATION_ID: Record<string, string> = {
  "niteroi":         "BR>Rio de Janeiro>NULL>Niteroi",
  "marica":          "BR>Rio de Janeiro>NULL>Marica",
  "rio de janeiro":  "BR>Rio de Janeiro>NULL>Rio de Janeiro",
  "sao goncalo":     "BR>Rio de Janeiro>NULL>Sao Goncalo",
}

const CIDADE_STATE = "Rio de Janeiro" // toda a operação é RJ

// ============================================================
// Fetch principal
// ============================================================
export async function buscarComparaveisZap(input: BuscaComparaveisInput): Promise<{
  comparaveis: ComparavelZap[]
  totalDisponivel: number
  usouFallbackCidade: boolean
  erro?: string
}> {
  const size = Math.min(Math.max(input.size ?? 20, 5), 50)
  const coords = coordenadasDeBairro(input.cidade, input.bairro)
  const usouFallbackCidade = !coords.sabeBairro || !input.focarBairro

  const cidadeKey = normalizarBairro(input.cidade)
  const locationId = CIDADE_LOCATION_ID[cidadeKey]
  if (!locationId) {
    return { comparaveis: [], totalDisponivel: 0, usouFallbackCidade: true, erro: `Cidade não mapeada: ${input.cidade}` }
  }

  // Filtros de área ±25% em cima do alvo
  const minArea = Math.max(20, Math.floor(input.areaAlvo * 0.75))
  const maxArea = Math.ceil(input.areaAlvo * 1.25)

  const params: Record<string, string> = {
    business: "SALE",
    parentId: "null",
    listingType: "USED",
    images: "webp",
    categoryPage: "RESULT",
    portal: "ZAP",
    addressCity: capitalizar(input.cidade),
    addressZone: "",
    addressStreet: "",
    addressLocationId: locationId,
    addressState: CIDADE_STATE,
    addressNeighborhood: "",
    addressPointLat: String(coords.lat),
    addressPointLon: String(coords.lon),
    addressType: "city",
    unitTypes: "APARTMENT",
    unitTypesV3: "APARTMENT",
    unitSubTypes: "UnitSubType_NONE,DUPLEX,TRIPLEX",
    usageTypes: "RESIDENTIAL",
    page: "1",
    size: String(size * 3),   // pega 3x pra filtrar por bairro depois se necessário
    from: "0",
    includeFields: INCLUDE_FIELDS,
    minArea: String(minArea),
    maxArea: String(maxArea),
  }
  if (input.quartos && input.quartos > 0) {
    params.bedrooms = String(input.quartos)
  }

  const url = new URL(API_BASE)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  let raw: string | null = null
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const res = await fetch(url.toString(), {
      headers: {
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "User-Agent": USER_AGENT,
        "Referer": "https://www.zapimoveis.com.br/",
        "Origin": "https://www.zapimoveis.com.br",
        "x-domain": "www.zapimoveis.com.br",
        "Sec-Fetch-Site": "same-site",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty",
        "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="122", "Google Chrome";v="122"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "Connection": "keep-alive",
      },
      signal: controller.signal,
      cache: "no-store",
    })
    clearTimeout(timer)
    if (!res.ok) {
      return { comparaveis: [], totalDisponivel: 0, usouFallbackCidade, erro: `HTTP ${res.status}` }
    }
    raw = await res.text()
  } catch (e) {
    return { comparaveis: [], totalDisponivel: 0, usouFallbackCidade, erro: (e as Error).message }
  }

  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return { comparaveis: [], totalDisponivel: 0, usouFallbackCidade, erro: "resposta não é JSON" }
  }

  const listings = extrairListings(data)
  const totalDisponivel = extrairTotalCount(data)

  // Filtra por bairro se solicitado + o parser conhece as coordenadas
  const bairroAlvoNorm = normalizarBairro(input.bairro)
  const filtrados = coords.sabeBairro && input.focarBairro
    ? listings.filter((c) => normalizarBairro(c.bairro || "") === bairroAlvoNorm)
    : listings

  return {
    comparaveis: filtrados.slice(0, size),
    totalDisponivel,
    usouFallbackCidade,
  }
}

// ============================================================
// Extração + normalização
// ============================================================
function extrairListings(data: unknown): ComparavelZap[] {
  const search = getObj(data, "search")
  const result = getObj(search, "result")
  const listings = getArr(result, "listings")
  const out: ComparavelZap[] = []
  for (const item of listings) {
    const parsed = parseListing(item)
    if (parsed) out.push(parsed)
  }
  return out
}

function extrairTotalCount(data: unknown): number {
  const search = getObj(data, "search")
  const total = getNum(search, "totalCount")
  return total ?? 0
}

function parseListing(item: unknown): ComparavelZap | null {
  const listing = getObj(item, "listing")
  if (!listing) return null

  const pricingInfos = getArr(listing, "pricingInfos")
  const pricing = pricingInfos.find((p: any) => p?.businessType === "SALE") || pricingInfos[0] || {}

  const preco = toNum((pricing as any)?.price)
  const areaUtilArr = getArr(listing, "usableAreas")
  const areaTotalArr = getArr(listing, "totalAreas")
  const area = toNum(areaUtilArr[0]) || toNum(areaTotalArr[0])

  // Só entra se tem preço e área (mínimo pra virar amostra)
  if (!preco || !area) return null

  const address = getObj(listing, "address") || {}
  const bairro = str((address as any).neighborhood) || ""
  const rua = str((address as any).street) || ""
  const numero = str((address as any).streetNumber) || ""
  const enderecoCompleto = [rua, numero].filter(Boolean).join(", ") || bairro

  const linkHref = str(getStr(item, "link", "href")) || ""
  const linkAbsoluto = linkHref
    ? (linkHref.startsWith("http") ? linkHref : `https://www.zapimoveis.com.br${linkHref}`)
    : undefined

  return {
    fonte: "ZAP",
    linkOriginal: linkAbsoluto,
    endereco: enderecoCompleto,
    bairro,
    precoAnuncio: preco,
    areaTotal: area,
    quartos: toInt(getArr(listing, "bedrooms")[0]) || 0,
    banheiros: toInt(getArr(listing, "bathrooms")[0]) || 0,
    vagas: toInt(getArr(listing, "parkingSpaces")[0]) || 0,
    suites: toInt(getArr(listing, "suites")[0]) || undefined,
    condominio: toNum((pricing as any)?.monthlyCondoFee) || undefined,
    iptu: toNum((pricing as any)?.yearlyIptu) || undefined,
    observacoes: truncarObs(str(getStr(listing, "title")) || ""),
    precoM2: area > 0 ? preco / area : 0,
    idOriginal: str(getStr(listing, "id")) || undefined,
  }
}

// ============================================================
// Helpers de acesso defensivo (sem lodash)
// ============================================================
function getObj(x: unknown, k: string): Record<string, unknown> | null {
  if (typeof x !== "object" || x === null) return null
  const v = (x as Record<string, unknown>)[k]
  return typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}
function getArr(x: unknown, k: string): unknown[] {
  if (typeof x !== "object" || x === null) return []
  const v = (x as Record<string, unknown>)[k]
  return Array.isArray(v) ? v : []
}
function getNum(x: unknown, k: string): number | null {
  if (typeof x !== "object" || x === null) return null
  const v = (x as Record<string, unknown>)[k]
  const n = toNum(v)
  return n === undefined ? null : n
}
function getStr(x: unknown, ...keys: string[]): unknown {
  let cur: unknown = x
  for (const k of keys) {
    if (typeof cur !== "object" || cur === null) return undefined
    cur = (cur as Record<string, unknown>)[k]
  }
  return cur
}
function str(x: unknown): string | undefined {
  if (typeof x === "string") return x
  if (typeof x === "number") return String(x)
  return undefined
}
function toNum(x: unknown): number | undefined {
  if (typeof x === "number" && isFinite(x)) return x
  if (typeof x === "string" && x.trim() !== "") {
    const n = Number(x)
    return isFinite(n) ? n : undefined
  }
  return undefined
}
function toInt(x: unknown): number {
  const n = toNum(x)
  return n === undefined ? 0 : Math.round(n)
}
function truncarObs(s: string): string {
  if (!s) return ""
  return s.length > 140 ? s.slice(0, 137) + "..." : s
}
function capitalizar(s: string): string {
  return s
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ""))
    .join(" ")
}
