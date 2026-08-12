/**
 * acm-explicacao.ts — gerador rule-based de explicações em texto natural.
 *
 * Não é LLM. É template + regras sobre os números. O objetivo é apresentar
 * ao corretor (e ao proprietário via PDF) o "por quê" do valor sugerido —
 * o que Zillow/Zestimate faz com "explainable AI", só que em regras diretas.
 *
 * TODO(siai): interface `ExplanationSource` já modelada — no futuro dá pra
 * plugar `LLMExplanationSource` chamando o MazyOS pra gerar texto mais rico.
 * Basta a fonte externa aceitar `(ACM) → InsightExplicacao[]` e o UI/PDF
 * consomem sem saber a diferença.
 */

import type {
  ACMCalculo,
  ImovelAlvoACM,
  AmostraACM,
  SimilarityWeights,
} from "@/types/acm"
import { rotuloConfianca } from "./acm-calc"

// ============================================================
// Tipos
// ============================================================

export type TipoInsight = "positivo" | "negativo" | "neutro" | "alerta"

export interface InsightExplicacao {
  tipo: TipoInsight
  titulo: string
  descricao: string
  /** Impacto percentual estimado (se aplicável). Ex: "+8%". */
  impactoPct?: number
}

export interface ExplanationSource {
  name: string
  generate(input: {
    alvo: ImovelAlvoACM
    amostras: AmostraACM[]
    calculo: ACMCalculo
  }): InsightExplicacao[]
}

// ============================================================
// Fonte padrão — regras
// ============================================================
export const RegrasExplanationSource: ExplanationSource = {
  name: "regras",
  generate({ alvo, amostras, calculo }) {
    const insights: InsightExplicacao[] = []

    // 1) Sanity: precisa de dado pra explicar
    if (!calculo.valorSugerido || amostras.length === 0) return insights

    // 2) Preço/m² médio × amostras — insight base
    const precosM2 = amostras.map((a) => a.precoM2).filter((v) => v > 0)
    if (precosM2.length >= 2) {
      const minP = Math.min(...precosM2)
      const maxP = Math.max(...precosM2)
      insights.push({
        tipo: "neutro",
        titulo: "Preço/m² comparativo",
        descricao: `As amostras vendem entre ${fmt(minP)} e ${fmt(maxP)} por m². A média ponderada aplicada foi ${fmt(calculo.precoM2Medio)}/m² — mais próxima das amostras com área similar à do alvo.`,
      })
    }

    // 3) Confidence
    const conf = rotuloConfianca(calculo.confianca)
    insights.push({
      tipo: calculo.confianca >= 60 ? "positivo" : "alerta",
      titulo: `Confiança da avaliação: ${conf.label} (${calculo.confianca}%)`,
      descricao: descreverConfianca(calculo, amostras.length),
    })

    // 4) Best match: qual amostra é a mais similar
    if (calculo.similaridades.length) {
      const bestIdx = calculo.similaridades.indexOf(Math.max(...calculo.similaridades))
      const bestAmostra = amostras[bestIdx]
      const bestScore = calculo.similaridades[bestIdx]
      if (bestAmostra && bestScore > 0) {
        insights.push({
          tipo: "neutro",
          titulo: `Amostra mais próxima: ${bestScore}%`,
          descricao: `A amostra ${bestIdx + 1} (${bestAmostra.bairro}, ${bestAmostra.areaTotal}m², ${bestAmostra.quartos}Q) é a que mais parece com seu imóvel — pesou ${(calcPesoRelativo(calculo, bestIdx) * 100).toFixed(0)}% na média final.`,
        })
      }
    }

    // 5) Warning: amostras dispersas
    if (precosM2.length >= 2) {
      const media = precosM2.reduce((s, v) => s + v, 0) / precosM2.length
      const cv = calcCV(precosM2, media)
      if (cv > 0.15) {
        insights.push({
          tipo: "alerta",
          titulo: "Amostras com preços dispersos",
          descricao: `A variação entre os preços/m² das amostras é alta (${(cv * 100).toFixed(0)}%). Isso pode indicar mistura de tipologias diferentes — vale conferir se todas realmente comparam.`,
        })
      }
    }

    // 6) Se pouco amostras: alerta
    if (amostras.length < 4) {
      insights.push({
        tipo: "alerta",
        titulo: `Só ${amostras.length} amostra${amostras.length > 1 ? "s" : ""}`,
        descricao: `Com poucas referências, a margem de erro aumenta. Ideal é 4 amostras semelhantes pra reduzir viés.`,
      })
    } else if (amostras.length >= 5) {
      insights.push({
        tipo: "positivo",
        titulo: `Base robusta com ${amostras.length} amostras`,
        descricao: `Bom volume de referências. A média fica mais estável e o desvio menor.`,
      })
    }

    // 7) Impacto dos cenários simulados
    if (calculo.cenariosAtivos.length > 0 && calculo.impactoCenariosPct !== 0) {
      const sinal = calculo.impactoCenariosPct >= 0 ? "+" : ""
      insights.push({
        tipo: "positivo",
        titulo: "Cenários simulados aplicados",
        descricao: `Os ajustes de cenário (${calculo.cenariosAtivos.length}) adicionaram ${sinal}${calculo.impactoCenariosPct.toFixed(1)}% ao valor base.`,
        impactoPct: calculo.impactoCenariosPct,
      })
    }

    // 8) Diferença de área do alvo em relação à média das amostras
    const areaMedia = amostras.reduce((s, a) => s + a.areaTotal, 0) / amostras.length
    const difAreaPct = ((alvo.areaTotal - areaMedia) / areaMedia) * 100
    if (Math.abs(difAreaPct) >= 10) {
      insights.push({
        tipo: "neutro",
        titulo: difAreaPct > 0 ? "Alvo com área acima da média das amostras" : "Alvo com área abaixo da média das amostras",
        descricao: `O imóvel-alvo tem ${alvo.areaTotal}m² — ${Math.abs(difAreaPct).toFixed(0)}% ${difAreaPct > 0 ? "maior" : "menor"} que a média das amostras (${areaMedia.toFixed(0)}m²). Isso já foi ponderado no cálculo.`,
      })
    }

    // 9) Dimensões da similaridade — qual foi o gargalo mais comum
    const dimensoesFracas = analisarGargaloSimilaridade(calculo)
    if (dimensoesFracas.length) {
      insights.push({
        tipo: "neutro",
        titulo: "Onde as amostras mais divergem do alvo",
        descricao: `Nas dimensões: ${dimensoesFracas.map((d) => rotuloDimensao(d)).join(", ")}. Amostras que diferem muito nessas dimensões pesam menos na média.`,
      })
    }

    return insights
  },
}

// ============================================================
// Helpers
// ============================================================

function fmt(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v)
}

function calcCV(valores: number[], media: number): number {
  if (media <= 0 || !valores.length) return 0
  const variancia = valores.reduce((s, v) => s + (v - media) ** 2, 0) / valores.length
  return Math.sqrt(variancia) / media
}

function calcPesoRelativo(calculo: ACMCalculo, idx: number): number {
  const total = calculo.pesosAplicados.reduce((s, p) => s + p, 0) || 1
  return (calculo.pesosAplicados[idx] || 0) / total
}

function descreverConfianca(calculo: ACMCalculo, n: number): string {
  const partes: string[] = []
  partes.push(`Baseado em ${n} amostra${n !== 1 ? "s" : ""}`)
  const simMedia = calculo.similaridades.length
    ? Math.round(calculo.similaridades.reduce((s, v) => s + v, 0) / calculo.similaridades.length)
    : 0
  if (simMedia > 0) partes.push(`similaridade média ${simMedia}%`)
  if (calculo.confianca >= 80) partes.push("dispersão baixa dos preços — resultado consistente")
  else if (calculo.confianca >= 60) partes.push("dispersão moderada — resultado confiável")
  else if (calculo.confianca >= 40) partes.push("dispersão alta — trate como referência")
  else partes.push("dados insuficientes ou muito dispersos")
  return partes.join(", ") + "."
}

function analisarGargaloSimilaridade(calculo: ACMCalculo): (keyof SimilarityWeights)[] {
  if (!calculo.decomposicoes.length) return []
  // Média de cada dimensão entre todas as amostras
  const somaPorDim: Record<string, { soma: number; n: number }> = {}
  for (const dec of calculo.decomposicoes) {
    for (const c of dec.contribuicoes) {
      somaPorDim[c.dimensao] ||= { soma: 0, n: 0 }
      somaPorDim[c.dimensao].soma += c.score
      somaPorDim[c.dimensao].n += 1
    }
  }
  const medias = Object.entries(somaPorDim)
    .map(([dim, { soma, n }]) => ({ dim, media: n ? soma / n : 100 }))
    .filter((x) => x.media < 70) // consideramos "gargalo" abaixo de 70
    .sort((a, b) => a.media - b.media)
    .slice(0, 3)
  return medias.map((x) => x.dim) as (keyof SimilarityWeights)[]
}

function rotuloDimensao(d: keyof SimilarityWeights): string {
  const map: Record<keyof SimilarityWeights, string> = {
    area: "área",
    quartos: "quartos",
    banheiros: "banheiros",
    vagas: "vagas",
    condominio: "condomínio",
    iptu: "IPTU",
    idade: "idade do imóvel",
  }
  return map[d] || d
}

// ============================================================
// Fábrica — no futuro dá pra trocar por LLMExplanationSource
// ============================================================
// TODO(siai): fábrica que escolhe entre RegrasExplanationSource e uma futura
// LLMExplanationSource baseado em env var (ex.: PAINEL_EXPLICACAO_MODO=llm).
export function getExplanationSource(): ExplanationSource {
  return RegrasExplanationSource
}
