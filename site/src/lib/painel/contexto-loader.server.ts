/**
 * contexto-loader.server.ts — carrega a memória viva e monta o system prompt
 * do PLANEJADOR (etapa 1). O planejador é um LLM texto que, dado o brief do
 * corretor + memória da marca, devolve um JSON com estrutura de slides:
 *
 *   {
 *     slides: [
 *       { type: "capa", titulo: "...", subtitulo: "..." },
 *       { type: "solo", titulo: "...", corpo: "..." },
 *       { type: "cta", titulo: "...", corpo: "...", cta: "..." }
 *     ],
 *     caption: "legenda pronta pra Instagram (PT-BR, com hashtags)",
 *     descricao: "o que o sistema entendeu do pedido (PT-BR, curto)"
 *   }
 *
 * Os slides alimentam templates HTML/CSS renderizados em PNG via Playwright.
 */
import "server-only"
import path from "path"
import { promises as fs } from "fs"
import { getPersona, PERSONAS, REGRAS_CRIATIVO } from "@/data/painel/personas"
import { profissionais } from "@/data/profissionais"
import type { Imovel } from "@/types/imovel"
import type { FormatoPost, TipoCriativo } from "@/types/marketing"

const MAZY_ROOT = path.resolve(process.cwd(), "..")

const ARQUIVOS_MEMORIA = [
  ["_memoria/empresa.md",       "Empresa"],
  ["_memoria/publico-alvo.md",  "Público-alvo (5 personas)"],
  ["_memoria/preferencias.md",  "Preferências de tom"],
  ["_memoria/estrategia.md",    "Estratégia do momento"],
  ["identidade/design-guide.md","Design guide (paleta oficial, tipografia)"],
] as const

async function readIfExists(rel: string): Promise<string> {
  try { return await fs.readFile(path.join(MAZY_ROOT, rel), "utf8") }
  catch { return "" }
}

export async function montarSystemPromptPlanejador(opts: {
  formato: FormatoPost
  tipo: TipoCriativo
  personaId?: string
  imovel?: Imovel | null
}): Promise<string> {
  const partes: string[] = []

  partes.push(`Você é o planejador visual do painel dos corretores Patrícia Vidal (CRECI 68850) e Júlio Aguiar (CRECI 79271), atuando em Niterói / Maricá / Rio de Janeiro.

TAREFA: ler o brief do corretor (em PT-BR) e produzir um plano em JSON com prompts em INGLÊS pro modelo de geração de imagem (gpt-image-2) + a legenda pronta em PT-BR pro Instagram.

SAÍDA — JSON estrito, nada mais:
{
  "descricao": "1 frase em PT-BR resumindo o que você entendeu do pedido",
  "imagePrompts": [ /* array de prompts EM INGLÊS pra gpt-image-2 */ ],
  "caption": "legenda pronta pra Instagram em PT-BR (hook + contexto + CTA + hashtags)"
}

QUANTIDADE DE PROMPTS:
- tipo "post" ou "story"     → 1 prompt (post/story único)
- tipo "carrossel"           → entre 3 e 7 prompts, um por slide (capa + internos + CTA final)
- tipo "reels"               → 1 prompt (só capa/thumbnail, é um vídeo)

REGRAS DOS PROMPTS DE IMAGEM (obedeça EXATAMENTE):
- Escreva em INGLÊS, formato editorial premium real-estate/branding.
- Sempre incluir a paleta: "navy #2F4156, teal #567C8D, sky blue #C8D9E6, beige #F5EFEB". Sem cores fora dessa lista.
- Sempre incluir a tipografia: "elegant serif headline (Playfair Display or similar) paired with clean sans-serif body (Inter)".
- Aspect ratio: ${opts.tipo === "story" || opts.tipo === "reels" ? "9:16 vertical" : "4:5 vertical (Instagram post)"}.
- Estilo geral: "editorial, minimalist, sophisticated, high-end real estate branding, sober palette, generous white space, no clichés, no stock-photo feel".
- Sempre incluir CRECIs no rodapé: "footer with 'Patrícia Vidal — CRECI 68850 | Júlio Aguiar — CRECI 79271' in small sans-serif type".
- Sempre incluir handle: "@julio_e_patricia_corretores".
- PROIBIDO em qualquer imagem: rainbow gradient, neon, purple tech, red/green/yellow saturated, corporate stock photography, generic clip-art, cheesy real-estate icons.
- Cada slide de carrossel deve ter LAYOUT DIFERENTE do anterior (alternar CAPA / SOLO / DUO / NÚMERO / CITAÇÃO / CTA FINAL). Nomeie o layout na 1ª palavra do prompt.
- Slide final de carrossel: SEMPRE CTA no fundo Navy, "chama no WhatsApp" ou similar.

REGRAS DA LEGENDA (caption):
- PT-BR direto, sem corporativês.
- ${REGRAS_CRIATIVO.clichesProibidos.map(c => `PROIBIDO: "${c}"`).join(" · ")}.
- Estrutura: (1) hook em 1ª linha · (2) contexto 2-3 frases · (3) CTA claro · (4) linha em branco · (5) hashtags 8-12 (nicho + local + público).
- Uma persona por peça — não misture.
- Não invente números, prêmios, tempo de mercado.
- Sempre termine com hashtags: #patriciaejulio #imoveis + variações do bairro/persona.`)

  // ===== Memória viva =====
  partes.push("\n===== MEMÓRIA VIVA (fonte de verdade) =====")
  for (const [rel, titulo] of ARQUIVOS_MEMORIA) {
    const conteudo = (await readIfExists(rel)).trim()
    if (conteudo) partes.push(`\n### ${titulo} (${rel})\n${conteudo}`)
  }

  // ===== Corretores =====
  partes.push("\n===== CORRETORES =====")
  for (const p of profissionais) {
    partes.push(`- ${p.nome} · ${p.creci} · ${p.papel}${p.bio ? " · " + p.bio : ""}`)
  }

  // ===== Persona =====
  const persona = opts.personaId ? getPersona(opts.personaId) : null
  if (persona) {
    partes.push(`\n===== PERSONA-ALVO =====`)
    partes.push(`${persona.name} · ${persona.age[0]}–${persona.age[1]} anos · R$ ${persona.incomeBrl[0]}+ / mês`)
    partes.push(`Regiões: ${persona.regions.join(", ")}`)
    partes.push(`Produto: ${persona.product}`)
    partes.push(`Dores: ${persona.pain.join(" · ")}`)
    partes.push(`Ganchos: ${persona.hook.join(" · ")}`)
    partes.push(`Objeção: ${persona.objection}`)
    partes.push(`Fechamento: ${persona.closer}`)
  } else {
    partes.push(`\n===== PERSONAS DISPONÍVEIS (escolha UMA pelo texto do corretor) =====`)
    for (const p of PERSONAS) {
      partes.push(`- ${p.id}: ${p.name} — ${p.product}`)
    }
  }

  // ===== Imóvel específico =====
  if (opts.imovel) {
    const i = opts.imovel
    partes.push(`\n===== IMÓVEL DO CATÁLOGO (use SÓ dados daqui, NÃO invente atributos) =====`)
    partes.push(`Título: ${i.titulo}`)
    partes.push(`Localização: ${i.localizacao}`)
    partes.push(`Tipo: ${i.tipo}`)
    if (i.valor) partes.push(`Valor: R$ ${i.valor.toLocaleString("pt-BR")}`)
    if (i.quartos) partes.push(`Quartos: ${i.quartos}`)
    if (i.suites) partes.push(`Suítes: ${i.suites}`)
    if (i.vagas) partes.push(`Vagas: ${i.vagas}`)
    if (i.area) partes.push(`Área: ${i.area}m²`)
    if (i.resumo) partes.push(`Resumo: ${i.resumo}`)
    if (i.diferenciais?.length) partes.push(`Diferenciais: ${i.diferenciais.join(" · ")}`)
  }

  // ===== Regras do formato =====
  partes.push(`\n===== FORMATO PEDIDO: ${opts.formato} · ${opts.tipo} =====`)
  if (opts.formato === "corretores") {
    partes.push(`- Todo prompt de imagem deve mencionar "editorial portrait style scene featuring a Brazilian real estate duo (a woman and a man, professional attire, warm and approachable)".`)
    partes.push(`- Foco: autoridade + recall do profissional, NÃO um imóvel específico.`)
    partes.push(`- Copy em 1ª pessoa do plural. "A gente atende junto."`)
  } else if (opts.formato === "imovel") {
    partes.push(`- Todo prompt deve mencionar "professional interior/exterior real-estate photography of ${opts.imovel?.titulo || "the property"}, ${opts.imovel?.tipo || ""}".`)
    partes.push(`- Use SOMENTE atributos que estão no bloco IMÓVEL. Nunca invente área/preço.`)
  } else {
    partes.push(`- Formato "só copy" — todo prompt de imagem deve descrever "minimalist typographic Instagram post design, big serif headline in navy on beige background, no photography, editorial magazine style". Nada de foto realista.`)
  }

  partes.push(`\nRETORNE APENAS O JSON. Sem markdown, sem \`\`\`, sem preâmbulo.`)

  return partes.join("\n")
}
