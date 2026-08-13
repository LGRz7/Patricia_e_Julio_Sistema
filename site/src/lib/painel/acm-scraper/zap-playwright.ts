/**
 * zap-playwright.ts — versão do scraper que roda a busca dentro de um
 * Chromium headless (Playwright). É a nossa saída pro problema do 403 do
 * Cloudflare: o request sai de um browser real (TLS + JA3 + cookies
 * naturais), então o ZAP nunca sabe que não é um humano.
 *
 * Estratégia:
 *   1. Abre uma página em about:blank
 *   2. Navega direto pra `https://www.zapimoveis.com.br/venda/...` (só pra
 *      ganhar o cookie da sessão) — 3-4s
 *   3. Usa `page.evaluate` pra rodar `fetch(glue-api-url, {...})` DENTRO
 *      do contexto do browser → response 200
 *   4. Faz o parse com a mesma lib da versão HTTP (zap.ts)
 *
 * Singleton do browser pra evitar spawn em cada request. Fecha depois de
 * 5 min de inatividade. Custa uns 200 MB residentes enquanto vivo.
 */
import "server-only"
import type { Browser, BrowserContext } from "playwright-core"
import { coordenadasDeBairro, normalizarBairro } from "./geolocalizacao"
import type { BuscaComparaveisInput, ComparavelZap } from "./zap"

const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)

/**
 * Chromium dual-mode:
 *  - Serverless (Vercel) → `playwright-core` + `@sparticuz/chromium` (~50MB slim otimizado pro Lambda).
 *    Não usa stealth porque playwright-extra depende do full playwright (não roda no bundle da Vercel).
 *  - Dev local / VPS      → `playwright-extra` + stealth plugin (patcheia ~20 pontos de detecção).
 *
 * Sem esse dual-mode, o launch trava sem browser instalado.
 */
async function launchChromium(): Promise<Browser> {
  if (isServerless) {
    console.log("[zap-playwright] modo serverless — subindo sparticuz Chromium")
    const [{ chromium: pwCore }, sparticuzModule] = await Promise.all([
      import("playwright-core"),
      import("@sparticuz/chromium"),
    ])
    const sparticuz = (sparticuzModule as { default?: typeof sparticuzModule }).default ?? sparticuzModule
    // @ts-expect-error — sparticuz tem tipos frouxos entre versões
    const executablePath = await sparticuz.executablePath()
    if (!executablePath) {
      throw new Error("sparticuz executablePath vazio (binário não copiado pra lambda?)")
    }
    console.log("[zap-playwright] executablePath:", executablePath)
    return pwCore.launch({
      // @ts-expect-error — args do sparticuz
      args: sparticuz.args,
      executablePath,
      headless: true,
    })
  }

  // Ambiente local: full playwright + stealth
  try {
    const { chromium } = await import("playwright-extra") as any
    const stealthMod = await import("puppeteer-extra-plugin-stealth") as any
    const stealth = (stealthMod.default || stealthMod)()
    chromium.use(stealth)
    const launchOpts = {
      headless: true,
      args: [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-features=IsolateOrigins,site-per-process",
      ],
    }
    try {
      const browser = await chromium.launch({ ...launchOpts, channel: "chrome" })
      console.log("[zap-playwright] local Chrome do sistema + stealth")
      return browser
    } catch {
      const browser = await chromium.launch(launchOpts)
      console.log("[zap-playwright] local Chromium bundled + stealth")
      return browser
    }
  } catch (e) {
    console.warn("[zap-playwright] stealth indisponível, usando playwright-core puro:", (e as Error).message)
    const { chromium: pwCore } = await import("playwright-core")
    return pwCore.launch({ headless: true })
  }
}

// ============================================================
// Singleton do browser
// ============================================================
interface BrowserPool {
  browser: Browser
  context: BrowserContext
  createdAt: number
  destroyTimer: NodeJS.Timeout | null
}

let pool: BrowserPool | null = null
// Em serverless, o "singleton" só serve enquanto a lambda está warm — o
// container é destruído após ~15 min de inatividade de qualquer jeito.
const IDLE_MS = isServerless ? 90 * 1000 : 5 * 60 * 1000

async function getContext(): Promise<BrowserContext> {
  if (pool && pool.browser.isConnected()) {
    resetIdle()
    return pool.context
  }

  const browser = await launchChromium()
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    viewport: { width: 1366, height: 900 },
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    extraHTTPHeaders: {
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    },
  })

  pool = { browser, context, createdAt: Date.now(), destroyTimer: null }
  resetIdle()
  return context
}

function resetIdle() {
  if (!pool) return
  if (pool.destroyTimer) clearTimeout(pool.destroyTimer)
  pool.destroyTimer = setTimeout(async () => {
    if (!pool) return
    try { await pool.browser.close() } catch { /* ignore */ }
    pool = null
  }, IDLE_MS)
}

// A gente NÃO faz warm-up separado. O fetch precisa rodar dentro de uma página
// com origin `zapimoveis.com.br` — se sair de `about:blank`, o request cross-origin
// dispara preflight CORS que o ZAP não responde. Solução: navegar direto pra
// zapimoveis.com.br e fazer o fetch DE DENTRO dela.

// ============================================================
// Constantes de API (mesmas de zap.ts)
// ============================================================
const API_BASE = "https://glue-api.zapimoveis.com.br/v2/listings"
const INCLUDE_FIELDS = [
  "search(result(",
  "listings(",
  "listing(id,title,description,address,pricingInfos,bedrooms,bathrooms,parkingSpaces,suites,usableAreas,totalAreas,unitTypes),",
  "link(href),",
  "medias",
  ")),",
  "totalCount)",
].join("")

const CIDADE_LOCATION_ID: Record<string, string> = {
  "niteroi":         "BR>Rio de Janeiro>NULL>Niteroi",
  "marica":          "BR>Rio de Janeiro>NULL>Marica",
  "rio de janeiro":  "BR>Rio de Janeiro>NULL>Rio de Janeiro",
  "sao goncalo":     "BR>Rio de Janeiro>NULL>Sao Goncalo",
}

// ============================================================
// Entry point
// ============================================================
export async function buscarComparaveisZapPlaywright(input: BuscaComparaveisInput): Promise<{
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
    addressState: "Rio de Janeiro",
    addressNeighborhood: "",
    addressPointLat: String(coords.lat),
    addressPointLon: String(coords.lon),
    addressType: "city",
    unitTypes: "APARTMENT",
    unitTypesV3: "APARTMENT",
    unitSubTypes: "UnitSubType_NONE,DUPLEX,TRIPLEX",
    usageTypes: "RESIDENTIAL",
    page: "1",
    size: String(size * 3),
    from: "0",
    includeFields: INCLUDE_FIELDS,
    minArea: String(minArea),
    maxArea: String(maxArea),
  }
  if (input.quartos && input.quartos > 0) params.bedrooms = String(input.quartos)

  const url = new URL(API_BASE)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const fullUrl = url.toString()

  let context: BrowserContext
  try {
    context = await getContext()
  } catch (e) {
    return { comparaveis: [], totalDisponivel: 0, usouFallbackCidade, erro: `chromium não pôde subir: ${(e as Error).message}` }
  }

  // URL pública com filtros — o browser do ZAP vai naturalmente chamar
  // a Glue API pra popular. A gente só INTERCEPTA a response.
  const publicSearchUrl = montarUrlPublicaZap(input, params.addressLocationId, coords)

  const page = await context.newPage()
  let data: unknown = null
  let erro: string | undefined

  // Coleta TODAS as responses da glue-api enquanto a página carrega.
  // A maior é a que tem os listings de fato (as menores são facets/totalCount).
  const responses: { url: string; body: string; len: number }[] = []
  page.on("response", async (resp) => {
    const u = resp.url()
    if (!u.startsWith("https://glue-api.zapimoveis.com.br/v2/listings")) return
    if (resp.status() !== 200) return
    try {
      const body = await resp.text()
      responses.push({ url: u, body, len: body.length })
    } catch {
      // ignore
    }
  })

  try {
    const gotoRes = await page.goto(publicSearchUrl, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    })
    console.log("[zap-playwright] goto status:", gotoRes?.status())

    // Scroll pra disparar lazy load dos cards (o ZAP não carrega tudo no primeiro paint).
    try {
      for (let i = 0; i < 4; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.5))
        await page.waitForTimeout(600)
      }
    } catch { /* ignore scroll errors */ }

    // Espera até 20s pra a página carregar todos os listings.
    // A "boa" (com listings de verdade) costuma ser >8kb.
    const inicio = Date.now()
    let debugLog = 0
    while (Date.now() - inicio < 20000) {
      await page.waitForTimeout(500)
      const maior = responses.length ? Math.max(...responses.map((r) => r.len)) : 0
      if (responses.length !== debugLog) {
        console.log(`[zap-playwright] ${responses.length} responses so far, maior ${maior}b`)
        debugLog = responses.length
      }
      if (maior > 8000) break
    }

    if (responses.length === 0) {
      erro = "nenhuma resposta interceptada"
    } else {
      // Filtra pra responses que provavelmente têm listings (>5kb + contém "listings")
      const comListings = responses.filter((r) =>
        r.len > 5000 && (r.body.includes('"listings"') || r.body.includes('"listing":'))
      )
      const escolha = comListings.length ? comListings : responses
      escolha.sort((a, b) => b.len - a.len)
      const melhor = escolha[0]
      console.log(`[zap-playwright] ${responses.length} total, ${comListings.length} com listings, escolhida ${melhor.len} bytes`)
      try { data = JSON.parse(melhor.body) }
      catch { erro = "resposta não é JSON" }
    }
  } catch (e) {
    if (!erro) erro = (e as Error).message
    console.log("[zap-playwright] outer error:", erro)
  } finally {
    await page.close()
  }

  if (erro || !data) {
    return { comparaveis: [], totalDisponivel: 0, usouFallbackCidade, erro }
  }

  const listings = extrairListings(data)
  const totalDisponivel = extrairTotalCount(data)

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
// URL pública do ZAP (a que o browser navega — dispara a Glue API)
// ============================================================
function montarUrlPublicaZap(
  input: BuscaComparaveisInput,
  locationId: string,
  coords: { lat: number; lon: number },
): string {
  const cidadeSlug = normalizarBairro(input.cidade).replace(/\s+/g, "-")
  const minArea = Math.max(20, Math.floor(input.areaAlvo * 0.75))
  const maxArea = Math.ceil(input.areaAlvo * 1.25)

  const params = new URLSearchParams({
    transacao: "Venda",
    tipos: "apartamento_residencial",
    areaMinima: String(minArea),
    areaMaxima: String(maxArea),
  })
  if (input.quartos && input.quartos > 0) params.set("quartos", String(input.quartos))

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
    String(coords.lat),
    String(coords.lon),
    "",
  ]
  params.set("onde", ondeParts.join(","))

  return `https://www.zapimoveis.com.br/venda/apartamentos/rj+${cidadeSlug}/?${params.toString()}`
}

// ============================================================
// Parsing (mesmas funções da versão HTTP — separadas em módulo comum
// seria ideal, mas mantendo pra não refatorar dois arquivos ao mesmo tempo)
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
  const pricing = (pricingInfos.find((p: any) => p?.businessType === "SALE") || pricingInfos[0] || {}) as Record<string, unknown>

  const preco = toNum(pricing?.price)
  const area = toNum(getArr(listing, "usableAreas")[0]) || toNum(getArr(listing, "totalAreas")[0])
  if (!preco || !area) return null

  const address = (getObj(listing, "address") || {}) as Record<string, unknown>
  const bairro = str(address.neighborhood) || ""
  const rua = str(address.street) || ""
  const numero = str(address.streetNumber) || ""
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
    quartos: toInt(getArr(listing, "bedrooms")[0]),
    banheiros: toInt(getArr(listing, "bathrooms")[0]),
    vagas: toInt(getArr(listing, "parkingSpaces")[0]),
    suites: toInt(getArr(listing, "suites")[0]) || undefined,
    condominio: toNum(pricing?.monthlyCondoFee) || undefined,
    iptu: toNum(pricing?.yearlyIptu) || undefined,
    observacoes: truncarObs(str(getStr(listing, "title")) || ""),
    precoM2: area > 0 ? preco / area : 0,
    idOriginal: str(getStr(listing, "id")) || undefined,
  }
}

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
  return toNum((x as Record<string, unknown>)[k]) ?? null
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
  return s.split(" ").map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : "")).join(" ")
}
