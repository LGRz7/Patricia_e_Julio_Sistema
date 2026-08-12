/**
 * marketing-renderizar.server.ts — vira HTML em PNGs via Playwright headless.
 *
 * Espelha o `render.js` que a skill /carrossel usa. Diferença: em vez de
 * `npx playwright screenshot` na CLI, importa o pacote e roda no processo
 * do Next.js (App Router, runtime nodejs).
 *
 * Fluxo:
 *   1. Monta HTML completo com <head> (Google Fonts) envolvendo o body gerado
 *   2. Abre num Chromium headless
 *   3. Espera as fonts carregarem (document.fonts.ready)
 *   4. Localiza cada `<div class="slide">` e tira screenshot em PNG
 *   5. Salva em `site/public/geracoes/<slug>/slide-NN.png`
 *   6. Devolve URLs relativas pra o front usar direto (Next.js serve /public)
 */
import "server-only"
import { chromium } from "playwright"
import { promises as fs } from "fs"
import path from "path"

export interface EntradaRender {
  /** HTML bruto — deve conter <style> global + N <div class="slide">. */
  htmlBody: string
  /** Slug do pedido — usado como nome da pasta. */
  slug: string
  /** Dimensões em pixels de cada slide. */
  dimensoes: { w: number; h: number }
}

export interface SlideRenderizado {
  indice: number
  arquivo: string
  url: string
}

export interface SaidaRender {
  slides: SlideRenderizado[]
  pastaAbsoluta: string
  urlPasta: string
  htmlSalvo: string
}

const HTML_WRAPPER = (body: string, dims: { w: number; h: number }) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Preview</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #F5EFEB; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
  body { font-family: 'Inter', system-ui, sans-serif; color: #2F4156; }
  .slide {
    width: ${dims.w}px;
    height: ${dims.h}px;
    position: relative;
    overflow: hidden;
    display: block;
    margin: 0;
  }
</style>
</head>
<body>
${body}
</body>
</html>`

/**
 * Renderiza o HTML e devolve PNGs por slide.
 * Cada slide vira `slide-NN.png` numerado a partir de 01.
 */
export async function renderizarSlides(entrada: EntradaRender): Promise<SaidaRender> {
  const { htmlBody, slug, dimensoes } = entrada

  // Pasta de saída dentro de public/ pra Next.js servir estático
  const pastaAbsoluta = path.join(process.cwd(), "public", "geracoes", slug)
  const urlPasta = `/geracoes/${slug}`
  await fs.mkdir(pastaAbsoluta, { recursive: true })

  // Salva o HTML pra debug (útil pra ver o que o LLM devolveu)
  const htmlCompleto = HTML_WRAPPER(htmlBody, dimensoes)
  const htmlPath = path.join(pastaAbsoluta, "carrossel.html")
  await fs.writeFile(htmlPath, htmlCompleto, "utf-8")

  // Abre Chromium e renderiza
  const browser = await chromium.launch({ headless: true })
  const slides: SlideRenderizado[] = []
  try {
    const context = await browser.newContext({
      viewport: dimensoes,
      deviceScaleFactor: 1,
    })
    const page = await context.newPage()
    await page.setContent(htmlCompleto, { waitUntil: "networkidle" })

    // Espera fontes carregarem
    await page.evaluate(() => document.fonts.ready)
    // Pequena pausa extra pra layout estabilizar
    await page.waitForTimeout(300)

    // Screenshot cada .slide
    const elementos = await page.$$(".slide")
    if (elementos.length === 0) {
      throw new Error(
        'HTML gerado não contém nenhum `<div class="slide">`. ' +
        "Isso indica que o LLM devolveu um formato inválido. Tenta gerar de novo."
      )
    }

    for (let i = 0; i < elementos.length; i++) {
      const indice = i + 1
      const nome = `slide-${String(indice).padStart(2, "0")}.png`
      const arquivo = path.join(pastaAbsoluta, nome)
      await elementos[i].screenshot({ path: arquivo, type: "png", omitBackground: false })
      slides.push({
        indice,
        arquivo,
        url: `${urlPasta}/${nome}`,
      })
    }

    return { slides, pastaAbsoluta, urlPasta, htmlSalvo: `${urlPasta}/carrossel.html` }
  } finally {
    await browser.close()
  }
}
