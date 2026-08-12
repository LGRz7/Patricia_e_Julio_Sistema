/**
 * templates-marketing.ts — catálogo de templates prontos para o Estúdio de Criativos.
 *
 * Cada template define:
 *   - metadata visual (nome, descrição, thumbnail-hint)
 *   - dimensões finais em pixels (para export PNG)
 *   - aspecto do Instagram (1:1 · 4:5 · 9:16)
 *   - campos que o corretor precisa preencher para gerar
 *
 * O componente React que RENDERIZA o template vive em
 *   src/components/painel/marketing/estudio/templates/<Nome>.tsx
 * e é resolvido no orquestrador (page.tsx do estúdio) via TEMPLATE_REGISTRY.
 */

import type { TipoCriativo } from "@/types/marketing"

export type TipoCampo = "texto" | "textarea" | "moeda" | "foto" | "persona"

export interface CampoTemplate {
  id: string
  label: string
  tipo: TipoCampo
  placeholder?: string
  hint?: string
  obrigatorio?: boolean
  /** Valor padrão sugerido no editor. */
  padrao?: string
}

export interface TemplateMarketing {
  id: string
  nome: string
  descricao: string
  tipo: TipoCriativo
  aspecto: "1:1" | "4:5" | "9:16"
  dimensoes: { w: number; h: number }
  /** Persona que esse template atende melhor (para o sugestor). */
  personaSugerida?: string
  /** Cor da faixa lateral no card da galeria. */
  corAcento: string
  campos: CampoTemplate[]
  /** Se > 1, é um carrossel de múltiplos slides. Cada slide baixa como PNG separado. */
  slidesTotal?: number
}

export const TEMPLATES_MARKETING: TemplateMarketing[] = [
  {
    id: "carrossel-aluguel",
    nome: "Carrossel · Sair do aluguel",
    descricao: "Carrossel editorial de 7 slides — storytelling forte para converter quem paga aluguel. Design premium tipo revista.",
    tipo: "carrossel",
    aspecto: "4:5",
    dimensoes: { w: 1080, h: 1350 }, // cada slide é 1080x1350
    slidesTotal: 7,
    personaSugerida: "primeira-compra-consciente",
    corAcento: "#2F4156",
    campos: [
      {
        id: "gancho",
        label: "Gancho principal (slide 1)",
        tipo: "texto",
        placeholder: "Ex.: Até quando pagar o imóvel dos outros?",
        obrigatorio: true,
        hint: "A frase que faz a pessoa parar. Curta, forte, provocativa.",
        padrao: "Até quando pagar o imóvel dos outros?",
      },
      {
        id: "eyebrow",
        label: "Etiqueta do topo (slide 1)",
        tipo: "texto",
        placeholder: "Ex.: Casa própria",
        hint: "Curto, letras maiúsculas. Aparece acima do gancho.",
        padrao: "Casa própria",
      },
      {
        id: "valorPerdido",
        label: "Valor perdido no aluguel (slide 2)",
        tipo: "texto",
        placeholder: "Ex.: R$ 90 mil",
        obrigatorio: true,
        hint: "O número grande impactante. Ex.: R$ 90 mil, R$ 120 mil.",
        padrao: "R$ 90 mil",
      },
      {
        id: "anos",
        label: "Em quantos anos (slide 2)",
        tipo: "texto",
        placeholder: "Ex.: 5 anos",
        hint: "Período usado no cálculo.",
        padrao: "5 anos",
      },
      {
        id: "aluguelMes",
        label: "Aluguel mensal usado (slide 2)",
        tipo: "texto",
        placeholder: "Ex.: R$ 1.500/mês",
        hint: "Base do cálculo. Aluguel típico do bairro-alvo.",
        padrao: "R$ 1.500/mês",
      },
      {
        id: "insight",
        label: "Insight forte (slide 3)",
        tipo: "textarea",
        placeholder: "Ex.: O problema não é o quanto custa comprar. É o quanto custa adiar.",
        obrigatorio: true,
        hint: "Duas frases separadas por ponto. A segunda vira o destaque em azul-claro.",
        padrao: "O problema não é o quanto custa comprar. É o quanto custa adiar.",
      },
      {
        id: "bairro",
        label: "Bairro / região da oferta (slide 5)",
        tipo: "texto",
        placeholder: "Ex.: São Gonçalo e região",
        obrigatorio: true,
        hint: "Onde vocês têm imóveis a partir do preço mínimo.",
        padrao: "São Gonçalo e região",
      },
      {
        id: "precoDe",
        label: "Preço a partir de (slide 5)",
        tipo: "texto",
        placeholder: "Ex.: R$ 170 mil",
        obrigatorio: true,
        hint: "Preço mínimo real dos imóveis disponíveis.",
        padrao: "R$ 170 mil",
      },
      {
        id: "objecao",
        label: "Objeção respondida (slide 6)",
        tipo: "texto",
        placeholder: "Ex.: Mas será que eu consigo financiar?",
        hint: "A dúvida mais comum. Aparece entre aspas.",
        padrao: "Mas será que eu consigo financiar?",
      },
      {
        id: "ctaTexto",
        label: "Chamada final (slide 7)",
        tipo: "texto",
        placeholder: "Ex.: Bora achar o seu?",
        hint: "Frase curta que antecede o CTA do WhatsApp.",
        padrao: "Bora achar o seu?",
      },
    ],
  },
  {
    id: "imovel-destaque",
    nome: "Imóvel destaque",
    descricao: "Foto grande no topo · dados e preço na faixa navy embaixo.",
    tipo: "post",
    aspecto: "4:5",
    dimensoes: { w: 1080, h: 1350 },
    personaSugerida: "upgrade-familiar",
    corAcento: "#2F4156",
    campos: [
      {
        id: "foto",
        label: "Foto principal",
        tipo: "foto",
        obrigatorio: true,
        hint: "Foto por dentro do imóvel. Evita fachada solta — mostra o que a pessoa vai morar.",
      },
      {
        id: "bairro",
        label: "Bairro",
        tipo: "texto",
        placeholder: "Ex.: Icaraí",
        obrigatorio: true,
        hint: "Bairro específico, não só cidade. Facilita a busca.",
      },
      {
        id: "titulo",
        label: "Título do imóvel",
        tipo: "texto",
        placeholder: "Ex.: 2 quartos, vaga, vista permanente",
        obrigatorio: true,
        hint: "O que o imóvel tem de melhor em 6-10 palavras.",
      },
      {
        id: "preco",
        label: "Preço de venda",
        tipo: "moeda",
        placeholder: "Ex.: 620000",
        obrigatorio: true,
        hint: "Preço no primeiro slide. Sem preço, a pessoa não para.",
      },
      {
        id: "gancho",
        label: "Selo em cima da foto (opcional)",
        tipo: "texto",
        placeholder: "Ex.: Vista permanente · Novo lançamento · Preço reduzido",
        hint: "Uma frase curta. Aparece como badge no topo da foto.",
      },
      {
        id: "caracteristicas",
        label: "Características (opcional)",
        tipo: "textarea",
        placeholder: "Ex.: 78m² · 2 vagas · Varanda gourmet · Piscina · Andar alto",
        hint: "Separa por vírgula ou por linha. Mostra até 5 no card.",
      },
    ],
  },
  {
    id: "prestacao-vs-aluguel",
    nome: "Prestação vs Aluguel",
    descricao: "Comparativo lado a lado — pra quem paga aluguel e não sabe que pode financiar.",
    tipo: "post",
    aspecto: "1:1",
    dimensoes: { w: 1080, h: 1080 },
    personaSugerida: "primeira-compra-consciente",
    corAcento: "#567C8D",
    campos: [
      {
        id: "aluguel",
        label: "Aluguel médio no bairro",
        tipo: "moeda",
        placeholder: "Ex.: 2500",
        obrigatorio: true,
        hint: "Aluguel típico de um 2 quartos parecido no mesmo bairro.",
      },
      {
        id: "prestacao",
        label: "Prestação do financiamento",
        tipo: "moeda",
        placeholder: "Ex.: 2100",
        obrigatorio: true,
        hint: "Prestação média do imóvel que você quer mostrar (com FGTS, 30 anos).",
      },
      {
        id: "bairro",
        label: "Bairro",
        tipo: "texto",
        placeholder: "Ex.: Fonseca, Tijuca, Itaipuaçu",
        obrigatorio: true,
        hint: "O bairro do imóvel usado no cálculo.",
      },
      {
        id: "gancho",
        label: "Selo em cima (opcional)",
        tipo: "texto",
        placeholder: "Ex.: Pra quem paga aluguel · Financiamento com FGTS",
        hint: "Frase curta que abre o card. Padrão: 'Pra quem paga aluguel'.",
      },
      {
        id: "descricao",
        label: "Contexto (opcional)",
        tipo: "texto",
        placeholder: "Ex.: financiamento com FGTS · 30 anos · entrada 20%",
        hint: "Aparece embaixo do título, explicando o cenário.",
      },
    ],
  },
  {
    id: "story-foto-grande",
    nome: "Story · Foto grande",
    descricao: "Foto vertical em tela cheia · gancho + CTA · pronto pro story.",
    tipo: "story",
    aspecto: "9:16",
    dimensoes: { w: 1080, h: 1920 },
    personaSugerida: "upgrade-familiar",
    corAcento: "#0F7A54",
    campos: [
      {
        id: "foto",
        label: "Foto vertical",
        tipo: "foto",
        obrigatorio: true,
        hint: "Foto na vertical (celular). Do imóvel, do bairro, do pôr do sol da varanda.",
      },
      {
        id: "bairro",
        label: "Bairro / etiqueta topo",
        tipo: "texto",
        placeholder: "Ex.: Icaraí, Piratininga",
        obrigatorio: true,
        hint: "Aparece como badge no topo. Curto.",
      },
      {
        id: "gancho",
        label: "Gancho grande",
        tipo: "texto",
        placeholder: "Ex.: Vista permanente em Icaraí",
        obrigatorio: true,
        hint: "A frase que faz a pessoa parar. Grande, direta, sem clichê.",
      },
      {
        id: "subtitulo",
        label: "Subtítulo (opcional)",
        tipo: "texto",
        placeholder: "Ex.: 78m² · 2 quartos · a partir de R$ 620 mil",
        hint: "Uma linha de contexto abaixo do gancho.",
      },
      {
        id: "cta",
        label: "CTA do botão",
        tipo: "texto",
        placeholder: "Ex.: Arrasta pra cima · Chama no WhatsApp",
        hint: "Ação que a pessoa deve tomar. Padrão: 'Chama no WhatsApp'.",
      },
    ],
  },
  {
    id: "guia-bairro",
    nome: "Guia de bairro",
    descricao: "Foto do bairro com overlay navy · 3 pontos numerados · pra quem quer se mudar.",
    tipo: "post",
    aspecto: "4:5",
    dimensoes: { w: 1080, h: 1350 },
    personaSugerida: "migrante-rio-niteroi",
    corAcento: "#7B4E9A",
    campos: [
      {
        id: "foto",
        label: "Foto do bairro",
        tipo: "foto",
        obrigatorio: true,
        hint: "Rua, praça, orla, comércio típico. Evita a fachada de um único prédio.",
      },
      {
        id: "bairro",
        label: "Bairro",
        tipo: "texto",
        placeholder: "Ex.: Icaraí, Ingá, Piratininga",
        obrigatorio: true,
      },
      {
        id: "titulo",
        label: "Título do post",
        tipo: "texto",
        placeholder: "Ex.: 3 coisas que ninguém te conta sobre Icaraí",
        obrigatorio: true,
        hint: "Chamativo. Idealmente começa com número.",
      },
      {
        id: "pontos",
        label: "3 pontos (um por linha)",
        tipo: "textarea",
        placeholder: "Padaria a pé em qualquer esquina\nTravessia até Zona Sul em 20 min de barca\nMenor m² que a Barra por qualidade parecida",
        hint: "Uma linha por ponto. Mostra até 3.",
      },
      {
        id: "cta",
        label: "CTA / fechamento",
        tipo: "texto",
        placeholder: "Ex.: Salva esse post e chama pra conversar",
        hint: "Uma linha final chamando pra ação.",
      },
    ],
  },
]

// ============================================================
// Helpers
// ============================================================

export function getTemplate(id: string): TemplateMarketing | undefined {
  return TEMPLATES_MARKETING.find((t) => t.id === id)
}

/**
 * Assinatura de rodapé oficial — usada em TODOS os templates.
 * ⚠️ Não são CNPJ. É sempre "nome · CRECI" dos dois corretores.
 */
export const RODAPE_OFICIAL = {
  linha1: "Patrícia Vidal · CRECI 68850",
  linha2: "Júlio Aguiar · CRECI 79271",
  marca: "PV·JA",
} as const

/**
 * Paleta oficial — usar sempre nas telas dos templates.
 * (Também exposta no globals.css como classes tailwind.)
 */
export const PALETA = {
  navy:  "#2F4156",
  teal:  "#567C8D",
  sky:   "#C8D9E6",
  beige: "#F5EFEB",
  white: "#FFFFFF",
  navyEscuro: "#253347",
} as const
