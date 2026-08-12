/**
 * marketing-hub.ts — conteúdo do hub de marketing.
 *
 * Define o processo de criação de posts num formato consumível pelo corretor no painel.
 *
 * Quando houver mudanças no processo, atualizar aqui.
 */

// ============================================================
// 5 fases do processo de criação de post
// ============================================================

export type OndeAcontece = "aqui" | "mazyos" | "corretor"

export interface FaseMarketing {
  numero: 1 | 2 | 3 | 4 | 5
  titulo: string
  subtitulo: string
  descricao: string
  /** O que cada caminho (Estúdio / Automático) faz nessa fase. */
  noEstudio: string
  peloYann: string
  /** Onde o trabalho é feito na prática. */
  onde: OndeAcontece
  /** Ícone lucide-react que representa a fase. */
  iconeNome: "target" | "type" | "image" | "message-square" | "send"
}

export const FASES_MARKETING: FaseMarketing[] = [
  {
    numero: 1,
    titulo: "Estratégia",
    subtitulo: "Pra quem, sobre o quê, por quê",
    descricao:
      "Antes de qualquer texto: qual das 5 personas o post fala? Qual ângulo? Bairro específico ou tema mais amplo?",
    noEstudio:
      "O template já sugere a persona ideal. Você escolhe o bairro e o gancho.",
    peloYann:
      "O sistema analisa a persona escolhida, cruza com o público-alvo e propõe 2-3 ângulos possíveis antes de escrever.",
    onde: "aqui",
    iconeNome: "target",
  },
  {
    numero: 2,
    titulo: "Copy",
    subtitulo: "Título, texto de cada slide, CTA",
    descricao:
      "O que fala em cada slide? Frases naturais, sem clichê. Uma ideia por slide, gancho forte no primeiro.",
    noEstudio:
      "Você preenche título + gancho + características diretamente no formulário. O template já vem com estrutura pronta.",
    peloYann:
      "O sistema processa automaticamente: escreve slide 1 (capa), 4-6 slides internos com ritmo alternado, slide final com CTA. Mostra pra você aprovar antes do visual.",
    onde: "mazyos",
    iconeNome: "type",
  },
  {
    numero: 3,
    titulo: "Visual",
    subtitulo: "Foto + template + PNG pronto",
    descricao:
      "A parte visual do post. Aqui o Estúdio brilha: você preenche, vê o preview, baixa em PNG na dimensão certa.",
    noEstudio:
      "Preview em tempo real. Foto sobe direto do celular. Baixa em PNG no tamanho certo do Instagram — sem retocar nada.",
    peloYann:
      "O sistema monta HTML + renderiza cada slide em 1080×1350. Alterna layouts (CAPA / SOLO / DUO / NÚMERO / CITAÇÃO) pra criar ritmo.",
    onde: "aqui",
    iconeNome: "image",
  },
  {
    numero: 4,
    titulo: "Legenda",
    subtitulo: "Texto do post no Insta + hashtags",
    descricao:
      "Hook + contexto + CTA + hashtags de nicho e localização. É o que a pessoa lê antes de decidir salvar ou comentar.",
    noEstudio:
      "Ainda não gera legenda automática. Copie o gancho do template como ponto de partida e adicione hashtags manuais.",
    peloYann:
      "O sistema gera legenda completa (hook + contexto + CTA arrasta + bloco oferta + 10-15 hashtags) e salva junto do carrossel.",
    onde: "mazyos",
    iconeNome: "message-square",
  },
  {
    numero: 5,
    titulo: "Publicação",
    subtitulo: "Postar e contar pra meta",
    descricao:
      "PNG no computador, legenda pronta. Última milha: subir no Instagram / Facebook e marcar como publicado no painel.",
    noEstudio:
      "Você posta manualmente no Insta (é rápido — arquivo já está no formato certo). Depois marca como 'publicado' no histórico pra alimentar a meta semanal.",
    peloYann:
      "No futuro: o sistema já sabe postar via Meta Graph API — só precisa configurar token da Página. Hoje é manual.",
    onde: "corretor",
    iconeNome: "send",
  },
]

// ============================================================
// Caminhos possíveis (Estúdio vs Automático)
// ============================================================

export type CaminhoId = "estudio" | "yann"

export interface CaminhoMarketing {
  id: CaminhoId
  titulo: string
  subtitulo: string
  descricao: string
  href: string
  cta: string
  tempoEstimado: string
  quandoUsar: string[]
  quandoEvitar: string
  /** Fases em que o caminho executa (destaque visual no pipeline). */
  fasesExecuta: number[]
  /** Recomendado pelo default (aparece com badge). */
  recomendado?: boolean
}

export const CAMINHOS_MARKETING: CaminhoMarketing[] = [
  {
    id: "estudio",
    titulo: "Estúdio de Criativos",
    subtitulo: "Faz sozinho, direto no painel",
    descricao:
      "Templates prontos com paleta, tipografia e CRECI pré-configurados. Preenche → preview → PNG na hora.",
    href: "/painel/marketing/estudio",
    cta: "Abrir Estúdio",
    tempoEstimado: "3-5 min",
    quandoUsar: [
      "post rápido pro dia a dia",
      "quando você já tem a foto e a copy pronta",
      "conteúdo de repetição (imóvel destaque, guia de bairro)",
    ],
    quandoEvitar:
      "quando quer copy autoral e legenda pronta com hashtags — nesse caso, use geração automática.",
    fasesExecuta: [1, 3, 5],
    recomendado: true,
  },
  {
    id: "yann",
    titulo: "Geração automática",
    subtitulo: "Fluxo completo com copy autoral",
    descricao:
      "Você cria um pedido descrevendo a ideia. O sistema processa e gera carrossel + legenda pronta, e disponibiliza o resultado no seu histórico.",
    href: "/painel/marketing/gerar",
    cta: "Fazer pedido",
    tempoEstimado: "1-2 dias (offline)",
    quandoUsar: [
      "conteúdo autoral (temático, educativo, tendência do mercado)",
      "carrossel com muitos slides ou copy criativa",
      "quando quer legenda com hashtags pronta",
    ],
    quandoEvitar:
      "quando é imóvel de urgência ou post repetitivo — nesse caso o Estúdio resolve em 5 min.",
    fasesExecuta: [1, 2, 3, 4, 5],
  },
]

// ============================================================
// Regras editoriais globais (as regras da casa)
// ============================================================

export const REGRAS_CASA = [
  {
    id: "persona-unica",
    label: "Uma persona por criativo",
    detalhe: "Nunca falar com duas ao mesmo tempo. Se tá em dúvida, escolhe a mais forte.",
  },
  {
    id: "bairro-no-card",
    label: "Bairro no card, sempre",
    detalhe: "Icaraí, não Niterói. Piratininga, não Zona Oceânica. Facilita a busca da persona.",
  },
  {
    id: "preco-primeiro",
    label: "Preço no primeiro slide",
    detalhe: "Quando é imóvel específico. Sem preço, a pessoa não para de rolar.",
  },
  {
    id: "foto-por-dentro",
    label: "Foto por dentro do imóvel",
    detalhe: "Evita fachada solta. Mostra o que a pessoa vai morar, não o predio da rua.",
  },
  {
    id: "creci-rodape",
    label: "CRECI de ambos no rodapé",
    detalhe: "Patrícia Vidal · CRECI 68850 · Júlio Aguiar · CRECI 79271. Já vem preenchido nos templates.",
  },
  {
    id: "sem-cliche",
    label: "Zero clichê",
    detalhe: "Nada de \"realize seu sonho\", \"vamos juntos\", \"alavancar\". Fala como corretor de verdade.",
  },
] as const
