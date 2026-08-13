import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { randomUUID } from "crypto"
import { COOKIE_NAME, verificarSessionToken } from "@/lib/painel/auth"
import { buscarComparaveis } from "@/lib/painel/acm-scraper"
import { gerarUrlsAssistidasZap } from "@/lib/painel/acm-scraper/assisted-urls"
import { calcSimilaridade, DEFAULT_WEIGHTS } from "@/lib/painel/acm-calc"
import type { AmostraACM, ImovelAlvoACM } from "@/types/acm"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
// HTTP fetch tem timeout interno de 6s. Deixamos 15s no total pra caber
// eventuais retries + processing sem estourar o serverless.
export const maxDuration = 15

/** Corta a promise em `ms` — usado pra garantir resposta útil mesmo se o scraper travar. */
function comTimeout<T>(p: Promise<T>, ms: number, tag: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`${tag} timeout ${ms}ms`)), ms)),
  ])
}

/**
 * POST /api/acm/buscar-comparaveis
 * Body: dados do imóvel-alvo + { top?: number }
 * Retorna: { amostras[], urlsAssistidas[], meta }
 *
 * Nunca lança 500 — se o scraper falhar, ainda devolve 200 com `urlsAssistidas`
 * pra o cliente mostrar o modo assistido (4 links de busca no ZAP prontos).
 */
export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value
  const user = token ? await verificarSessionToken(token) : null
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 })

  let body: Partial<ImovelAlvoACM> & { top?: number }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }) }

  if (!body.bairro || !body.cidade || !body.areaTotal || body.areaTotal <= 0) {
    return NextResponse.json({ error: "bairro, cidade e areaTotal são obrigatórios" }, { status: 400 })
  }

  const alvo: ImovelAlvoACM = {
    apelido: body.apelido || "",
    endereco: body.endereco || "",
    bairro: body.bairro,
    cidade: body.cidade,
    areaTotal: body.areaTotal,
    quartos: body.quartos ?? 0,
    banheiros: body.banheiros ?? 0,
    vagas: body.vagas ?? 0,
    suites: body.suites,
    condominio: body.condominio,
    iptu: body.iptu,
    observacoes: body.observacoes,
  }
  const top = Math.min(Math.max(body.top ?? 6, 4), 10)

  // Timeout global de 10s pro scraping HTTP. Se estourar, cai no fallback
  // assistido (mesmo caminho de 0 comparáveis).
  const inicio = Date.now()
  let scr
  try {
    scr = await comTimeout(
      buscarComparaveis({
        cidade: alvo.cidade,
        bairro: alvo.bairro,
        areaAlvo: alvo.areaTotal,
        quartos: alvo.quartos || undefined,
        size: 30,
        focarBairro: true,
      }),
      10000,
      "scraper primário",
    )
  } catch (e) {
    // Se o scraper primário travou, ainda entrega URLs assistidas
    const urlsAssistidas = gerarUrlsAssistidasZap({
      cidade: alvo.cidade,
      bairro: alvo.bairro,
      areaAlvo: alvo.areaTotal,
      quartos: alvo.quartos || undefined,
    })
    return NextResponse.json({
      amostras: [],
      urlsAssistidas,
      meta: {
        modo: "assisted",
        totalDisponivel: 0,
        candidatosApos: 0,
        candidatosRankeados: 0,
        ampliouParaCidade: false,
        erro: (e as Error).message || "busca automática falhou",
        duracaoMs: Date.now() - inicio,
        fontesConsultadas: ["ZAP"],
        solicitadoPor: user.papel,
      },
    })
  }
  const duracaoMs = Date.now() - inicio

  // Se ficou pouco e temos coordenadas do bairro, tenta cidade toda no mesmo modo
  let comparaveis = scr.comparaveis
  let ampliouParaCidade = false
  if (comparaveis.length < top && scr.modo !== "assisted" && !scr.usouFallbackCidade) {
    try {
      const scr2 = await comTimeout(
        buscarComparaveis({
          cidade: alvo.cidade,
          bairro: alvo.bairro,
          areaAlvo: alvo.areaTotal,
          quartos: alvo.quartos || undefined,
          size: 30,
          focarBairro: false,
        }),
        8000,
        "scraper amplo",
      )
      comparaveis = scr2.comparaveis
      ampliouParaCidade = true
    } catch (e) {
      // amplia falhou — segue com o que tinha
      console.warn("[acm/buscar] scraper amplo falhou:", (e as Error).message)
    }
  }

  // Converte pra AmostraACM
  const amostras: AmostraACM[] = comparaveis.map((c) => ({
    id: randomUUID(),
    origem: "colada",
    fonte: c.fonte,
    linkOriginal: c.linkOriginal,
    endereco: c.endereco,
    bairro: c.bairro,
    precoAnuncio: c.precoAnuncio,
    areaTotal: c.areaTotal,
    quartos: c.quartos,
    banheiros: c.banheiros,
    vagas: c.vagas,
    condominio: c.condominio,
    iptu: c.iptu,
    observacoes: c.observacoes,
    precoM2: c.precoM2,
  }))

  // Ranqueia por similaridade multi-dim
  const scored = amostras.map((a) => ({
    amostra: a,
    similaridade: calcSimilaridade(alvo, a, DEFAULT_WEIGHTS),
  }))
  scored.sort((x, y) => y.similaridade.scoreTotal - x.similaridade.scoreTotal)

  const ranqueadas = scored.slice(0, top).map((s) => ({
    ...s.amostra,
    _similaridade: s.similaridade.scoreTotal,
  }))

  return NextResponse.json({
    amostras: ranqueadas,
    urlsAssistidas: scr.urlsAssistidas || [],
    meta: {
      modo: scr.modo,
      totalDisponivel: scr.totalDisponivel,
      candidatosApos: comparaveis.length,
      candidatosRankeados: ranqueadas.length,
      ampliouParaCidade,
      erro: scr.erro,
      duracaoMs,
      fontesConsultadas: ["ZAP"],
      solicitadoPor: user.papel,
    },
  })
}
