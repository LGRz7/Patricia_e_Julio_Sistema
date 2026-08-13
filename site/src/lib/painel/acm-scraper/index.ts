/**
 * Orquestrador do scraper. Estratégia:
 *
 *   1. HTTP fetch cru na Glue API do ZAP — rápido, funciona localmente e às
 *      vezes na Vercel; falha com 403 quando o Cloudflare bloqueia.
 *   2. Fallback: retorna URLs assistidas pro corretor abrir 4 abas prontas.
 *
 * Playwright FOI REMOVIDO desse caminho — o ZAP bloqueia o IP da Vercel via
 * Cloudflare mesmo com Chromium real (sparticuz), e o binário pesado
 * inflava o bundle da lambda sem ganho concreto. O modo assistido virou
 * o fluxo primário do wizard (funciona 100% das vezes).
 *
 * Se quiser experimentar Playwright de novo (dev local ou VPS próprio),
 * o módulo `./zap-playwright.ts` continua existindo — só não é chamado aqui.
 *
 * TODO(siai): quando VivaReal e OLX entrarem, `buscarTodasFontes` orquestra
 * todos em paralelo aqui.
 */
import "server-only"
import type { BuscaComparaveisInput, ComparavelZap } from "./zap"
import { buscarComparaveisZap } from "./zap"
import { gerarUrlsAssistidasZap, type UrlAssistida, type AssistedInput } from "./assisted-urls"

export type ScraperMode = "http" | "assisted"

export interface ScraperResultado {
  comparaveis: ComparavelZap[]
  totalDisponivel: number
  usouFallbackCidade: boolean
  modo: ScraperMode
  erro?: string
  urlsAssistidas?: UrlAssistida[]
}

export async function buscarComparaveis(input: BuscaComparaveisInput): Promise<ScraperResultado> {
  const assistedInput: AssistedInput = {
    cidade: input.cidade,
    bairro: input.bairro,
    areaAlvo: input.areaAlvo,
    quartos: input.quartos,
  }
  const urlsAssistidas = gerarUrlsAssistidasZap(assistedInput)

  // 1) HTTP direto — rápido, mas pode ser 403 pelo Cloudflare do ZAP
  const viaHttp = await buscarComparaveisZap(input)
  if (viaHttp.comparaveis.length > 0) {
    return { ...viaHttp, modo: "http", urlsAssistidas }
  }

  // 2) Assisted — sem comparáveis auto, MAS sempre com as 4 URLs prontas
  return {
    comparaveis: [],
    totalDisponivel: viaHttp.totalDisponivel ?? 0,
    usouFallbackCidade: viaHttp.usouFallbackCidade ?? false,
    modo: "assisted",
    erro: viaHttp.erro || "Busca automática indisponível no momento.",
    urlsAssistidas,
  }
}

export { buscarComparaveisZap }
export type { BuscaComparaveisInput, ComparavelZap } from "./zap"
export type { UrlAssistida } from "./assisted-urls"
