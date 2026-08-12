/**
 * acm-calc.ts — motor rules-based da ACM.
 *
 * Filosofia: cálculo puro, sem I/O, sem chamada externa. Toda a "inteligência"
 * do MVP vive aqui e em `acm-explicacao.ts`. Pontos de extensão pra o SIAI
 * (LLM / scraper / ML) estão marcados com TODO(siai): pra achar rápido depois.
 *
 * O que ele faz hoje:
 *   1. Score de similaridade multi-dimensional (0-100) por amostra
 *   2. Peso derivado da similaridade → média ponderada de preço/m²
 *   3. Valor sugerido = precoM2Medio × alvo.areaTotal
 *   4. Ajuste do cenário (reforma/pintura/mobiliado) multiplica o valor final
 *   5. Bands de precificação (agressivo/recomendado/premium)
 *   6. Confidence score (0-100) baseado em N amostras + variação
 *
 * O que fica pro SIAI (não faz hoje):
 *   - Aprender pesos de similaridade com histórico de vendas → ML
 *   - Visão computacional pra ajustar por qualidade de foto → OpenAI/Vertex
 *   - Análise de mercado (liquidez, tempo de venda) → dados externos
 */

import type {
  AmostraACM,
  ImovelAlvoACM,
  ACMCalculo,
  SimilarityWeights,
  Cenario,
  PriceBand,
  DecomposicaoSimilaridade,
} from "@/types/acm"

// ============================================================
// Pesos default de similaridade
// (soma tem que dar 1 — validado em runtime)
// ============================================================
// TODO(siai): permitir override desses pesos vindo de ML treinado
// sobre vendas passadas por bairro/faixa de ticket.
export const DEFAULT_WEIGHTS: SimilarityWeights = {
  area:       0.40,
  quartos:    0.15,
  banheiros:  0.10,
  vagas:      0.10,
  condominio: 0.10,
  iptu:       0.05,
  idade:      0.10,
}

export const RANGE_MIN_FATOR = 0.92
export const RANGE_MAX_FATOR = 1.08

// ============================================================
// Cálculos individuais
// ============================================================

/** Preço/m² individual (helper). */
export function calcPrecoM2(precoAnuncio: number, areaTotal: number): number {
  if (!areaTotal || areaTotal <= 0) return 0
  return precoAnuncio / areaTotal
}

/**
 * Similaridade em UMA dimensão numérica: 100 se igual, decresce quanto maior a
 * diferença relativa ao alvo. Usa curva 1 - min(diffRel × k, 1).
 */
function simDimensao(alvoValor: number | undefined, amostraValor: number | undefined, k = 1.5): number {
  if (!alvoValor || alvoValor <= 0) return 100    // se alvo não informou, não penaliza
  if (!amostraValor || amostraValor <= 0) return 60 // amostra sem info: penalidade moderada
  const diffRel = Math.abs(amostraValor - alvoValor) / alvoValor
  const score = Math.max(0, 1 - diffRel * k)
  return Math.round(score * 100)
}

/**
 * Score de similaridade multi-dimensional (0-100).
 * Retorna também a decomposição pra explicabilidade.
 */
export function calcSimilaridade(
  alvo: ImovelAlvoACM,
  amostra: AmostraACM,
  weights: SimilarityWeights = DEFAULT_WEIGHTS,
): DecomposicaoSimilaridade {
  const dims = {
    area:       simDimensao(alvo.areaTotal, amostra.areaTotal, 2.5),
    quartos:    simDimensao(alvo.quartos, amostra.quartos, 3),
    banheiros:  simDimensao(alvo.banheiros, amostra.banheiros, 2.5),
    vagas:      simDimensao(alvo.vagas, amostra.vagas, 2.5),
    condominio: simDimensao(alvo.condominio, amostra.condominio, 1.5),
    iptu:       simDimensao(alvo.iptu, amostra.iptu, 1.5),
    idade:      100, // TODO(siai): quando idade entrar no schema, calcular
  }

  let scoreTotal = 0
  const contribuicoes: DecomposicaoSimilaridade["contribuicoes"] = []

  for (const [dim, valor] of Object.entries(dims)) {
    const peso = weights[dim as keyof SimilarityWeights] ?? 0
    const contribuicao = valor * peso
    scoreTotal += contribuicao
    contribuicoes.push({ dimensao: dim as keyof SimilarityWeights, score: valor, peso, contribuicao })
  }

  return {
    scoreTotal: Math.round(scoreTotal),
    contribuicoes,
  }
}

/** Peso final (0-1) na média ponderada. Similaridade 100% → peso 1. */
export function calcPeso(similaridadeScore: number): number {
  // Curva não-linear: amostras muito diferentes pesam pouco mesmo, mas
  // amostras razoavelmente parecidas ainda contribuem
  const norm = Math.max(0, Math.min(100, similaridadeScore)) / 100
  return Math.pow(norm, 1.5)   // 100% → 1.0; 80% → 0.72; 50% → 0.35; 30% → 0.16
}

// ============================================================
// Confidence score (0-100)
// ============================================================

/**
 * Confidence da avaliação, considerando:
 *   - Número de amostras (2 = mínimo, 4+ = ótimo, 6 = teto do painel)
 *   - Coeficiente de variação (CV) dos preços/m² — quanto mais dispersos, menos confiável
 *   - Similaridade média das amostras — amostras muito distantes reduzem confiança
 */
export function calcConfianca(
  amostras: AmostraACM[],
  similaridadeMedia: number,
): number {
  if (amostras.length < 2) return 20 * amostras.length // sem 2 amostras, confidence baixíssima

  const precosM2 = amostras.map((a) => a.precoM2).filter((p) => p > 0)
  if (precosM2.length < 2) return 30

  // 1. Score de quantidade (0-40 pontos)
  const nScore = Math.min(40, amostras.length * 10)

  // 2. Score de dispersão (0-30 pontos) — 30 se CV ≤ 5%, 0 se CV ≥ 25%
  const media = precosM2.reduce((s, v) => s + v, 0) / precosM2.length
  const variancia = precosM2.reduce((s, v) => s + (v - media) ** 2, 0) / precosM2.length
  const desvio = Math.sqrt(variancia)
  const cv = media > 0 ? desvio / media : 1
  const dispersaoScore = Math.max(0, 30 - (cv * 100 - 5) * 1.5)

  // 3. Score de similaridade média (0-30 pontos)
  const simScore = (similaridadeMedia / 100) * 30

  const total = Math.round(nScore + dispersaoScore + simScore)
  return Math.max(0, Math.min(100, total))
}

// ============================================================
// Bands de precificação
// ============================================================

/** Deriva 4 faixas do valor recomendado. */
export function calcPriceBands(valorRecomendado: number): PriceBand[] {
  return [
    {
      id: "agressivo",
      label: "Agressivo",
      valor: Math.round((valorRecomendado * 0.90) / 1000) * 1000,
      descricao: "Preço abaixo da média — venda rápida, negocia rápido.",
      diasEstimados: 30,
    },
    {
      id: "recomendado",
      label: "Recomendado",
      valor: Math.round(valorRecomendado / 1000) * 1000,
      descricao: "Preço alinhado com o mercado. Melhor equilíbrio entre velocidade e valor.",
      diasEstimados: 60,
    },
    {
      id: "conservador",
      label: "Conservador",
      valor: Math.round((valorRecomendado * 1.05) / 1000) * 1000,
      descricao: "Ligeiramente acima da média — mais margem de negociação.",
      diasEstimados: 90,
    },
    {
      id: "premium",
      label: "Premium",
      valor: Math.round((valorRecomendado * 1.10) / 1000) * 1000,
      descricao: "Preço de exposição inicial. Cuidado com risco de superprecificação.",
      diasEstimados: 120,
    },
  ]
}

// ============================================================
// Ajustes de cenário (reforma, pintura, mobiliado, etc)
// ============================================================

/**
 * Cenários que o corretor pode simular sem tocar em amostras.
 * Multiplicadores aplicados no valor final.
 */
export const CENARIOS_DISPONIVEIS: Cenario[] = [
  { id: "reforma-cozinha",  label: "Reforma da cozinha",         impactoPct: 5,  descricao: "Cozinha nova/atualizada tende a acrescentar ~5% no valor percebido." },
  { id: "reforma-banheiro", label: "Reforma de banheiro",        impactoPct: 3,  descricao: "Banheiro modernizado agrega ~3%." },
  { id: "pintura-recente",  label: "Pintura recente",            impactoPct: 2,  descricao: "Pintura nova elimina objeção comum e acelera visita." },
  { id: "mobiliado",        label: "Vender mobiliado",           impactoPct: 3,  descricao: "Móveis planejados/bom estado justificam ~3% acima." },
  { id: "vista",            label: "Vista permanente / diferenciada", impactoPct: 6, descricao: "Vista mar, permanente ou verde vale bem mais." },
  { id: "andar-alto",       label: "Andar alto (a partir do 6º)", impactoPct: 3, descricao: "Andar alto costuma agregar em cidades verticalizadas." },
  { id: "exclusividade",    label: "Vender com exclusividade",   impactoPct: 2,  descricao: "Contrato de exclusividade permite promoção mais forte." },
]

/** Aplica multiplicadores dos cenários ativos ao valor base. */
export function aplicarCenarios(valorBase: number, cenariosAtivos: string[]): number {
  const mult = cenariosAtivos.reduce((acc, id) => {
    const c = CENARIOS_DISPONIVEIS.find((x) => x.id === id)
    return c ? acc * (1 + c.impactoPct / 100) : acc
  }, 1)
  return valorBase * mult
}

// ============================================================
// Cálculo principal
// ============================================================

/**
 * Retorna o resultado completo — preço/m² médio, valor sugerido, bands,
 * confidence, similaridade por amostra + decomposição.
 */
export function computeSugestao(
  alvo: ImovelAlvoACM,
  amostras: AmostraACM[],
  cenariosAtivos: string[] = [],
  weights: SimilarityWeights = DEFAULT_WEIGHTS,
): ACMCalculo {
  const empty: ACMCalculo = {
    precoM2Medio: 0,
    valorSugerido: 0,
    valorMinimo: 0,
    valorMaximo: 0,
    pesosAplicados: [],
    similaridades: [],
    decomposicoes: [],
    confianca: 0,
    bands: [],
    cenariosAtivos: [],
    impactoCenariosPct: 0,
  }

  if (!amostras.length) return empty
  if (!alvo.areaTotal || alvo.areaTotal <= 0) return empty

  const validas = amostras.filter((a) => a.areaTotal > 0 && a.precoAnuncio > 0)
  if (!validas.length) return empty

  // 1. Similaridade por amostra
  const decomposicoes = validas.map((a) => calcSimilaridade(alvo, a, weights))
  const similaridades = decomposicoes.map((d) => d.scoreTotal)

  // 2. Peso final (a partir da similaridade)
  const pesos = similaridades.map((s) => calcPeso(s))
  const pesoTotal = pesos.reduce((s, p) => s + p, 0) || 1

  // 3. Preço/m² ponderado (com ajuste manual da amostra se houver)
  const precosM2Ajustados = validas.map((a) => {
    const precoM2Base = a.precoM2 || calcPrecoM2(a.precoAnuncio, a.areaTotal)
    const ajuste = typeof a.ajustePct === "number" ? 1 + a.ajustePct / 100 : 1
    return precoM2Base * ajuste
  })
  const somaPonderada = precosM2Ajustados.reduce((s, p, i) => s + p * pesos[i], 0)
  const precoM2Medio = somaPonderada / pesoTotal

  // 4. Valor base
  const valorBase = precoM2Medio * alvo.areaTotal

  // 5. Aplica cenários simulados
  const valorAjustado = aplicarCenarios(valorBase, cenariosAtivos)
  const impactoCenariosPct = valorBase > 0
    ? ((valorAjustado - valorBase) / valorBase) * 100
    : 0

  // 6. Confidence
  const similaridadeMedia = similaridades.length
    ? similaridades.reduce((s, v) => s + v, 0) / similaridades.length
    : 0
  const confianca = calcConfianca(validas, similaridadeMedia)

  // 7. Bands
  const bands = calcPriceBands(valorAjustado)

  return {
    precoM2Medio,
    valorSugerido: valorAjustado,
    valorMinimo: valorAjustado * RANGE_MIN_FATOR,
    valorMaximo: valorAjustado * RANGE_MAX_FATOR,
    pesosAplicados: pesos,
    similaridades,
    decomposicoes,
    confianca,
    bands,
    cenariosAtivos,
    impactoCenariosPct,
  }
}

// ============================================================
// Helpers
// ============================================================
export function arredondarValor(v: number): number {
  return Math.round(v / 1000) * 1000
}

export function slugifyApelido(apelido: string): string {
  return apelido
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}

/** Rótulo qualitativo de confidence (usado em UI). */
export function rotuloConfianca(confianca: number): { label: string; cor: string } {
  if (confianca >= 80) return { label: "Alta", cor: "#0F7A54" }
  if (confianca >= 60) return { label: "Boa", cor: "#567C8D" }
  if (confianca >= 40) return { label: "Moderada", cor: "#D98A00" }
  return { label: "Baixa", cor: "#B23A2E" }
}
