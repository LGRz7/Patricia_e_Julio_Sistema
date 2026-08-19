/**
 * template-renderer.server.ts — renderiza templates HTML com Playwright.
 *
 * Substitui geração de imagens por IA por templates HTML padronizados
 * renderizados em PNG via Playwright. Garantia de qualidade e consistência
 * visual 100% seguindo o design guide.
 */
import "server-only"
import type { FormatoPost, TipoCriativo } from "@/types/marketing"

/**
 * Chromium dual-mode:
 *  - Dev / self-host  → `playwright` completo (traz o browser)
 *  - Vercel serverless → `playwright-core` + `@sparticuz/chromium` (binário slim de ~50MB
 *    otimizado pro runtime AWS Lambda que a Vercel usa)
 * Decide pelo env `VERCEL`/`AWS_LAMBDA_FUNCTION_NAME` presentes na Vercel.
 */
// Flags extras pra reduzir consumo de memória do Chromium na lambda (1024MB no
// plano Hobby). Sem elas, o Chromium + buffers de render estouram a RAM e a
// função morre com 500 sem body (OOM que o try-catch JS não pega).
const CHROMIUM_LOW_MEM_ARGS = [
  "--disable-dev-shm-usage",       // usa /tmp em vez de /dev/shm (que é minúsculo na lambda)
  "--disable-gpu",
  "--no-sandbox",
  "--single-process",              // 1 processo só — bem menos RAM
  "--no-zygote",
  "--disable-extensions",
  "--disable-background-networking",
  "--disable-default-apps",
  "--mute-audio",
  "--disable-features=site-per-process",
]

async function launchChromium() {
  const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
  if (isServerless) {
    const [{ chromium: pwCore }, sparticuzModule] = await Promise.all([
      import("playwright-core"),
      import("@sparticuz/chromium"),
    ])
    const sparticuz = (sparticuzModule as { default?: typeof sparticuzModule }).default ?? sparticuzModule
    // @ts-expect-error — @sparticuz/chromium tem tipos frouxos entre versões
    const executablePath = await sparticuz.executablePath()
    // Combina os args do sparticuz com os nossos de baixa memória (dedup).
    // @ts-expect-error — args tem shape específico do sparticuz
    const baseArgs: string[] = Array.isArray(sparticuz.args) ? sparticuz.args : []
    const args = Array.from(new Set([...baseArgs, ...CHROMIUM_LOW_MEM_ARGS]))
    return pwCore.launch({
      args,
      executablePath,
      headless: true,
    })
  }
  const { chromium: pw } = await import("playwright")
  return pw.launch({ headless: true })
}

export interface SlideContent {
  type: "capa" | "solo" | "duo" | "numero" | "citacao" | "cta" | "foto"
  titulo?: string
  subtitulo?: string
  corpo?: string
  numero?: string
  citacao?: string
  autor?: string
  cta?: string
  // Para slides com foto
  fotoUrl?: string
}

export interface TemplateConfig {
  formato: FormatoPost
  tipo: TipoCriativo
  slides: SlideContent[]
  paleta: {
    navy: string
    teal: string
    sky: string
    beige: string
  }
  tipografia: {
    display: string  // Playfair Display
    sans: string     // Inter
  }
  marca: {
    logo?: string
    creci1: string
    creci2: string
    handle: string
  }
  // Fotos reais
  fotoCorretores?: string  // URL da foto dos corretores juntos
  fotoImovel?: string      // URL da foto do imóvel selecionado
}

/**
 * Gera HTML inline com todos os slides.
 * CSS inline, Google Fonts, zero dependência externa.
 */
export function gerarHTML(config: TemplateConfig): string {
  const { paleta, tipografia, marca, slides, fotoCorretores, fotoImovel } = config
  
  console.log(`\n📋 Gerando HTML para ${config.formato}:`)
  console.log(`  - Tipo: ${config.tipo}`)
  console.log(`  - Slides: ${slides.length}`)
  console.log(`  - Foto corretores: ${fotoCorretores || "nenhuma"}`)
  console.log(`  - Foto imóvel: ${fotoImovel || "nenhuma"}`)
  
  // Dimensões pelo tipo
  const [width, height] = config.tipo === "story" || config.tipo === "reels"
    ? [1080, 1920]
    : [1080, 1350]

  const slidesHTML = slides.map((slide, idx) => {
    const slideNum = idx + 1
    const totalSlides = slides.length
    
    // Define a foto a ser usada baseado no formato
    let fotoUrl = slide.fotoUrl
    
    // Se não tem fotoUrl no slide, usa as fotos do config baseado no formato
    if (!fotoUrl) {
      if (config.formato === "corretores" && fotoCorretores) {
        fotoUrl = fotoCorretores
      } else if (config.formato === "imovel" && fotoImovel) {
        fotoUrl = fotoImovel
      }
    }
    
    console.log(`  Slide ${slideNum} (${slide.type}): fotoUrl=${fotoUrl || "nenhuma"}`)
    
    switch (slide.type) {
      case "capa":
        return gerarSlideCapa(slide, slideNum, totalSlides, paleta, marca, fotoUrl)
      case "foto":
        return gerarSlideFoto(slide, slideNum, totalSlides, paleta, marca, fotoUrl)
      case "solo":
        return gerarSlideSolo(slide, slideNum, totalSlides, paleta, marca)
      case "duo":
        return gerarSlideDuo(slide, slideNum, totalSlides, paleta, marca)
      case "numero":
        return gerarSlideNumero(slide, slideNum, totalSlides, paleta, marca)
      case "cta":
        return gerarSlideCTA(slide, slideNum, totalSlides, paleta, marca)
      default:
        return ""
    }
  }).join("\n")

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Carrossel</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: '${tipografia.sans}', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .slide {
      width: ${width}px;
      height: ${height}px;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      page-break-after: always;
    }
    .slide-header {
      padding: 50px 70px 0;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .slide-counter {
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      opacity: 0.6;
    }
    .slide-content {
      flex: 1;
      padding: 0 70px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .slide-footer {
      padding: 40px 70px 50px;
      border-top: 1px solid rgba(255,255,255,0.12);
      font-size: 15px;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .eyebrow {
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      margin-bottom: 20px;
    }
    .regua {
      width: 70px;
      height: 3px;
      margin: 25px 0;
    }
    h1 {
      font-family: 'Manrope', sans-serif;
      font-size: 90px;
      font-weight: 900;
      line-height: 0.98;
      letter-spacing: -0.04em;
    }
    h2 {
      font-family: 'Manrope', sans-serif;
      font-size: 68px;
      font-weight: 800;
      line-height: 1.04;
      letter-spacing: -0.035em;
      margin-bottom: 25px;
    }
    .corpo {
      font-size: 22px;
      font-weight: 500;
      line-height: 1.5;
      opacity: 0.9;
    }
    .numero-gigante {
      font-family: 'Manrope', sans-serif;
      font-size: 280px;
      font-weight: 800;
      line-height: 0.85;
      letter-spacing: -0.02em;
    }
    .cta-button {
      display: inline-block;
      padding: 18px 45px;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      text-decoration: none;
      border-radius: 4px;
      margin-top: 35px;
    }
  </style>
</head>
<body>
${slidesHTML}
</body>
</html>`
}

function gerarSlideCapa(
  slide: SlideContent,
  slideNum: number,
  total: number,
  paleta: TemplateConfig["paleta"],
  marca: TemplateConfig["marca"],
  fotoUrl?: string
): string {
  // Se tem foto, usa layout com foto em destaque (seguindo o padrão da marca)
  if (fotoUrl) {
    return `<div class="slide" style="background: ${paleta.navy}; color: ${paleta.beige}; position: relative;">
  <!-- Foto de fundo -->
  <div style="position: absolute; inset: 0; overflow: hidden;">
    <img src="${fotoUrl}" alt="" style="width: 100%; height: 100%; object-fit: cover; object-position: center;" />
  </div>
  
  <!-- Overlay gradiente sutil (navy transparente → navy sólido) -->
  <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(47,65,86,0.3) 0%, rgba(47,65,86,0.75) 50%, ${paleta.navy} 100%);"></div>
  
  <!-- Header -->
  <div class="slide-header" style="position: relative; z-index: 10;">
    <div style="font-size: 14px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: ${paleta.sky};">Patrícia e Júlio</div>
    <div class="slide-counter" style="color: ${paleta.sky};">${slideNum}/${total}</div>
  </div>
  
  <!-- Conteúdo alinhado embaixo -->
  <div style="position: relative; z-index: 10; padding: 0 70px 100px; margin-top: auto;">
    <h1 style="font-size: 72px; line-height: 1.1; margin-bottom: 15px;">${slide.titulo || ""}</h1>
    ${slide.subtitulo ? `<p class="corpo" style="font-size: 20px; color: ${paleta.sky}; opacity: 0.95;">${slide.subtitulo}</p>` : ""}
  </div>
  
  <!-- Footer -->
  <div class="slide-footer" style="color: ${paleta.sky}; position: relative; z-index: 10; border-top-color: rgba(200,217,230,0.2);">
    <span>${marca.handle}</span>
    <span>CRECI ${marca.creci1} · ${marca.creci2}</span>
  </div>
</div>`
  }
  
  // Capa sem foto (layout original limpo)
  return `<div class="slide" style="background: ${paleta.navy}; color: ${paleta.beige};">
  <div class="slide-header">
    <div style="font-size: 14px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: ${paleta.sky};">Patrícia e Júlio</div>
    <div class="slide-counter" style="color: ${paleta.sky};">${slideNum}/${total}</div>
  </div>
  <div class="slide-content">
    <div class="eyebrow" style="color: ${paleta.teal};">Corretores de Imóveis</div>
    <h1>${slide.titulo || ""}</h1>
    ${slide.subtitulo ? `<p class="corpo" style="margin-top: 30px; font-size: 24px;">${slide.subtitulo}</p>` : ""}
  </div>
  <div class="slide-footer" style="color: ${paleta.sky};">
    <span>${marca.handle}</span>
    <span>CRECI ${marca.creci1} · ${marca.creci2}</span>
  </div>
</div>`
}

function gerarSlideFoto(
  slide: SlideContent,
  slideNum: number,
  total: number,
  paleta: TemplateConfig["paleta"],
  marca: TemplateConfig["marca"],
  fotoUrl?: string
): string {
  if (!fotoUrl) {
    // Fallback para slide solo se não tem foto
    return gerarSlideSolo(slide, slideNum, total, paleta, marca)
  }
  
  // Slide com foto de fundo + texto sobreposto (padrão da marca)
  return `<div class="slide" style="position: relative; overflow: hidden;">
  <!-- Foto de fundo -->
  <img src="${fotoUrl}" alt="" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center;" />
  
  <!-- Overlay gradiente (mais sutil e seguindo a paleta) -->
  <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(47,65,86,0.2) 0%, rgba(47,65,86,0.7) 50%, ${paleta.navy} 100%);"></div>
  
  <!-- Header -->
  <div class="slide-header" style="position: relative; z-index: 10; color: ${paleta.beige};">
    <div style="font-size: 14px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(245,239,235,0.9);">Patrícia e Júlio</div>
    <div class="slide-counter" style="color: rgba(245,239,235,0.8);">${slideNum}/${total}</div>
  </div>
  
  <!-- Conteúdo alinhado embaixo -->
  <div style="position: relative; z-index: 10; padding: 0 70px 100px; margin-top: auto; display: flex; flex-direction: column; justify-content: flex-end; flex: 1;">
    ${slide.titulo ? `<h2 style="color: ${paleta.beige}; font-size: 58px; line-height: 1.1; margin-bottom: 20px; text-shadow: 0 2px 20px rgba(0,0,0,0.4);">${slide.titulo}</h2>` : ""}
    ${slide.corpo ? `<p class="corpo" style="color: ${paleta.beige}; opacity: 0.95; text-shadow: 0 1px 10px rgba(0,0,0,0.5);">${slide.corpo}</p>` : ""}
  </div>
  
  <!-- Footer -->
  <div class="slide-footer" style="color: ${paleta.beige}; position: relative; z-index: 10; border-top-color: rgba(245,239,235,0.2);">
    <span>${marca.handle}</span>
    <span>CRECI ${marca.creci1} · ${marca.creci2}</span>
  </div>
</div>`
}

function gerarSlideSolo(
  slide: SlideContent,
  slideNum: number,
  total: number,
  paleta: TemplateConfig["paleta"],
  marca: TemplateConfig["marca"]
): string {
  return `<div class="slide" style="background: ${paleta.beige}; color: ${paleta.navy};">
  <div class="slide-header">
    <div style="font-size: 14px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase;">Patrícia e Júlio</div>
    <div class="slide-counter" style="color: ${paleta.navy}; opacity: 0.6;">${slideNum}/${total}</div>
  </div>
  <div class="slide-content">
    <div class="eyebrow" style="color: ${paleta.teal}; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3em; margin-bottom: 20px;">Dica</div>
    <h2>${slide.titulo || ""}</h2>
    <div class="regua" style="background: ${paleta.teal};"></div>
    <p class="corpo" style="color: ${paleta.navy};">${slide.corpo || ""}</p>
  </div>
  <div class="slide-footer" style="color: ${paleta.navy}; opacity: 0.7; border-top-color: rgba(47,65,86,0.12);">
    <span>${marca.handle}</span>
    <span>CRECI ${marca.creci1} · ${marca.creci2}</span>
  </div>
</div>`
}

function gerarSlideDuo(
  slide: SlideContent,
  slideNum: number,
  total: number,
  paleta: TemplateConfig["paleta"],
  marca: TemplateConfig["marca"]
): string {
  // Duo usa fundo navy (diferente do solo que usa beige)
  return `<div class="slide" style="background: ${paleta.navy}; color: ${paleta.beige};">
  <div class="slide-header">
    <div style="font-size: 14px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: ${paleta.sky};">Patrícia e Júlio</div>
    <div class="slide-counter" style="color: ${paleta.sky}; opacity: 0.6;">${slideNum}/${total}</div>
  </div>
  <div class="slide-content">
    <div class="eyebrow" style="color: ${paleta.sky}; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3em; margin-bottom: 20px;">Importante</div>
    <h2>${slide.titulo || ""}</h2>
    <div class="regua" style="background: ${paleta.teal};"></div>
    <p class="corpo">${slide.corpo || ""}</p>
  </div>
  <div class="slide-footer" style="color: ${paleta.sky}; opacity: 0.7; border-top-color: rgba(200,217,230,0.12);">
    <span>${marca.handle}</span>
    <span>CRECI ${marca.creci1} · ${marca.creci2}</span>
  </div>
</div>`
}

function gerarSlideNumero(
  slide: SlideContent,
  slideNum: number,
  total: number,
  paleta: TemplateConfig["paleta"],
  marca: TemplateConfig["marca"]
): string {
  // Número usa fundo beige (variação)
  return `<div class="slide" style="background: ${paleta.beige}; color: ${paleta.navy};">
  <div class="slide-header">
    <div style="font-size: 14px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase;">Patrícia e Júlio</div>
    <div class="slide-counter" style="opacity: 0.6;">${slideNum}/${total}</div>
  </div>
  <div class="slide-content">
    <div class="eyebrow" style="color: ${paleta.teal}; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3em; margin-bottom: 20px;">Números</div>
    <div class="numero-gigante" style="color: ${paleta.teal}; opacity: 0.85; margin-bottom: -60px;">${slide.numero || ""}</div>
    <h2 style="font-size: 56px;">${slide.titulo || ""}</h2>
    <p class="corpo" style="margin-top: 25px;">${slide.corpo || ""}</p>
  </div>
  <div class="slide-footer" style="opacity: 0.7; border-top-color: rgba(47,65,86,0.12);">
    <span>${marca.handle}</span>
    <span>CRECI ${marca.creci1} · ${marca.creci2}</span>
  </div>
</div>`
}

function gerarSlideCTA(
  slide: SlideContent,
  slideNum: number,
  total: number,
  paleta: TemplateConfig["paleta"],
  marca: TemplateConfig["marca"]
): string {
  return `<div class="slide" style="background: ${paleta.navy}; color: ${paleta.beige};">
  <div class="slide-header">
    <div style="font-size: 18px; font-weight: 700;">PJ</div>
    <div class="slide-counter" style="color: ${paleta.sky};">${slideNum}/${total}</div>
  </div>
  <div class="slide-content" style="align-items: center; text-align: center;">
    <h2 style="font-size: 52px; text-align: center;">${slide.titulo || ""}</h2>
    ${slide.corpo ? `<p class="corpo" style="margin-top: 30px; max-width: 600px;">${slide.corpo}</p>` : ""}
    ${slide.cta ? `<a href="#" class="cta-button" style="background: ${paleta.teal}; color: ${paleta.navy};">${slide.cta}</a>` : ""}
  </div>
  <div class="slide-footer" style="color: ${paleta.sky};">
    <span>${marca.handle}</span>
    <span>CRECI ${marca.creci1} · ${marca.creci2}</span>
  </div>
</div>`
}

/**
 * Renderiza HTML em PNGs via Playwright.
 * Retorna array de Buffers (um por slide).
 *
 * Prefira `renderizarVarias([html1, html2, ...])` quando for gerar múltiplas
 * versões — launcha o Chromium 1 vez só, o que economiza 3-5s por versão
 * extra e evita OOM/timeout na serverless da Vercel.
 */
export async function renderizarPNGs(html: string, tipo: TipoCriativo): Promise<Buffer[]> {
  const grupos = await renderizarVarias([html], tipo)
  return grupos[0] || []
}

/**
 * Renderiza N HTMLs em N grupos de PNGs, reusando o mesmo browser.
 *
 * Retorna: `[versao0PNGs[], versao1PNGs[], ...]`
 *
 * Ganho concreto: 5 versões antes eram 5 launches × 3-5s cold start (sparticuz)
 * + 5 renders = ~40s. Agora é 1 launch + 5 renders = ~15s. Sobra folga pro
 * LLM e Vercel Blob dentro dos 60s de `maxDuration`.
 */
export async function renderizarVarias(htmls: string[], tipo: TipoCriativo): Promise<Buffer[][]> {
  if (htmls.length === 0) return []

  const [width, height] = tipo === "story" || tipo === "reels"
    ? [1080, 1920]
    : [1080, 1350]

  const browser = await launchChromium()
  const resultado: Buffer[][] = []

  try {
    // deviceScaleFactor: na lambda usamos 1 (1080px nativo — memória 4x menor
    // que @2x, evita OOM). Local/self-host mantém 2 (retina) pra qualidade.
    const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: isServerless ? 1 : 2,
    })

    for (const html of htmls) {
      const page = await context.newPage()
      try {
        // Converte imagens locais pra base64 antes de carregar
        const htmlComImagensBase64 = await converterImagensParaBase64(html)

        // "load" em vez de "networkidle": o template carrega Google Fonts via
        // <link>, e networkidle exige 500ms de silêncio total de rede — na
        // serverless da Vercel, a latência do CDN do Google faz isso demorar
        // 10-30s (ou estourar timeout). "load" apenas espera onload disparar,
        // que é ~1-2s. Depois esperamos explicitamente as fontes prontas.
        await page.setContent(htmlComImagensBase64, {
          waitUntil: "load",
          timeout: 15000,
        })

        // Aguarda o document.fonts terminar. Se levar mais de 3s (fonts
        // externas travadas), segue mesmo assim — melhor screenshot com
        // system font fallback do que timeout na lambda.
        await page.evaluate(async () => {
          try {
            await Promise.race([
              (document as unknown as { fonts: { ready: Promise<void> } }).fonts.ready,
              new Promise((r) => setTimeout(r, 3000)),
            ])
          } catch { /* segue */ }
        })

        const slides = await page.locator(".slide").all()
        const pngs: Buffer[] = []
        for (const slide of slides) {
          const screenshot = await slide.screenshot({ type: "png" })
          pngs.push(screenshot)
        }
        resultado.push(pngs)
      } catch (err) {
        console.error("[renderizarVarias] falha numa versão:", (err as Error).message)
        resultado.push([])
      } finally {
        // Fecha a page mas mantém o browser+context vivos pra próxima iteração
        try { await page.close() } catch { /* ignore */ }
      }
    }
  } finally {
    try { await browser.close() } catch { /* ignore */ }
  }

  return resultado
}

/**
 * Converte todas as imagens locais (<img src="/...") para base64 inline.
 */
async function converterImagensParaBase64(html: string): Promise<string> {
  const fs = await import("fs/promises")
  const path = await import("path")
  
  // Regex para pegar todos os src="/..." em tags img
  const imgRegex = /<img\s+[^>]*src=["']([^"']+)["']/g
  let htmlModificado = html
  
  const matches = Array.from(html.matchAll(imgRegex))
  
  for (const match of matches) {
    const srcOriginal = match[1]
    
    // Só processa caminhos locais que começam com /
    if (!srcOriginal.startsWith("/") || srcOriginal.startsWith("//")) {
      continue
    }
    
    try {
      // Converte /imoveis/foto.png para c:\...\site\public\imoveis\foto.png
      const caminhoArquivo = path.join(process.cwd(), "public", srcOriginal)
      const buffer = await fs.readFile(caminhoArquivo)
      
      // Detecta tipo MIME pela extensão
      const ext = path.extname(srcOriginal).toLowerCase()
      const mimeType = ext === ".png" ? "image/png"
        : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg"
        : ext === ".svg" ? "image/svg+xml"
        : "image/png"
      
      const base64 = buffer.toString("base64")
      const dataUri = `data:${mimeType};base64,${base64}`
      
      // Substitui o src original pelo data URI
      htmlModificado = htmlModificado.replace(srcOriginal, dataUri)
      
      console.log(`  ✓ Imagem convertida: ${srcOriginal} → base64 (${(buffer.length / 1024).toFixed(1)}KB)`)
    } catch (err) {
      console.error(`  ✗ Erro ao carregar imagem ${srcOriginal}:`, (err as Error).message)
    }
  }
  
  return htmlModificado
}
