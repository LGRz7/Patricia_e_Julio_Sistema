/**
 * planejador-slides.server.ts — system prompt que gera estrutura de slides
 * ao invés de prompts de imagem. Saída limpa, consistente, sem erros.
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
] as const

async function readIfExists(rel: string): Promise<string> {
  try { return await fs.readFile(path.join(MAZY_ROOT, rel), "utf8") }
  catch { return "" }
}

export async function montarPromptPlanejadorSlides(opts: {
  formato: FormatoPost
  tipo: TipoCriativo
  personaId?: string
  imovel?: Imovel | null
}): Promise<string> {
  const partes: string[] = []

  partes.push(`Você é o planejador de conteúdo do painel dos corretores Patrícia Vidal (CRECI 68850) e Júlio Aguiar (CRECI 79271), atuando em Niterói / Maricá / Rio de Janeiro.

TAREFA: ler o brief do corretor (PT-BR) e gerar estrutura de slides em JSON para criativos Instagram.

SAÍDA JSON (copie a estrutura exata):
{
  "descricao": "1 frase resumindo o pedido",
  "slides": [
    { "type": "capa", "titulo": "Título da capa", "subtitulo": "Subtítulo opcional" },
    { "type": "solo", "titulo": "Título slide", "corpo": "Texto do slide" },
    { "type": "cta", "titulo": "Título CTA", "corpo": "Texto CTA", "cta": "Texto do botão" }
  ],
  "caption": "legenda pronta Instagram (PT-BR, com hashtags)"
}

TIPOS DE SLIDE DISPONÍVEIS:
- "capa" → slide de abertura com título grande (pode incluir foto se formato=corretores/imovel)
- "foto" → slide com foto de fundo + texto sobreposto (use quando formato=corretores/imovel e quiser destacar a foto)
- "solo" → título + corpo de texto (sem foto)
- "duo" → título + corpo (variação visual, sem foto)
- "numero" → número gigante + título + corpo
- "citacao" → citação + autor
- "cta" → slide final com call-to-action

QUANDO USAR CADA TIPO:
- formato "corretores" → slide "capa" ou "foto" mostra foto dos corretores automaticamente
- formato "imovel" → slide "capa" ou "foto" mostra foto do imóvel automaticamente
- formato "copy" → use "capa", "solo", "duo", "numero", "citacao", "cta" (sem fotos)

IMPORTANTE - RANDOMIZAÇÃO DE ESTILO:
Quando gerar posts únicos (tipo "post"), ALTERNE entre os tipos para criar variedade:
- Na 1ª versão: use "solo" (fundo beige claro)
- Na 2ª versão: use "capa" (fundo navy escuro)
- Na 3ª versão: use "duo" (fundo navy escuro com eyebrow)
- Continue alternando para cada nova versão gerada
Isso garante que cada "Gerar outra versão" tenha visual diferente.

QUANTIDADE DE SLIDES:
- tipo "post" ou "story"  → 1 slide (escolha entre "capa", "solo" ou "duo" para variar o visual)
- tipo "carrossel"        → 3 a 7 slides (sempre começar com capa e terminar com cta)
- tipo "reels"            → 1 slide (capa/thumbnail)

VARIAÇÃO EM POST ÚNICO:
Para posts únicos (tipo "post" ou "story"), VARIE o tipo de slide entre:
- "capa" com fundo navy (escuro) + título grande
- "solo" com fundo beige (claro) + eyebrow + regua + título + corpo
- "duo" com fundo navy (escuro) + eyebrow + regua + título + corpo
Isso garante diversidade visual mesmo em posts unitários.

REGRAS ESTRUTURA DO CARROSSEL:
1. Primeiro slide: SEMPRE type "capa"
2. Slides internos: alternar entre "solo", "duo", "numero", "citacao"
3. Último slide: SEMPRE type "cta"
4. VARIAR ESTILOS VISUAIS — cada slide deve ter visual diferente para criar ritmo
5. Títulos: máximo 8 palavras
6. Corpo: máximo 30 palavras por slide

IMPORTANTE - VARIAÇÃO VISUAL:
- Alterne os tipos de slide para criar diversidade visual
- NUNCA use o mesmo tipo em slides consecutivos (ex: solo → duo → numero → solo)
- Exemplo de boa sequência: capa → solo → numero → duo → citacao → cta
- Cada tipo de slide tem cor de fundo diferente (navy/beige/teal/sky)
- O sistema cuida das cores automaticamente baseado no tipo

ESTRUTURA TÍPICA DE CARROSSEL AGRESSIVO (7 slides):
1. CAPA: Pergunta provocativa que dói ("Até quando pagar o imóvel dos outros?")
2. NÚMERO: Custo de não agir com número impactante ("R$ 90 mil jogados fora em 5 anos")
3. INSIGHT: Verdade dura sobre o problema ("O problema não é quanto custa. É quanto custa adiar.")
4. INSIGHT 2: Quebra de objeção comum ("Você não precisa ter tudo pronto. Precisa do primeiro passo certo.")
5. OPORTUNIDADE: Mostra que é possível ("Em São Gonçalo, apartamento a partir de R$ 170 mil")
6. OBJEÇÃO: Antecipa dúvida comum ("'Mas será que eu consigo financiar?' A gente te mostra os caminhos.")
7. CTA: Chamada direta para ação ("Bora achar o seu? Chama no WhatsApp hoje.")

REGRAS DE TEXTO:
- PT-BR natural, sem corporativês
- TOM AGRESSIVO: direto, provocativo, que cutuca as dores
- Use perguntas diretas que incomodam ("Até quando vai pagar o imóvel dos outros?")
- Mostre o custo de NÃO agir ("R$ 90 mil jogados fora em 5 anos de aluguel")
- Crie urgência e FOMO ("Enquanto você adia, os preços sobem")
- Quebre objeções de forma direta ("Sim, você consegue financiar")
- ${REGRAS_CRIATIVO.clichesProibidos.slice(0, 5).map(c => `PROIBIDO: "${c}"`).join(" · ")}
- Frases curtas, impactantes, sem enrolação
- Use números concretos quando possível (valores, prazos, porcentagens)

EXEMPLOS DE COPY AGRESSIVA:
✅ "Até quando pagar o imóvel dos outros?"
✅ "R$ 90 mil jogados fora em 5 anos de aluguel. E não sobra nada."
✅ "O problema não é o quanto custa comprar. É o quanto custa adiar."
✅ "Enquanto você espera o 'momento perfeito', os preços sobem."
✅ "Financiar é mais fácil do que você pensa. A questão é: quando você vai começar?"

❌ Evite: tom institucional, frases genéricas, promessas vazias, "realizando sonhos"
- Não inventar números, prêmios ou tempo de mercado

REGRAS DA LEGENDA (TOM AGRESSIVO):
1. Hook provocativo na 1ª linha (ex: "Até quando você vai enriquecer o dono do imóvel?")
2. Desenvolve a dor em 2-3 frases curtas e diretas
3. CTA forte e claro ("Chama no WhatsApp agora", "Bora ver juntos hoje")
4. Linha em branco
5. Hashtags 8-12: #patriciaejulio #imoveis + bairro/persona
6. Uma persona por peça — não misturar

EXEMPLO DE LEGENDA AGRESSIVA:
"Até quando você vai enriquecer o dono do imóvel? 🏠💸

Em 5 anos de aluguel de R$ 1.500, você gasta R$ 90 mil. E não sobra nada. Zero patrimônio.

O problema não é quanto custa comprar. É quanto custa adiar.

Bora achar o SEU imóvel? Chama no WhatsApp hoje.

#imoveis #saogoncalo #financiamento #patriciaejulio #casaprópria"

FORMATO DO POST: "${opts.formato}"
- "corretores" → mencione duo de corretores, atendimento humanizado
- "imovel" → foque no imóvel (quando houver dados do catálogo)
- "copy" → só texto, sem referências visuais`)

  // Memória
  partes.push("\n===== MEMÓRIA DA MARCA =====")
  for (const [rel, titulo] of ARQUIVOS_MEMORIA) {
    const conteudo = (await readIfExists(rel)).trim()
    if (conteudo) partes.push(`\n### ${titulo}\n${conteudo}`)
  }

  // Corretores
  partes.push("\n===== CORRETORES =====")
  for (const p of profissionais) {
    partes.push(`- ${p.nome} · CRECI ${p.creci}${p.bio ? " · " + p.bio : ""}`)
  }

  // Persona
  const persona = opts.personaId ? getPersona(opts.personaId) : null
  if (persona) {
    partes.push(`\n===== PERSONA-ALVO =====`)
    partes.push(`${persona.name} · ${persona.age[0]}–${persona.age[1]} anos · R$ ${persona.incomeBrl[0]}+ / mês`)
    partes.push(`Produto: ${persona.product}`)
    partes.push(`Dores: ${persona.pain.join(" · ")}`)
    partes.push(`Ganchos: ${persona.hook.join(" · ")}`)
  } else {
    partes.push(`\n===== PERSONAS DISPONÍVEIS =====`)
    for (const p of PERSONAS) {
      partes.push(`- ${p.name}: ${p.product}`)
    }
  }

  // Imóvel
  if (opts.imovel) {
    const i = opts.imovel
    partes.push(`\n===== IMÓVEL DO CATÁLOGO =====`)
    partes.push(`Título: ${i.titulo}`)
    if (i.localizacao) partes.push(`Localização: ${i.localizacao}`)
    if (i.quartos) partes.push(`Quartos: ${i.quartos}`)
    if (i.banheiros) partes.push(`Banheiros: ${i.banheiros}`)
    if (i.vagas) partes.push(`Vagas: ${i.vagas}`)
    if (i.areaPrivativa) partes.push(`Área: ${i.areaPrivativa}m²`)
    if (i.valor) partes.push(`Valor: R$ ${i.valor.toLocaleString("pt-BR")}`)
    if (i.descricao) partes.push(`Descrição: ${i.descricao.slice(0, 200)}`)
  }

  partes.push(`\n===== DESIGN SYSTEM (já está aplicado, não mencione nos textos) =====
Paleta: Navy #2F4156, Teal #567C8D, Sky #C8D9E6, Beige #F5EFEB
Tipografia: Playfair Display (títulos) + Inter (corpo)
Handle: @julio_e_patricia_corretores
CRECIs: 68850 (Patrícia) · 79271 (Júlio)`)

  partes.push(`\nQUANTIDADE DE SLIDES PARA ESTE PEDIDO: ${
    opts.tipo === "post" || opts.tipo === "story" || opts.tipo === "reels"
      ? "1 slide"
      : "3 a 7 slides (capa + internos + cta)"
  }`)
  
  // Adiciona variação de estilo baseado no timestamp para posts únicos
  if (opts.tipo === "post" || opts.tipo === "story") {
    const estilos = ["solo", "capa", "duo"]
    const estiloSugerido = estilos[Math.floor(Date.now() / 1000) % estilos.length]
    partes.push(`\nPARA ESTE POST ÚNICO: Use o tipo "${estiloSugerido}" para variar o visual (diferente das versões anteriores).`)
  }

  return partes.join("\n")
}
