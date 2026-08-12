import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { randomUUID } from "crypto"
import { COOKIE_NAME, verificarSessionToken } from "@/lib/painel/auth"
import { buscarComparaveis } from "@/lib/painel/acm-scraper"
import { calcSimilaridade, DEFAULT_WEIGHTS } from "@/lib/painel/acm-calc"
import type { AmostraACM, ImovelAlvoACM } from "@/types/acm"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
// Playwright pode levar 5-8s no cold start — dá 30s de folga (Vercel Pro).
// Em Vercel free tier o cap é 10s; se der timeout, o orquestrador cai pra HTTP → assisted.
export const maxDuration = 30

/**
 * POST /api/acm/buscar-comparaveis
 * Body: dados do imóvel-alvo + { top?: number }
 * Retorna: { amostras[], urlsAssistidas[], meta }
 *
 * Se `amostras.length === 0` e `urlsAssistidas.length > 0`, o cliente
 * deve mostrar UI de "abrir 4 buscas no ZAP" (modo assisted).
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

  const inicio = Date.now()
  const scr = await buscarComparaveis({
    cidade: alvo.cidade,
    bairro: alvo.bairro,
    areaAlvo: alvo.areaTotal,
    quartos: alvo.quartos || undefined,
    size: 30,
    focarBairro: true,
  })
  const duracaoMs = Date.now() - inicio

  // Se ficou pouco e temos coordenadas do bairro, tenta cidade toda no mesmo modo
  let comparaveis = scr.comparaveis
  let ampliouParaCidade = false
  if (comparaveis.length < top && scr.modo !== "assisted" && !scr.usouFallbackCidade) {
    const scr2 = await buscarComparaveis({
      cidade: alvo.cidade,
      bairro: alvo.bairro,
      areaAlvo: alvo.areaTotal,
      quartos: alvo.quartos || undefined,
      size: 30,
      focarBairro: false,
    })
    comparaveis = scr2.comparaveis
    ampliouParaCidade = true
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
