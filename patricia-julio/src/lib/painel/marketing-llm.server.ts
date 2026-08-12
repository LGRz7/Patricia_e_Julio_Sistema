/**
 * marketing-llm.server.ts — o compositor.
 *
 * Chama a OpenAI (gpt-4o-mini por default) com:
 *   - a MEMÓRIA VIVA do MazyOS (marketing-contexto.server.ts)
 *   - as regras de layout da skill /carrossel
 *   - o pedido do corretor + persona + imóvel (se houver)
 *
 * O LLM devolve JSON estruturado com HTML+CSS completo pra render.
 * NÃO é template com slot — é HTML novo escrito na hora, obedecendo a
 * paleta e a tipografia do design-guide.
 *
 * Rodapé oficial (CRECIs) sempre presente — a instrução no prompt garante.
 */
import "server-only"
import { carregarContextoMazyOS, type ContextoMazyOS } from "./marketing-contexto.server"
import type { Imovel } from "@/types/imovel"
import type { TipoCriativo } from "@/types/marketing"
import { getPersona } from "@/data/painel/personas"

// ============================================================
// Tipos
// ============================================================

export interface EntradaGerador {
  /** Prompt do corretor — o QUE ele quer (não vai literalmente no post). */
  prompt: string
  /** Persona alvo. Uma só por criativo. */
  personaId: string
  /** Formato do post — dita dimensões e ritmo. */
  tipo: TipoCriativo
  /** Imóvel do catálogo, quando o post é sobre um imóvel específico. */
  imovel?: Imovel | null
  /** Foco do post — quem/o quê aparece. */
  formato: "corretores" | "imovel" | "copy"
}

export interface SaidaGerador {
  /** Título curto do carrossel/post (pro histórico). */
  titulo: string
  /** HTML completo com todos os slides — cada slide é `<div class="slide">`. */
  html: string
  /** Legenda pronta pra colar no Instagram, com hashtags. */
  legenda: string
  /** Quantidade de slides no HTML. */
  slidesCount: number
  /** Anotações do sistema (o que puxou de contexto, o que assumiu). */
  notas: string[]
  /** Metadados da chamada. */
  meta: {
    modelo: string
    tokensInput: number
    tokensOutput: number
    contexto: { fontesCarregadas: string[]; fontesFaltantes: string[] }
  }
}

// ============================================================
// Dimensões por tipo (mesmas do /carrossel do MazyOS)
// ============================================================
export function dimensoesPor(tipo: TipoCriativo): { w: number; h: number } {
  if (tipo === "story" || tipo === "reels") return { w: 1080, h: 1920 }
  return { w: 1080, h: 1350 }
}

function aspectoPor(tipo: TipoCriativo): string {
  const d = dimensoesPor(tipo)
  return d.w === d.h ? "1:1" : d.w < d.h ? `${d.w}:${d.h}` : `${d.w}:${d.h}`
}

function quantidadeSlidesSugerida(tipo: TipoCriativo): { min: number; max: number } {
  if (tipo === "post") return { min: 1, max: 1 }
  if (tipo === "story") return { min: 1, max: 1 }
  if (tipo === "reels") return { min: 1, max: 1 }
  return { min: 5, max: 8 } // carrossel
}

// ============================================================
// Compositor principal
// ============================================================

export async function gerarComOpenAI(entrada: EntradaGerador): Promise<SaidaGerador> {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    throw new Error(
      "OPENAI_API_KEY não configurada. Adiciona no arquivo MazyOS/site/.env.local:\n" +
      "OPENAI_API_KEY=sk-...\n" +
      "Depois reinicia o dev server (npm run dev)."
    )
  }

  const contexto = await carregarContextoMazyOS()
  const persona = getPersona(entrada.personaId)
  const systemPrompt = montarSystemPrompt(entrada, contexto, persona)
  const userPrompt = montarUserPrompt(entrada)

  const modelo = process.env.OPENAI_MODEL || "gpt-4o-mini"

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: modelo,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 8000,
      response_format: { type: "json_object" },
    }),
  })

  if (!resp.ok) {
    const errText = await resp.text()
    let userMsg = `OpenAI erro ${resp.status}`
    if (resp.status === 401) userMsg = "OpenAI recusou a chave. Verifica se OPENAI_API_KEY em .env.local está correta."
    else if (resp.status === 429) userMsg = "OpenAI: cota/limite atingido. Confere créditos em platform.openai.com."
    else if (resp.status >= 500) userMsg = "OpenAI fora do ar. Tenta de novo em 30s."
    throw new Error(`${userMsg}\n\n${errText.slice(0, 500)}`)
  }

  const data = await resp.json()
  const content: string = data.choices?.[0]?.message?.content
  if (!content) throw new Error("OpenAI retornou vazio")

  let parsed: {
    titulo?: string
    slidesCount?: number
    html?: string
    legenda?: string
    notas?: string[]
  }
  try {
    parsed = JSON.parse(content)
  } catch (err) {
    throw new Error(`OpenAI devolveu JSON inválido: ${(err as Error).message}\n\nBruto: ${content.slice(0, 300)}`)
  }

  if (!parsed.html || typeof parsed.html !== "string") {
    throw new Error("OpenAI não retornou o campo 'html' esperado. Tenta de novo — às vezes o modelo escorrega no formato.")
  }

  return {
    titulo: parsed.titulo || "Sem título",
    html: parsed.html,
    legenda: parsed.legenda || "",
    slidesCount: parsed.slidesCount || contarSlides(parsed.html),
    notas: Array.isArray(parsed.notas) ? parsed.notas : [],
    meta: {
      modelo,
      tokensInput: data.usage?.prompt_tokens || 0,
      tokensOutput: data.usage?.completion_tokens || 0,
      contexto: {
        fontesCarregadas: contexto.fontesCarregadas,
        fontesFaltantes: contexto.fontesFaltantes,
      },
    },
  }
}

// ============================================================
// System prompt — o "programa" que o LLM segue
// ============================================================

function montarSystemPrompt(
  entrada: EntradaGerador,
  contexto: ContextoMazyOS,
  persona: ReturnType<typeof getPersona>,
): string {
  const dims = dimensoesPor(entrada.tipo)
  const slidesInfo = quantidadeSlidesSugerida(entrada.tipo)

  const focoFormato = {
    corretores: "Post apresenta OS DOIS CORRETORES juntos (Patrícia + Júlio). Foto/silhueta/ilustração de dupla. Foco em autoridade + recall do profissional. Não descrever imóvel específico.",
    imovel: `Post apresenta um IMÓVEL específico. Use os dados reais fornecidos. Foco em vender esse imóvel. Foto do imóvel é o herói visual.`,
    copy: "Post SEM IMAGEM. A copy é o post inteiro. Layout tipográfico grande, sem foto de fundo — só cor sólida da paleta + tipografia. Ideal pra reflexão, dica, comparativo, thread.",
  }[entrada.formato]

  return `Você é o COMPOSITOR VISUAL do MazyOS — o mesmo motor da skill /carrossel do Claude Code, mas rodando via API.

Seu trabalho: transformar o pedido do corretor em UM CARROSSEL/POST completo — copy nova, HTML+CSS novo, layout novo. NUNCA usar template pré-fabricado. Cada carrossel é único mas OBEDECE ESTRITAMENTE a identidade visual + tom de voz abaixo.

═══════════════════════════════════════════════════════════════════
MEMÓRIA DO NEGÓCIO (leia com atenção — é a fonte da verdade)
═══════════════════════════════════════════════════════════════════

${contexto.texto}

═══════════════════════════════════════════════════════════════════
FORMATO SOLICITADO
═══════════════════════════════════════════════════════════════════

- Tipo: ${entrada.tipo} (${aspectoPor(entrada.tipo)})
- Dimensões: ${dims.w}×${dims.h} px (cada slide)
- Quantidade de slides: ${slidesInfo.min === slidesInfo.max ? slidesInfo.min : `entre ${slidesInfo.min} e ${slidesInfo.max}`}
- Foco: ${focoFormato}
${persona ? `- Persona: ${persona.name} (${persona.age[0]}-${persona.age[1]} anos, R$${persona.incomeBrl[0]}+). Produto que ela busca: ${persona.product}. Objeção principal: ${persona.objection}. Um criativo, UMA persona — não misture.` : ""}
${entrada.imovel ? montarBlocoImovel(entrada.imovel) : ""}

═══════════════════════════════════════════════════════════════════
REGRAS DE COMPOSIÇÃO (do MazyOS /carrossel — não negociáveis)
═══════════════════════════════════════════════════════════════════

**TIPOGRAFIA (obrigatório)**
- Títulos e destaques: fonte serifada elegante — usar "Playfair Display" via Google Fonts, peso 700 ou 900
- Corpo, subtítulos, botões: fonte sans clean — usar "Inter" via Google Fonts, pesos 400/500/600/700/800
- Título grande: 80-100px, weight 900, line-height 0.98, letter-spacing -0.03em
- Eyebrow/etiqueta (UPPERCASE): 13-16px, weight 800, letter-spacing 0.22em-0.30em, cor de destaque
- Corpo: 22-26px, weight 500, line-height 1.5
- Numeral gigante (layout NÚMERO): 200-320px, weight 800, cor sky ou teal

**PALETA (fixa — do design-guide)**
- Navy #2F4156 · Teal #567C8D · Sky #C8D9E6 · Beige #F5EFEB · White #FFFFFF
- Ritmo de slide a slide: alternar fundo escuro ↔ claro ↔ destaque. NUNCA dois slides seguidos com o mesmo fundo.
- Texto sobre fundo escuro: Beige ou White. Texto sobre claro: Navy.

**LAYOUTS NOMEADOS (misture — nunca todo slide igual)**
- CAPA: eyebrow + título grande + subtítulo + @handle. Fundo: cor sólida ou foto com overlay navy 65%.
- SOLO: split horizontal — 50% imagem/cor + 50% texto (kicker + h2 + régua sky 3px + parágrafo)
- DUO: texto em cima + 2 blocos lado a lado embaixo (cards, comparativos)
- NÚMERO: numeral gigante (250px+) como elemento gráfico + h2 + parágrafo
- CITAÇÃO: aspas grandes em watermark + frase serifada + atribuição
- CTA FINAL: fundo Teal ou Navy, nome dos corretores centralizado, headline curta, CTA WhatsApp

**RODAPÉ OFICIAL (obrigatório em TODOS os slides)**
No canto inferior de cada slide, em Inter 600, tamanho 18-22px, opacidade 0.75:
"Patrícia Vidal · CRECI 68850 | Júlio Aguiar · CRECI 79271"
E no lado oposto: "@julio_e_patricia_corretores" (Inter 700, cor sky ou teal)

**PROIBIDO**
- Emoji decorativo, gradiente arco-íris, clip-art, cores fora da paleta
- Palavras: "vamos juntos", "realize seu sonho", "imóvel dos seus sonhos", "alavancar", "sinergia", "caro cliente"
- Frases genéricas que qualquer corretor usaria — o objetivo é DIFERENCIAL
- Inventar CRECI, área, preço, comodidade que não estejam no contexto
- Dois slides com o mesmo fundo em sequência
- Logo de marca (eles NÃO são CNPJ — a identificação é sempre nome + CRECI)

═══════════════════════════════════════════════════════════════════
FORMATO DE SAÍDA (JSON — obrigatório)
═══════════════════════════════════════════════════════════════════

Retorne APENAS este JSON (sem markdown, sem preâmbulo):

{
  "titulo": "string curta (até 60 chars) — identifica o carrossel",
  "slidesCount": <número de slides>,
  "html": "<style>...</style><div class=\\"slide\\">...</div><div class=\\"slide\\">...</div>...",
  "legenda": "legenda completa pro Instagram — hook + contexto + CTA + hashtags — pronta pra colar",
  "notas": ["frases curtas explicando decisões — ex: 'usei foto placeholder pq você não enviou foto', 'assumi preço da faixa do bairro'"]
}

**Regras do html:**
- Comece com um único bloco <style> global. Depois, N \`<div class="slide">\`, um por slide.
- Cada .slide DEVE ter exatamente ${dims.w}x${dims.h}px, position: relative, overflow: hidden.
- Cada .slide DEVE conter o rodapé oficial (CRECIs + handle).
- Use CSS inline nos elementos quando fizer sentido (evita conflito). Fonts são carregadas do Google Fonts pelo container (não precisa @import — só use font-family).
- Se tiver foto do imóvel disponível: use \`background-image: url('CAMINHO_QUE_EU_TE_DEI')\`. Se não tiver: use fundo sólido da paleta e um elemento decorativo (numeral, aspas, forma geométrica sky/teal).
- HTML válido, sem <script>, sem depend externa exceto Google Fonts (que o renderer carrega).

Comece direto pelo JSON. Sem texto antes ou depois.`
}

function montarBlocoImovel(imovel: Imovel): string {
  const linhas: string[] = [`- Imóvel do catálogo:`]
  linhas.push(`  · Título: ${imovel.titulo}`)
  linhas.push(`  · Localização: ${imovel.localizacao}`)
  if (imovel.valor) linhas.push(`  · Valor: R$ ${imovel.valor.toLocaleString("pt-BR")}`)
  linhas.push(`  · Tipo: ${imovel.tipo}`)
  if (imovel.quartos) linhas.push(`  · Quartos: ${imovel.quartos}`)
  if (imovel.suites) linhas.push(`  · Suítes: ${imovel.suites}`)
  if (imovel.banheiros) linhas.push(`  · Banheiros: ${imovel.banheiros}`)
  if (imovel.vagas) linhas.push(`  · Vagas: ${imovel.vagas}`)
  if (imovel.area) linhas.push(`  · Área: ${imovel.area}m²`)
  if (imovel.resumo) linhas.push(`  · Resumo: ${imovel.resumo}`)
  if (imovel.diferenciais?.length) linhas.push(`  · Diferenciais: ${imovel.diferenciais.join(", ")}`)
  const fotos = imovel.imagens?.filter((i) => i.src).slice(0, 3)
  if (fotos?.length) {
    linhas.push(`  · Fotos disponíveis (USE nos slides via background-image):`)
    fotos.forEach((f, i) => linhas.push(`    [${i + 1}] ${f.src} — ${f.alt} (${f.orientacao || "horizontal"})`))
  } else {
    linhas.push(`  · SEM FOTOS reais — use fundo sólido da paleta + tipografia grande.`)
  }
  return linhas.join("\n")
}

// ============================================================
// User prompt
// ============================================================
function montarUserPrompt(entrada: EntradaGerador): string {
  return `Pedido do corretor:

"""
${entrada.prompt}
"""

Componha o ${entrada.tipo} agora, seguindo TODAS as regras. Retorne o JSON.`
}

// ============================================================
// Helpers
// ============================================================
function contarSlides(html: string): number {
  const matches = html.match(/<div\s+class="slide"/gi)
  return matches?.length || 1
}
