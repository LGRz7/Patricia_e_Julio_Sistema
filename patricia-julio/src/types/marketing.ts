/**
 * Tipos do módulo Marketing.
 *
 * Fluxo:
 *   1. Corretor cria PedidoCriativo (status: pendente)
 *   2. Sistema processa os pendentes, gera criativos
 *   3. Sistema sobe o resultado (Criativo) e liga com o pedido → status: pronto
 *   4. Corretor baixa/publica no Instagram
 */

export type TipoCriativo = "carrossel" | "reels" | "story" | "post"

/**
 * Formato do post (como o corretor quer que ele apareça no feed).
 *
 * O MazyOS/Yann usa esse campo pra decidir a arte:
 *   - "corretores"  → post com foto dos DOIS (Patrícia + Júlio). Autoridade/recall.
 *   - "imovel"      → post com foto do imóvel escolhido do catálogo.
 *   - "copy"        → só copy, sem imagem — criativo textual puro.
 *
 * Sempre tem copy. Regra do negócio: NÃO existe post só com imagem sem texto.
 */
export type FormatoPost = "corretores" | "imovel" | "copy"

export type StatusPedido =
  | "pendente"   // aguardando processamento
  | "gerando"    // em produção (sistema processa)
  | "pronto"     // criativo(s) já entregue(s)
  | "publicado"  // corretor já postou no IG/FB
  | "cancelado"

export interface PedidoCriativo {
  id: string
  slug: string
  status: StatusPedido
  personaId: string
  tipo: TipoCriativo
  /** Formato do post (novo). Opcional pra compatibilidade com pedidos antigos. */
  formato?: FormatoPost
  /** Slug do imóvel escolhido — obrigatório quando formato === "imovel". */
  imovelSlug?: string
  /** Bairro/região do imóvel/tema alvo. */
  bairro?: string
  /** Faixa de preço, se aplicável. */
  faixaPreco?: string
  /**
   * Rótulo curto do pedido — auto-gerado do briefing pra aparecer na lista do
   * histórico. NÃO é colado no post final, só identifica o pedido.
   */
  gancho: string
  /**
   * BRIEFING completo — o "prompt" que o corretor escreveu descrevendo o que
   * quer. É a fonte da verdade pro MazyOS/Yann compor o criativo. Nunca é
   * colado no post literalmente — é usado como intenção.
   */
  briefing?: string
  /** Prazo desejado pra ficar pronto (data ISO). */
  prazo?: string
  /** Criativos entregues pra esse pedido (0..N). */
  criativos: Criativo[]
  criadoPor?: string   // patricia | julio
  criadoEm: string
  atualizadoEm: string
}

export interface Criativo {
  id: string
  tipo: TipoCriativo
  titulo: string
  legendaSugerida?: string
  hashtags?: string[]
  /** URL do arquivo (imagem, PDF do carrossel, MP4 do reels). Pode ser data: em dev. */
  arquivoUrl?: string
  /** Miniatura, quando aplicável. */
  thumbnailUrl?: string
  criadoEm: string
}

export interface MetaSemanal {
  postsPorSemana: number
  personaFocoIds: string[]   // personas prioritárias
}
