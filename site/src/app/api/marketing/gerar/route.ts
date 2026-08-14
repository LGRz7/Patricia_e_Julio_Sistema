/**
 * POST /api/marketing/gerar — pipeline prompt → gpt-image-2.
 *
 *   1. Auth
 *   2. Carrega memória (_memoria/*.md + identidade/design-guide.md)
 *   3. Se veio imovelSlug, carrega o imóvel
 *   4. LLM texto (planejador) — devolve JSON { imagePrompts[], caption, descricao }
 *   5. Pra cada imagePrompt, chama gpt-image-2 → salva bytes em public/gen/<slug>/
 *   6. Cria pedido no histórico com status "pronto" + criativos ligados
 *   7. Devolve URLs + legenda
 */
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { promises as fs } from "fs"
import path from "path"
import { randomUUID } from "crypto"
import { COOKIE_NAME, verificarSessionToken } from "@/lib/painel/auth"
import { chat, llmConfigured, LlmError } from "@/lib/painel/llm.server"
import { montarPromptPlanejadorSlides } from "@/lib/painel/planejador-slides.server"
import { gerarHTML, renderizarVarias, type SlideContent, type TemplateConfig } from "@/lib/painel/template-renderer.server"
import { montarSystemPromptPlanejador } from "@/lib/painel/contexto-loader.server"
import { createPedido } from "@/lib/painel/marketing-store.server"
import { getImovelMerged as getImovel } from "@/lib/painel/imoveis-store.server"
import { getPersona } from "@/data/painel/personas"
import type { FormatoPost, TipoCriativo } from "@/types/marketing"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60  // Vercel Hobby cap. 5 versões levam ~15-25s no CF + Playwright.

const FORMATOS_VALIDOS: FormatoPost[] = ["corretores", "imovel", "copy"]

const PUBLIC_ROOT = path.resolve(process.cwd(), "public")
const GEN_ROOT = path.join(PUBLIC_ROOT, "gen")

// Em produção Vercel o filesystem é read-only exceto /tmp — usamos Vercel Blob.
// Em dev (BLOB_READ_WRITE_TOKEN ausente) cai pro filesystem em public/gen.
const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN

/** Persiste um PNG e devolve URL pública. Blob em prod, filesystem em dev. */
async function salvarPng(bytes: Buffer, blobKey: string, outDir: string, filename: string): Promise<string> {
  if (USE_BLOB) {
    const { put } = await import("@vercel/blob")
    const res = await put(blobKey, bytes, {
      access: "public",
      contentType: "image/png",
      allowOverwrite: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })
    return res.url
  }
  await fs.mkdir(outDir, { recursive: true })
  await fs.writeFile(path.join(outDir, filename), bytes)
  // No dev, Next serve /public estaticamente.
  const publicRel = path.relative(PUBLIC_ROOT, path.join(outDir, filename)).split(path.sep).join("/")
  return `/${publicRel}`
}

interface Plano {
  descricao?: string
  slides: SlideContent[]
  caption?: string
}

export async function POST(req: Request) {
  // 1) Auth
  const token = cookies().get(COOKIE_NAME)?.value
  const user = token ? await verificarSessionToken(token) : null
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 })

  // 2) Body
  let body: {
    prompt?: string
    formato?: FormatoPost
    imovelSlug?: string
    personaId?: string
    tipo?: TipoCriativo
  }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }) }

  const prompt = (body.prompt || "").trim()
  if (prompt.length < 6) {
    return NextResponse.json({ error: "prompt muito curto (mínimo 6 caracteres)" }, { status: 400 })
  }

  const formato = body.formato || "corretores"
  if (!FORMATOS_VALIDOS.includes(formato)) {
    return NextResponse.json({ error: `formato inválido: ${formato}` }, { status: 400 })
  }
  const tipo: TipoCriativo = body.tipo || "post"

  // 3) Preflight
  if (!llmConfigured()) {
    return NextResponse.json({
      error: "LLM texto não configurado",
      hint: "Recomendo Hugging Face (grátis, sem cartão, sem Account ID): pega o token em https://huggingface.co/settings/tokens (formato hf_...) e cola em HUGGINGFACE_API_TOKEN no site/.env.local.",
    }, { status: 503 })
  }

  // 4) Contexto
  const imovel = body.imovelSlug ? await getImovel(body.imovelSlug) : null
  if (formato === "imovel" && !imovel) {
    return NextResponse.json({
      error: `formato "imovel" precisa de imovelSlug válido${body.imovelSlug ? ` (não achei "${body.imovelSlug}")` : ""}`,
    }, { status: 400 })
  }
  const persona = body.personaId ? getPersona(body.personaId) : null

  // 5) Etapa 1 — planejador (LLM texto → JSON de slides)
  const systemPrompt = await montarPromptPlanejadorSlides({
    formato,
    tipo,
    personaId: persona?.id,
    imovel,
  })
  let planoResp
  try {
    planoResp = await chat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      // maxTokens alto porque o Llama tende a mandar preâmbulo em markdown antes do JSON
      { temperature: 0.75, maxTokens: 8000, json: true },
    )
  } catch (err) {
    if (err instanceof LlmError) {
      // 402/401/429 do provedor → bubble com msg clara pro front
      const hint = err.status === 402
        ? "Saldo esgotado no provedor. Se for Pollinations, faça quests em https://enter.pollinations.ai. Ou troque pro Cloudflare (grátis 10k/dia)."
        : err.status === 401 || err.status === 403
          ? `Chave rejeitada pelo ${err.provider}. Confere as credenciais no site/.env.local.`
          : err.status === 429
            ? "Rate limit atingido — aguarda uns segundos e tenta de novo."
            : `Provedor retornou ${err.status}. Detalhe: ${err.message}`
      return NextResponse.json({
        error: err.message,
        hint,
        provider: err.provider,
        status: err.status,
      }, { status: err.status === 401 ? 401 : 502 })
    }
    throw err
  }
  if (!planoResp) {
    return NextResponse.json({
      error: "planejador não devolveu resposta",
      hint: "Confere a chave, saldo e o log do servidor.",
    }, { status: 502 })
  }

  let plano: Plano
  const rawContent = planoResp.content
  const tentativas: string[] = [rawContent]
  // Estratégia 1: se veio dentro de ```json ... ```
  const fenceMatch = rawContent.match(/```(?:json)?\s*\n?([\s\S]*?)```/)
  if (fenceMatch?.[1]) tentativas.push(fenceMatch[1])
  // Estratégia 2: primeiro { … último } (fallback)
  const greedy = rawContent.match(/\{[\s\S]*\}/)
  if (greedy?.[0]) tentativas.push(greedy[0])

  let parsed: Plano | null = null
  for (const cand of tentativas) {
    try { parsed = JSON.parse(cand.trim()); break } catch { /* segue */ }
  }
  if (!parsed) {
    return NextResponse.json({
      error: "planejador retornou JSON inválido",
      detail: rawContent.slice(0, 600),
    }, { status: 502 })
  }
  plano = parsed

  const imagePrompts = Array.isArray(plano.slides) ? plano.slides : []
  if (imagePrompts.length === 0) {
    return NextResponse.json({
      error: "planejador não gerou nenhum slide",
      plano,
    }, { status: 502 })
  }

  // 6) Etapa 2 — gerar HTML e renderizar com Playwright
  const slug = `${formato}-${Date.now()}-${randomUUID().slice(0, 6)}`
  const outDir = path.join(GEN_ROOT, slug)
  if (!USE_BLOB) await fs.mkdir(outDir, { recursive: true })

  // Determinar fotos baseado no formato
  let fotoCorretores: string | undefined
  let fotoImovel: string | undefined
  
  if (formato === "corretores") {
    // Foto dos corretores juntos
    fotoCorretores = "/equipe/patricia-julio.png"
    console.log("✓ Foto corretores:", fotoCorretores)
  } else if (formato === "imovel" && imovel?.imagens[0]?.src) {
    // Primeira foto do imóvel
    fotoImovel = imovel.imagens[0].src
    console.log("✓ Foto do imóvel:", fotoImovel, "| Imóvel:", imovel.titulo)
  } else if (formato === "imovel") {
    console.log("⚠️ Formato 'imovel' mas nenhuma foto encontrada. imovel:", imovel?.titulo || "não carregado")
  }

  // Para conteúdo de 1 slide, gerar 5 versões com estilos visuais diferentes
  const versoes: Array<{
    slides: SlideContent[]
    variacao: string
  }> = []
  
  console.log(`🎨 Decisão de versões: tipo="${tipo}", slides=${plano.slides.length}`)
  
  if (plano.slides.length === 1) {
    // Gerar 5 variações do mesmo conteúdo com tipos de slide diferentes
    // Funciona para post, story, reels - qualquer conteúdo unitário
    const tiposVariacao = ["solo", "capa", "duo", "solo", "capa"] // mix de estilos
    const slide = plano.slides[0]
    
    console.log(`✓ Gerando 5 versões visuais diferentes do mesmo conteúdo (tipo="${tipo}")`)
    
    for (let i = 0; i < 5; i++) {
      const tipoSlide = tiposVariacao[i] as SlideContent["type"]
      versoes.push({
        slides: [{
          ...slide,
          type: tipoSlide
        }],
        variacao: `v${i + 1}-${tipoSlide}`
      })
    }
  } else {
    // Carrossel: apenas 1 versão (já tem múltiplos slides)
    console.log(`✓ Modo carrossel: 1 versão com ${plano.slides.length} slides`)
    versoes.push({
      slides: plano.slides,
      variacao: "original"
    })
  }

  // Renderizar todas as versões
  interface SlideGerado {
    versao: string
    index: number
    filename: string
    url: string
  }

  const todasSlides: SlideGerado[] = []

  // Monta todos os HTMLs primeiro (rápido, tudo em memória)
  const htmls = versoes.map((versao) => {
    const config: TemplateConfig = {
      formato,
      tipo,
      slides: versao.slides,
      paleta: {
        navy: "#2F4156",
        teal: "#567C8D",
        sky: "#C8D9E6",
        beige: "#F5EFEB",
      },
      tipografia: {
        display: "Manrope",
        sans: "Inter",
      },
      marca: {
        creci1: "68850",
        creci2: "79271",
        handle: "@julio_e_patricia_corretores",
      },
      fotoCorretores,
      fotoImovel,
    }
    return gerarHTML(config)
  })
  const ultimoHTML = htmls[htmls.length - 1] || ""

  // Renderiza TUDO num único browser (1 cold start em vez de 5 — 20-30s a menos
  // e sem risco de OOM/timeout na serverless).
  let pngsPorVersao: Buffer[][] = []
  try {
    pngsPorVersao = await renderizarVarias(htmls, tipo)
  } catch (err) {
    console.error("Erro no render em batch:", (err as Error).message)
    return NextResponse.json({
      error: "Renderização falhou",
      hint: "O Chromium não conseguiu subir ou travou. Tenta de novo — se persistir, reduz o número de versões.",
      detail: (err as Error).message,
    }, { status: 502 })
  }

  for (let v = 0; v < versoes.length; v++) {
    const versao = versoes[v]
    const pngs = pngsPorVersao[v] || []
    for (let i = 0; i < pngs.length; i++) {
      const filename = versoes.length > 1
        ? `${versao.variacao}-slide-${String(i + 1).padStart(2, "0")}.png`
        : `slide-${String(i + 1).padStart(2, "0")}.png`

      const blobKey = `gen/${slug}/${filename}`
      const url = await salvarPng(pngs[i], blobKey, outDir, filename)
      todasSlides.push({
        versao: versao.variacao,
        index: i + 1,
        filename,
        url,
      })
    }
  }

  // Se todas as versões falharam, retorna erro claro em vez de 201 com slides vazios
  if (todasSlides.length === 0) {
    return NextResponse.json({
      error: "Nenhuma imagem foi gerada",
      hint: "O Playwright não conseguiu screenshotar. Tenta simplificar o prompt ou tenta de novo em alguns segundos.",
    }, { status: 502 })
  }

  // Legenda / plano / template ficam só em dev — em prod não precisa persistir debug.
  const legenda = plano.caption?.trim() || ""
  if (!USE_BLOB) {
    if (legenda) {
      await fs.writeFile(path.join(outDir, "legenda.md"), legenda, "utf8")
    }
    await fs.writeFile(path.join(outDir, "plano.json"), JSON.stringify(plano, null, 2), "utf8")
    await fs.writeFile(path.join(outDir, "template.html"), ultimoHTML, "utf8")
  }

  // 7) Cria pedido no histórico
  const gancho = prompt.split("\n")[0].trim().slice(0, 60) || `${formato} · ${slug}`
  const criativoBase = randomUUID()
  const nowIso = new Date().toISOString()
  const pedido = await createPedido({
    status: "pronto",
    personaId: persona?.id || "upgrade-familiar",
    tipo,
    formato,
    imovelSlug: imovel?.slug,
    bairro: imovel?.localizacao,
    gancho,
    briefing: prompt,
    criadoPor: user.papel,
    criativos: todasSlides.map((s, i) => ({
      id: `${criativoBase}-${i}`,
      tipo,
      titulo: versoes.length > 1 ? `${s.versao} - Slide ${s.index}` : `Slide ${s.index}`,
      arquivoUrl: s.url,
      thumbnailUrl: s.url,
      legendaSugerida: i === 0 ? legenda : undefined,
      criadoEm: nowIso,
    })),
  })

  // Agrupa slides por versão para resposta estruturada
  const versoesPorGrupo: Array<{
    versao: string
    slides: SlideGerado[]
  }> = []
  
  for (const versao of versoes) {
    const slidesVersao = todasSlides.filter(s => s.versao === versao.variacao)
    versoesPorGrupo.push({
      versao: versao.variacao,
      slides: slidesVersao
    })
  }

  return NextResponse.json({
    ok: true,
    pedido,
    versoes: versoesPorGrupo,
    slides: todasSlides, // compatibilidade com frontend antigo
    legenda,
    descricao: plano.descricao,
    modelo: `${planoResp.model} + Playwright`,
    tokens: planoResp.usage,
  }, { status: 201 })
}
