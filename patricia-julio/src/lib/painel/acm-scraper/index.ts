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

async function tentarPlaywright(input: BuscaComparaveisInput): Promise<ScraperResultado | null> {
  try {
    // Import dinâmico pra não quebrar build em ambiente sem playwright instalado
    const mod = await import("./zap-playwright").catch(() => null)
    if (!mod?.buscarComparaveisZapPlaywright) return null
    const r = await mod.buscarComparaveisZapPlaywright(input)
    return { ...r, modo: "playwright" }
  } catch (e) {
    console.warn("[scraper] Playwright indisponível:", (e as Error).message)
    return null
  }
}

export async function buscarComparaveis(input: BuscaComparaveisInput): Promise<ScraperResultado> {
  const assistedInput: AssistedInput = {
    cidade: input.cidade,
    bairro: input.bairro,
    areaAlvo: input.areaAlvo,
    quartos: input.quartos,
  }
  const urlsAssistidas = gerarUrlsAssistidasZap(assistedInput)

  // 1) Playwright
  const viaPlaywright = await tentarPlaywright(input)
  if (viaPlaywright && viaPlaywright.comparaveis.length > 0) {
    return { ...viaPlaywright, urlsAssistidas }
  }

  // 2) HTTP direto
  const viaHttp = await buscarComparaveisZap(input)
  if (viaHttp.comparaveis.length > 0) {
    return { ...viaHttp, modo: "http", urlsAssistidas }
  }

  // 3) Assisted — sem comparaveis, mas com URLs pro corretor abrir
  const erroFinal =
    viaPlaywright?.erro ||
    viaHttp.erro ||
    "Sem comparáveis automáticos disponíveis."
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
