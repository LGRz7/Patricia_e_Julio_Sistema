/**
 * marketing-parser.ts — analisa um pedido em texto livre e devolve
 * o template certo + campos pré-preenchidos.
 *
 * Espelha a lógica de "identificação de tipo de conteúdo" da skill /carrossel
 * do MazyOS, adaptada pra rodar 100% no browser (sem LLM).
 *
 * Entrada:
 *   { tipo: TipoCriativo, texto: string, personaId: string, foto?: string }
 *
 * Saída:
 *   { templateId: string, dados: Record<string,string>, avisos: string[] }
 */

import type { TipoCriativo } from "@/types/marketing"

// ============================================================
// Bairros conhecidos (região de atuação da Patrícia e Júlio)
// Fonte: _memoria/publico-alvo.md
// ============================================================
const BAIRROS_CONHECIDOS = [
  // Niterói
  "Icaraí", "Ingá", "São Francisco", "Santa Rosa", "Fonseca", "Piratininga",
  "Camboinhas", "Itaipu", "Charitas", "Jurujuba", "Boa Viagem", "Vital Brazil",
  "Gragoatá", "Barreto", "Engenhoca", "Cubango", "Baldeador", "Centro",
  // Maricá
  "Itaipuaçu", "Barra de Maricá", "Ponta Negra", "Centro de Maricá",
  "São José do Imbassaí", "Inoã", "Manu Manuela",
  // Rio (foco)
  "Tijuca", "Grajaú", "Vila Isabel", "Botafogo", "Copacabana", "Ipanema",
  "Leblon", "Barra", "Recreio", "Freguesia", "Jacarepaguá", "Flamengo",
  "Laranjeiras", "Humaitá",
]

// ============================================================
// Palavras-chave por template
// ============================================================
const PALAVRAS_PRESTACAO = [
  "aluguel", "aluga", "alugar", "prestação", "prestacao", "financiamento",
  "fgts", "entrada", "parcela", "mensal", "financiar", "financiamento",
  "vs", "versus", "melhor que", "menor que",
]

const PALAVRAS_GUIA_BAIRRO = [
  "guia", "bairro", "conhecer", "morar em", "mudar pra", "mudar para",
  "coisas sobre", "coisas que", "razões", "razoes", "motivos",
  "vantagens", "vale a pena morar",
]

const PALAVRAS_VISTA = ["vista", "vista mar", "vista permanente", "andar alto"]
const PALAVRAS_NOVO = ["lançamento", "lancamento", "novo", "recém"]
const PALAVRAS_REDUZIDO = ["reduzido", "abaixou", "oferta", "promoção", "promocao", "oportunidade"]

// ============================================================
// Regex de extração
// ============================================================
// "mil" ou "k" — precisa word boundary depois pra não bater em "milhão"
const RE_PRECO_MIL   = /(?:R\$\s*)?(\d+(?:[.,]\d{1,3})?)\s*(?:mil|k)(?![a-zA-Zçãõáéíóúâêô])/i
// "milhões", "milhão", "milhoes", ou "mi" isolado (word boundary nos dois lados).
// NÃO usar `M\b` — bate em "78m²" e confunde 78 metros com 78 milhões.
const RE_PRECO_MI    = /(?:R\$\s*)?(\d+(?:[.,]\d{1,3})?)\s*(?:milh[õo]es?|milh[ãa]o|\bmi(?![a-zA-Zçãõáéíóúâêô]))/i
const RE_PRECO_RS    = /R\$\s*([\d.,]+)/i
const RE_PRECO_RAW   = /(?<!\d)(\d{5,7})(?!\d)/  // 350000, 620000 — isolado
const RE_QUARTOS     = /(\d+)\s*(?:quartos?|dormit[óo]rios?|dorms?|qtos?)/i
const RE_AREA        = /(\d+(?:[,.]\d+)?)\s*m[²2]/i
const RE_VAGAS       = /(\d+)\s*vagas?/i
const RE_ALUGUEL_VAL = /alug[uau]?el\s*(?:de|:)?\s*(?:R\$\s*)?(\d[\d.,]+)/i
const RE_PRESTACAO_VAL = /(?:presta[çc][ãa]o|parcela|financiamento)\s*(?:de|:)?\s*(?:R\$\s*)?(\d[\d.,]+)/i

// ============================================================
// Resultado
// ============================================================
export interface ResultadoParse {
  templateId: string
  dados: Record<string, string>
  avisos: string[]
  /** Descrição pro corretor entender o que foi decidido. */
  explicacao: string
}

export interface EntradaParse {
  tipo: TipoCriativo
  texto: string
  personaId: string
  foto?: string
}

// ============================================================
// Analisar (função pública principal)
// ============================================================
export function analisarPedidoLivre(entrada: EntradaParse): ResultadoParse {
  const { tipo, texto, personaId, foto } = entrada
  const t = texto.trim()

  const avisos: string[] = []
  const dados: Record<string, string> = {}

  // Foto sempre entra se o corretor mandou
  if (foto) dados.foto = foto

  // Extrai bairro, preço, quartos, área, vagas, gancho
  const bairro = detectarBairro(t)
  const gancho = detectarGancho(t)
  const preco = detectarPreco(t)
  const quartos = t.match(RE_QUARTOS)?.[1]
  const area = t.match(RE_AREA)?.[1]
  const vagas = t.match(RE_VAGAS)?.[1]

  // Monta lista de características a partir dos campos detectados
  const caracteristicas: string[] = []
  if (area) caracteristicas.push(`${area}m²`)
  if (quartos) caracteristicas.push(`${quartos} quarto${Number(quartos) > 1 ? "s" : ""}`)
  if (vagas) caracteristicas.push(`${vagas} vaga${Number(vagas) > 1 ? "s" : ""}`)

  // ------- STORY -------
  if (tipo === "story") {
    return {
      templateId: "story-foto-grande",
      dados: {
        ...dados,
        bairro: bairro || "",
        gancho: gancho || primeirasFrases(t, 70),
        subtitulo: caracteristicas.join(" · "),
      },
      avisos: !foto ? ["Story precisa de foto vertical — envia uma antes de baixar."] : [],
      explicacao: `Story vertical (9:16) com foto grande. ${bairro ? `Bairro: ${bairro}. ` : ""}${gancho ? `Gancho: "${gancho}".` : ""}`,
    }
  }

  // ------- REELS (não temos template PNG) -------
  if (tipo === "reels") {
    return {
      templateId: "story-foto-grande",   // fallback visual pra mostrar preview
      dados: {
        ...dados,
        bairro: bairro || "",
        gancho: gancho || primeirasFrases(t, 70),
        subtitulo: caracteristicas.join(" · "),
      },
      avisos: [
        "Reels é vídeo — o Estúdio ainda não gera vídeo, só gera capa/frame estático.",
        "Pra ter roteiro + edição completa, use a geração automática.",
      ],
      explicacao: `Capa de Reels no formato 9:16 (frame estático). Pra roteiro em vídeo, use geração automática.`,
    }
  }

  // ------- POST / CARROSSEL — escolher entre 3 templates 4:5/1:1 -------

  // Persona primeira-compra + palavras de financiamento/aluguel → Prestação vs Aluguel
  const parecePrestacao = casaPalavras(t, PALAVRAS_PRESTACAO)
  if (personaId === "primeira-compra-consciente" && parecePrestacao) {
    const aluguel = t.match(RE_ALUGUEL_VAL)?.[1] || ""
    const prestacao = t.match(RE_PRESTACAO_VAL)?.[1] || ""
    return {
      templateId: "prestacao-vs-aluguel",
      dados: {
        aluguel: soDigito(aluguel),
        prestacao: soDigito(prestacao),
        bairro: bairro || "",
        gancho: gancho || "Pra quem paga aluguel",
        descricao: caracteristicas.length ? caracteristicas.join(" · ") : "financiamento com FGTS",
      },
      avisos: !aluguel || !prestacao
        ? ["Precisa completar aluguel e prestação — só extraí um deles do texto."]
        : [],
      explicacao: `Comparativo Prestação vs Aluguel — persona Primeira Compra. ${bairro ? `Bairro: ${bairro}.` : ""}`,
    }
  }

  // Persona migrante + palavras de guia/bairro → Guia de Bairro
  const pareceGuia = casaPalavras(t, PALAVRAS_GUIA_BAIRRO)
  if (personaId === "migrante-rio-niteroi" && (pareceGuia || tipo === "carrossel")) {
    // extrai possíveis pontos (frases separadas por vírgula, ponto e vírgula, quebra de linha)
    const pontos = extrairPontos(t)
    return {
      templateId: "guia-bairro",
      dados: {
        ...dados,
        bairro: bairro || "",
        titulo: gancho || `3 coisas sobre ${bairro || "esse bairro"}`,
        pontos: pontos.slice(0, 3).join("\n"),
        cta: "Salva esse post e chama pra conversar",
      },
      avisos: !foto
        ? ["Guia de bairro fica muito melhor com foto do bairro (rua, orla, comércio)."]
        : [],
      explicacao: `Guia de bairro com foto do lugar + até 3 pontos. Persona: Migrante Rio → Niterói.`,
    }
  }

  // Default → Imóvel Destaque
  return {
    templateId: "imovel-destaque",
    dados: {
      ...dados,
      bairro: bairro || "",
      titulo: quartos && area
        ? `${quartos} quarto${Number(quartos) > 1 ? "s" : ""}, ${area}m²${vagas ? `, ${vagas} vaga${Number(vagas) > 1 ? "s" : ""}` : ""}`
        : gancho || primeirasFrases(t, 60),
      preco: preco ? String(preco) : "",
      gancho: gancho || "",
      caracteristicas: caracteristicas.join(", "),
    },
    avisos: [
      ...(!foto ? ["Imóvel destaque precisa de foto por dentro — envia uma antes de baixar."] : []),
      ...(!preco ? ["Preço não foi encontrado no texto. Preencha manualmente no editor."] : []),
    ],
    explicacao: `Imóvel destaque (4:5). ${bairro ? `Bairro: ${bairro}. ` : ""}${preco ? `Preço: R$ ${formatarPreco(preco)}.` : ""}`,
  }
}

// ============================================================
// Detectores
// ============================================================
function detectarBairro(texto: string): string | null {
  // Ordena por tamanho decrescente pra pegar "Barra de Maricá" antes de "Barra"
  const ordenados = [...BAIRROS_CONHECIDOS].sort((a, b) => b.length - a.length)
  const normalized = " " + texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") + " "
  for (const b of ordenados) {
    const bNorm = " " + b.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") + " "
    if (normalized.includes(bNorm)) return b
    // aceita "em Icaraí" também sem o espaço final
    const bWithPrep = " " + b.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    if (normalized.includes(bWithPrep + " ") || normalized.includes(bWithPrep + ",") || normalized.includes(bWithPrep + ".")) return b
  }
  return null
}

function detectarGancho(texto: string): string | null {
  const t = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

  if (casaPalavras(t, PALAVRAS_NOVO)) return "Novo lançamento"
  if (casaPalavras(t, PALAVRAS_REDUZIDO)) return "Preço reduzido"
  if (casaPalavras(t, PALAVRAS_VISTA)) return "Vista permanente"

  return null
}

function detectarPreco(texto: string): number | null {
  // Preço em milhões (ex: "1.2 milhões", "1,5 mi")
  const mi = texto.match(RE_PRECO_MI)
  if (mi) {
    const v = Number(mi[1].replace(",", "."))
    if (isFinite(v)) return Math.round(v * 1_000_000)
  }
  // Preço em milhares (ex: "620 mil", "350k")
  const mil = texto.match(RE_PRECO_MIL)
  if (mil) {
    const v = Number(mil[1].replace(",", "."))
    if (isFinite(v)) return Math.round(v * 1_000)
  }
  // Preço com R$ explícito
  const rs = texto.match(RE_PRECO_RS)
  if (rs) {
    const v = Number(rs[1].replace(/[.\s]/g, "").replace(",", "."))
    if (isFinite(v) && v > 1000) return Math.round(v)
  }
  // Preço bruto (5-7 dígitos)
  const raw = texto.match(RE_PRECO_RAW)
  if (raw) {
    const v = Number(raw[1])
    if (isFinite(v) && v >= 50_000 && v <= 20_000_000) return v
  }
  return null
}

// ============================================================
// Utilitários
// ============================================================
function casaPalavras(texto: string, palavras: string[]): boolean {
  const t = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  return palavras.some((p) => {
    const pNorm = p.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    return t.includes(pNorm)
  })
}

function soDigito(raw: string): string {
  return raw.replace(/\D/g, "")
}

function primeirasFrases(texto: string, max: number): string {
  const clean = texto.trim().replace(/\s+/g, " ")
  if (clean.length <= max) return clean
  return clean.slice(0, max).replace(/,\s*$/, "").trim() + "…"
}

function formatarPreco(v: number): string {
  return new Intl.NumberFormat("pt-BR").format(v)
}

function extrairPontos(texto: string): string[] {
  // Divide por vírgula, ponto e vírgula, quebra de linha, ou " · "
  return texto
    .split(/[\n;·]|(?:,\s+)/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 8 && p.length <= 100)
}
