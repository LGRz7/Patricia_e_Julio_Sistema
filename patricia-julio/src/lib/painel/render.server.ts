/**
 * render.server.ts — HTML → PNGs via Playwright headless.
 *
 * Recebe o HTML que o LLM devolveu (com N <div class="slide">) e fotografa
 * cada slide em resolução real. Salva em `public/gen/<slug>/slide-01.png` …
 * pra o browser buscar diretamente por URL relativa `/gen/<slug>/slide-01.png`.
 *
 * O Playwright já está em package.json (^1.62.1).
 */
import "server-only"
import path from "path"
import { promises as fs } from "fs"
import { chromium, type Browser } from "playwright"

const PUBLIC_ROOT = path.resolve(process.cwd(), "public")
const GEN_ROOT = path.join(PUBLIC_ROOT, "gen")
const URL_PREFIX = "/gen"

// Reaproveita 1 instância do browser entre requisições (economiza ~2s).
let browserPromise: Promise<Browser> | null = null
async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: true })
    browserPromise.catch(() => { browserPromise = null })
  }
  return browserPromise
}

export interface SlideRenderizado {
  index: number       // 1-based
  filename: string    // "slide-01.png"
  url: string         // "/gen/<slug>/slide-01.png"
  width: number
  height: number
}

export interface ResultadoRender {
  slug: string        // ID único do lote (usado como pasta)
  htmlUrl: string     // URL do HTML completo (útil pra debug)
  slides: SlideRenderizado[]
}

/**
 * Renderiza o HTML e devolve os PNGs.
 *
 * @param html    HTML completo com <div class="slide"> N vezes
 * @param slug    Nome único da pasta (ex.: "post-1234-abcd")
 * @param legenda Opcional — string pra salvar em legenda.md
 */
export async function renderizarHtmlParaPngs(
  html: string,
  slug: string,
  legenda?: string,
): Promise<ResultadoRender> {
  // Prepara a pasta
  const outDir = path.join(GEN_ROOT, slug)
  await fs.mkdir(outDir, { recursive: true })

  // Grava o HTML pra referência (e pra Playwright abrir via file:// se precisar)
  const htmlPath = path.join(outDir, "carrossel.html")
  await fs.writeFile(htmlPath, html, "utf8")

  // Legenda auxiliar
  if (legenda) {
    await fs.writeFile(path.join(outDir, "legenda.md"), legenda, "utf8")
  }

  // Abre no Chromium
  const browser = await getBrowser()
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()

  try {
    // setContent é rápido e não precisa de servidor HTTP externo
    await page.setContent(html, { waitUntil: "networkidle", timeout: 30_000 })
    // Aguarda fonts (Google Fonts) carregarem — evita título renderizado com fallback
    await page.evaluate(() => (document as unknown as { fonts: { ready: Promise<void> } }).fonts.ready)

    // Descobre quantos slides + suas dimensões
    const slidesInfo = await page.$$eval(".slide", (nodes) =>
      nodes.map((n, i) => {
        const rect = n.getBoundingClientRect()
        return { index: i + 1, width: Math.round(rect.width), height: Math.round(rect.height) }
      })
    )

    const slides: SlideRenderizado[] = []
    for (let i = 0; i < slidesInfo.length; i++) {
      const info = slidesInfo[i]
      // Scrolla até o slide pra garantir que ele tá visível (background-image carrega)
      const handle = (await page.$$(".slide"))[i]
      if (!handle) continue
      await handle.scrollIntoViewIfNeeded()

      const filename = `slide-${String(info.index).padStart(2, "0")}.png`
      const filePath = path.join(outDir, filename)
      await handle.screenshot({ path: filePath, type: "png" })

      slides.push({
        index: info.index,
        filename,
        url: `${URL_PREFIX}/${slug}/${filename}`,
        width: info.width,
        height: info.height,
      })
    }

    return {
      slug,
      htmlUrl: `${URL_PREFIX}/${slug}/carrossel.html`,
      slides,
    }
  } finally {
    await context.close().catch(() => {})
  }
}

/**
 * Fecha o browser cacheado (chamar no shutdown se quiser limpar).
 * Em dev, o Next reinicia o servidor a cada mudança — não precisa chamar.
 */
export async function fecharBrowser(): Promise<void> {
  const b = browserPromise
  browserPromise = null
  if (b) {
    try { (await b).close() } catch {}
  }
}
