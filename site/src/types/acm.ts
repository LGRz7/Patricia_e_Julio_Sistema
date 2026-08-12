/**
 * Tipos da Análise Comparativa de Mercado (ACM).
 *
 * Fluxo: o corretor define um imóvel-alvo (que ele vai vender) + 2 a 6
 * amostras (imóveis similares à venda no bairro). O sistema calcula:
 *   - Similaridade multi-dimensional por amostra (0-100)
 *   - Preço/m² médio ponderado pela similaridade
 *   - Valor sugerido + bands (agressivo/recomendado/premium)
 *   - Confidence score (0-100) baseado em N amostras + variação + similaridade média
 *   - Explicação em texto (rule-based)
 *
 * TODO(siai): plugar geradores externos (scraper, LLM, ML) sem quebrar esse shape.
 */

export type ACMStatus = "rascunho" | "concluida"
export type AmostraOrigem = "colada" | "manual"
export type FonteAmostra =
  | "ZAP" | "VivaReal" | "OLX" | "Chaves na Mão" | "QuintoAndar" | "Loft" | "outra"

// ============================================================
// Imóvel-alvo
// ============================================================
export interface ImovelAlvoACM {
  apelido: string
  endereco: string
  bairro: string
  cidade: string
  areaTotal: number
  quartos: number
  suites?: number
  banheiros: number
  vagas: number
  condominio?: number
  iptu?: number
  observacoes?: string
  fotoUrl?: string
  // TODO(siai): idade do imóvel, andar, vista, elevador, lazer, estado de conservação
  // (schema já preparado — motor de cálculo ignora se null)
}

// ============================================================
// Amostra
// ============================================================
export interface AmostraACM {
  id: string
  origem: AmostraOrigem
  textoBruto?: string
  fonte?: FonteAmostra
  linkOriginal?: string
  endereco: string
  bairro: string
  precoAnuncio: number
  areaTotal: number
  quartos: number
  banheiros: number
  vagas: number
  condominio?: number
  iptu?: number
  observacoes?: string
  precoM2: number
  /** Ajuste manual do corretor no preço/m² desta amostra (ex.: -5% pra reforma pesada). */
  ajustePct?: number
}

// ============================================================
// Peso de cada dimensão no score de similaridade (soma = 1.0)
// ============================================================
export interface SimilarityWeights {
  area: number
  quartos: number
  banheiros: number
  vagas: number
  condominio: number
  iptu: number
  idade: number
}

// ============================================================
// Decomposição da similaridade (pra explicabilidade)
// ============================================================
export interface DecomposicaoSimilaridade {
  scoreTotal: number     // 0-100
  contribuicoes: {
    dimensao: keyof SimilarityWeights
    score: number        // 0-100 nesta dimensão
    peso: number         // 0-1 (o peso configurado)
    contribuicao: number // score × peso (soma das contribuições = scoreTotal)
  }[]
}

// ============================================================
// Cenário simulável (reforma, pintura, mobiliado, etc)
// ============================================================
export interface Cenario {
  id: string
  label: string
  impactoPct: number      // ex.: +5
  descricao: string
}

// ============================================================
// Band de precificação
// ============================================================
export interface PriceBand {
  id: "agressivo" | "recomendado" | "conservador" | "premium"
  label: string
  valor: number
  descricao: string
  diasEstimados: number   // heurística: quanto tempo pra vender neste preço
}

// ============================================================
// Resultado do cálculo
// ============================================================
export interface ACMCalculo {
  precoM2Medio: number
  valorSugerido: number
  valorMinimo: number
  valorMaximo: number
  pesosAplicados: number[]           // por amostra (na ordem)
  similaridades: number[]            // 0-100 por amostra
  decomposicoes: DecomposicaoSimilaridade[]
  confianca: number                  // 0-100
  bands: PriceBand[]
  cenariosAtivos: string[]           // ids dos cenários aplicados
  impactoCenariosPct: number         // % somado dos cenários
}

// ============================================================
// ACM salva (registro completo)
// ============================================================
export interface ACM {
  id: string
  slug: string
  imovelAlvo: ImovelAlvoACM
  amostras: AmostraACM[]
  calculo: ACMCalculo
  status: ACMStatus
  criadoPor?: string
  criadoEm: string
  atualizadoEm: string
}
