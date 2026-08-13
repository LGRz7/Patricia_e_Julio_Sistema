/**
 * Orquestrador do scraper. Ordem de tentativa:
 *
 *   1. Playwright (chromium real) — passa TLS/Cloudflare, 100% automático
 *   2. HTTP fetch cru — bem mais leve, funciona quando Cloudflare não bloqueia
 *   3. Fallback: retorna URLs assistidas pro corretor abrir 4 abas prontas
 *
 * Assim, se a máquina/ambiente não tiver Playwright disponível (Vercel free
 * tier, container sem Chromium, etc), o painel ainda funciona no modo assisted.
 *
 * TODO(siai): quando VivaReal e OLX entrarem, `buscarTodasFontes` orquestra
 * todos em paralelo aqui.
 */
import "server-only"
import type { BuscaComparaveisInput, ComparavelZap } from "./zap"
import { buscarComparaveisZap } from "./zap"
import { gerarUrlsAssistidasZap, type UrlAssistida, type AssistedInput } from "./assisted-urls"

export type ScraperMode = "playwright" | "http" | "assisted"

export interface ScraperResultado {
  comparaveis: ComparavelZap[]
  totalDisponivel: number
  usouFallbackCidade: boolean
  modo: ScraperMode
  erro?: string
  urlsAssistidas?: UrlAssistida[]
}

/**
 * Playwright habilitado por padrão em qualquer ambiente — o `zap-playwright.ts`
 * é dual-mode: usa `@sparticuz/chromium` na Vercel e full Playwright localmente.
 *
 * Se algo quebrar em produção (ex: sparticuz sobe o Chromium mas o ZAP muda
 * fingerprinting e bloqueia), pode desligar rapidamente via `PLAYWRIGHT_ACM=0`
 * no dashboard da Vercel.
 */
function playwrightHabilitado(): boolean {
  if (process.env.PLAYWRIGHT_ACM === "0") return false
  return true
}

/**
 * Timeout global do playwright pra não travar o serverless.
 * Retorna `{ erro }` em caso de falha (em vez de null) pra o caller poder
 * bolhar o motivo pro frontend.
 */
async function tentarPlaywright(
  input: BuscaComparaveisInput,
): Promise<ScraperResultado | { erroPlaywright: string } | null> {
  if (!playwrightHabilitado()) {
    console.info("[scraper] Playwright pulado (PLAYWRIGHT_ACM=0)")
    return null
  }
  try {
    // Import dinâmico pra não quebrar build em ambiente sem playwright instalado
    const mod = await import("./zap-playwright").catch((e) => {
      console.warn("[scraper] import zap-playwright falhou:", (e as Error).message)
      return null
    })
    if (!mod?.buscarComparaveisZapPlaywright) {
      return { erroPlaywright: "modulo zap-playwright indisponivel" }
    }

    // Corta em 28s: cold start do sparticuz + navegação + intercept da Glue API
    // costuma ficar em 10-18s. Acima de 28s a lambda do Vercel já estourou.
    const HARD_TIMEOUT = 28000
    const run = mod.buscarComparaveisZapPlaywright(input)
    const timeout = new Promise<ScraperResultado>((_, rej) =>
      setTimeout(() => rej(new Error(`playwright timeout ${HARD_TIMEOUT}ms`)), HARD_TIMEOUT),
    )
    const r = await Promise.race([run, timeout])
    return { ...r, modo: "playwright" }
  } catch (e) {
    const msg = (e as Error).message
    console.warn("[scraper] Playwright erro:", msg)
    return { erroPlaywright: msg }
  }
}

function isPlaywrightErro(x: unknown): x is { erroPlaywright: string } {
  return !!x && typeof x === "object" && "erroPlaywright" in (x as Record<string, unknown>)
}

export async function buscarComparaveis(input: BuscaComparaveisInput): Promise<ScraperResultado> {
  const assistedInput: AssistedInput = {
    cidade: input.cidade,
    bairro: input.bairro,
    areaAlvo: input.areaAlvo,
    quartos: input.quartos,
  }
  const urlsAssistidas = gerarUrlsAssistidasZap(assistedInput)

  // 1) Playwright (usa sparticuz Chromium no Vercel, playwright-extra localmente)
  const viaPlaywright = await tentarPlaywright(input)
  let erroPlaywright: string | undefined
  if (isPlaywrightErro(viaPlaywright)) {
    erroPlaywright = viaPlaywright.erroPlaywright
  } else if (viaPlaywright && viaPlaywright.comparaveis.length > 0) {
    return { ...viaPlaywright, urlsAssistidas }
  } else if (viaPlaywright) {
    erroPlaywright = viaPlaywright.erro
  }

  // 2) HTTP direto — rápido, mas pode ser 403 pelo Cloudflare do ZAP
  const viaHttp = await buscarComparaveisZap(input)
  if (viaHttp.comparaveis.length > 0) {
    return { ...viaHttp, modo: "http", urlsAssistidas }
  }

  // 3) Assisted — sem comparáveis auto, MAS sempre com as 4 URLs prontas
  const partes = [
    erroPlaywright ? `playwright: ${erroPlaywright}` : null,
    viaHttp.erro ? `http: ${viaHttp.erro}` : null,
  ].filter(Boolean)
  const erroFinal = partes.length
    ? partes.join(" · ")
    : "Busca automática indisponível no momento."

  return {
    comparaveis: [],
    totalDisponivel: viaHttp.totalDisponivel ?? 0,
    usouFallbackCidade: viaHttp.usouFallbackCidade ?? false,
    modo: "assisted",
    erro: erroFinal,
    urlsAssistidas,
  }
}

export { buscarComparaveisZap }
export type { BuscaComparaveisInput, ComparavelZap } from "./zap"
export type { UrlAssistida } from "./assisted-urls"
