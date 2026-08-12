/**
 * document.tsx — componentes React-PDF do relatório de ACM.
 *
 * Estrutura (7 blocos numa página A4 vertical, quebra automática):
 *   1. Capa      → título + apelido + data + corretores
 *   2. Sumário   → valor recomendado + confidence + linha de argumento
 *   3. Ficha     → tabela do imóvel-alvo
 *   4. Faixas    → 4 bands (agressivo/recomendado/conservador/premium)
 *   5. Comparativo → tabela lado a lado das amostras
 *   6. Insights  → explicações rule-based
 *   7. Assinatura → CRECI dos dois + WhatsApp
 *
 * Fontes: Manrope (títulos) via Google Fonts + Inter (corpo) via Google Fonts.
 * Se as fontes falharem no boot, cai pra Helvetica built-in do react-pdf.
 */
import React from "react"
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import type { ACM, PriceBand, AmostraACM } from "@/types/acm"
import { rotuloConfianca } from "@/lib/painel/acm-calc"
import { RegrasExplanationSource, type InsightExplicacao } from "@/lib/painel/acm-explicacao"

// Fontes built-in do react-pdf: Helvetica, Helvetica-Bold, Times-Roman, Courier.
// TODO(design): pra chegar num visual editorial-premium, instalar @fontsource/manrope
// e @fontsource/inter localmente e registrar via Font.register apontando pra os arquivos
// no node_modules — depois de estabilizar o resto do painel.
const FONT_HEAD = "Helvetica-Bold"
const FONT_BODY = "Helvetica"

// ============================================================
// Cores canônicas
// ============================================================
const COR = {
  navy: "#2F4156",
  teal: "#567C8D",
  sky: "#C8D9E6",
  beige: "#F5EFEB",
  white: "#FFFFFF",
  muted: "#6B7A85",
  amber: "#D98A00",
  green: "#0F7A54",
  red: "#B23A2E",
}

// ============================================================
// Estilos globais
// ============================================================
const styles = StyleSheet.create({
  page: {
    backgroundColor: COR.beige,
    color: COR.navy,
    fontFamily: FONT_BODY,
    fontSize: 10,
    padding: 40,
    paddingBottom: 60,
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    fontSize: 8,
    color: COR.teal,
    fontFamily: FONT_HEAD,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  brand: {
    fontFamily: FONT_HEAD,
    letterSpacing: 1.4,
  },
  h1: {
    fontFamily: FONT_HEAD,
    fontSize: 30,
    color: COR.navy,
    lineHeight: 1.1,
    marginBottom: 4,
  },
  h2: {
    fontFamily: FONT_HEAD,
    fontSize: 16,
    color: COR.navy,
    marginBottom: 6,
  },
  h3: {
    fontFamily: FONT_HEAD,
    fontSize: 12,
    color: COR.navy,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  eyebrow: {
    fontFamily: FONT_HEAD,
    fontSize: 8,
    color: COR.teal,
    textTransform: "uppercase",
    letterSpacing: 1.6,
    marginBottom: 3,
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.5,
    color: COR.navy,
    marginBottom: 6,
  },
  small: { fontSize: 8.5, color: COR.muted, lineHeight: 1.5 },
  divider: { borderBottomWidth: 1, borderBottomColor: COR.sky, marginVertical: 14 },

  // Hero (valor recomendado)
  heroCard: {
    backgroundColor: COR.navy,
    color: COR.beige,
    borderRadius: 10,
    padding: 20,
    marginBottom: 14,
  },
  heroValor: {
    fontFamily: FONT_HEAD,
    fontSize: 34,
    color: COR.beige,
    marginTop: 6,
  },
  heroRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  heroPill: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "rgba(245,239,235,0.25)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    fontSize: 8,
    color: COR.beige,
    fontFamily: FONT_HEAD,
  },

  // Cards genéricos
  card: {
    backgroundColor: COR.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COR.sky,
    padding: 12,
    marginBottom: 10,
  },

  // Tabela
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COR.sky,
    paddingVertical: 5,
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COR.teal,
    paddingBottom: 4,
    marginBottom: 4,
  },
  th: {
    fontFamily: FONT_HEAD,
    fontSize: 7.5,
    color: COR.teal,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  td: {
    fontSize: 9,
    color: COR.navy,
    fontFamily: FONT_BODY,
  },
  tdAlvo: {
    fontSize: 9,
    color: COR.navy,
    fontFamily: FONT_HEAD,
    backgroundColor: "rgba(47,65,86,0.06)",
  },

  // Bands
  bandsRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  bandCard: {
    flex: 1,
    backgroundColor: COR.white,
    borderWidth: 1,
    borderColor: COR.sky,
    borderRadius: 8,
    padding: 10,
  },
  bandLabel: {
    fontFamily: FONT_HEAD,
    fontSize: 7,
    color: COR.teal,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  bandValor: {
    fontFamily: FONT_HEAD,
    fontSize: 13,
    color: COR.navy,
    marginTop: 3,
  },
  bandDias: { fontSize: 7.5, color: COR.muted, marginTop: 2 },
  bandDesc: { fontSize: 7.5, color: COR.navy, marginTop: 4, lineHeight: 1.3 },

  // Insight cards
  insightCard: {
    flexDirection: "row",
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 5,
    backgroundColor: COR.white,
  },
  insightBullet: { width: 14, fontSize: 12, marginRight: 4, fontFamily: FONT_HEAD },
  insightBody: { flex: 1 },
  insightTitulo: { fontFamily: FONT_HEAD, fontSize: 9, color: COR.navy },
  insightDesc: { fontSize: 8.5, color: COR.navy, marginTop: 1.5, lineHeight: 1.4 },

  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: COR.muted,
    borderTopWidth: 1,
    borderTopColor: COR.sky,
    paddingTop: 8,
  },
  pageNumber: { fontFamily: FONT_HEAD },
})

// ============================================================
// Helpers
// ============================================================
function fmtReais(v: number | undefined | null): string {
  if (typeof v !== "number" || !isFinite(v) || v <= 0) return "—"
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v)
}
function fmtDate(iso: string | undefined): string {
  if (!iso) return ""
  try {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(iso))
  } catch { return "" }
}
function fmtN(v: number | undefined | null, sufixo = ""): string {
  if (typeof v !== "number" || !isFinite(v) || v <= 0) return "—"
  return `${v}${sufixo}`
}

const CRECI_ASSINATURA = "Patrícia Vidal · CRECI 68850   ·   Júlio Aguiar · CRECI 79271"

// ============================================================
// Componente principal
// ============================================================
export function AcmPdfDocument({ acm }: { acm: ACM }) {
  const c = acm.calculo
  const conf = rotuloConfianca(c.confianca)
  const insights = RegrasExplanationSource.generate({
    alvo: acm.imovelAlvo,
    amostras: acm.amostras,
    calculo: c,
  })

  return (
    <Document
      title={`ACM · ${acm.imovelAlvo.apelido}`}
      author="Patrícia Vidal e Júlio Aguiar · Corretores"
      creator="Painel dos Corretores"
      producer="Painel dos Corretores"
    >
      <Page size="A4" style={styles.page} wrap>
        {/* Header bar */}
        <View style={styles.headerBar} fixed>
          <Text style={styles.brand}>PJ · Corretores</Text>
          <Text>Análise Comparativa de Mercado</Text>
        </View>

        {/* CAPA */}
        <View>
          <Text style={styles.eyebrow}>Análise Comparativa de Mercado</Text>
          <Text style={styles.h1}>{acm.imovelAlvo.apelido || "Imóvel avaliado"}</Text>
          <Text style={{ ...styles.paragraph, marginTop: 2 }}>
            {acm.imovelAlvo.bairro}, {acm.imovelAlvo.cidade}
            {"  ·  "}Análise emitida em {fmtDate(acm.criadoEm)}
          </Text>
        </View>

        {/* HERO VALOR RECOMENDADO */}
        <View style={styles.heroCard}>
          <Text style={{ fontSize: 8, color: "rgba(245,239,235,0.75)", fontFamily: FONT_HEAD, textTransform: "uppercase", letterSpacing: 1.4 }}>
            Valor recomendado
          </Text>
          <Text style={styles.heroValor}>{fmtReais(c.valorSugerido)}</Text>
          <Text style={{ fontSize: 9, color: "rgba(245,239,235,0.85)", marginTop: 4, lineHeight: 1.4 }}>
            Baseado em {acm.amostras.length} amostra{acm.amostras.length !== 1 ? "s" : ""} no bairro, ponderadas por proximidade de área.
            Preço/m² médio: {fmtReais(c.precoM2Medio)}/m² · Range de negociação ±8%.
          </Text>
          <View style={styles.heroRow}>
            <Text style={styles.heroPill}>Confiança {conf.label} · {c.confianca}%</Text>
            <Text style={styles.heroPill}>Piso {fmtReais(c.valorMinimo)}</Text>
            <Text style={styles.heroPill}>Teto {fmtReais(c.valorMaximo)}</Text>
          </View>
        </View>

        {/* FICHA DO IMÓVEL ALVO */}
        <View style={styles.card}>
          <Text style={styles.h3}>Imóvel avaliado</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 }}>
            <FichaItem label="Endereço" valor={acm.imovelAlvo.endereco || "—"} largura="100%" />
            <FichaItem label="Bairro / Cidade" valor={`${acm.imovelAlvo.bairro}, ${acm.imovelAlvo.cidade}`} />
            <FichaItem label="Área total" valor={fmtN(acm.imovelAlvo.areaTotal, " m²")} />
            <FichaItem label="Quartos" valor={fmtN(acm.imovelAlvo.quartos)} />
            {acm.imovelAlvo.suites ? <FichaItem label="Suítes" valor={String(acm.imovelAlvo.suites)} /> : null}
            <FichaItem label="Banheiros" valor={fmtN(acm.imovelAlvo.banheiros)} />
            <FichaItem label="Vagas" valor={fmtN(acm.imovelAlvo.vagas)} />
            {acm.imovelAlvo.condominio ? <FichaItem label="Condomínio" valor={fmtReais(acm.imovelAlvo.condominio)} /> : null}
            {acm.imovelAlvo.iptu ? <FichaItem label="IPTU" valor={fmtReais(acm.imovelAlvo.iptu)} /> : null}
          </View>
          {acm.imovelAlvo.observacoes && (
            <Text style={{ ...styles.paragraph, marginTop: 8, fontStyle: "italic", color: COR.muted }}>
              {acm.imovelAlvo.observacoes}
            </Text>
          )}
        </View>

        {/* BANDS DE PRECIFICAÇÃO */}
        <BlocoBands bands={c.bands} />

        {/* COMPARATIVO */}
        <View style={styles.card} wrap={false}>
          <Text style={styles.h3}>Comparativo de amostras</Text>
          <BlocoComparativo alvo={acm.imovelAlvo} amostras={acm.amostras} similaridades={c.similaridades} pesos={c.pesosAplicados} precoM2Medio={c.precoM2Medio} />
        </View>

        {/* INSIGHTS */}
        {insights.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.h3}>Fatores considerados</Text>
            {insights.map((ins, i) => (
              <BlocoInsight key={i} insight={ins} />
            ))}
          </View>
        )}

        {/* CENÁRIOS APLICADOS (se houver) */}
        {c.cenariosAtivos.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.h3}>Cenários simulados aplicados</Text>
            <Text style={styles.paragraph}>
              {c.cenariosAtivos.map((id) => rotuloCenario(id)).join(" · ")}
            </Text>
            <Text style={styles.small}>
              Impacto total no valor recomendado: {c.impactoCenariosPct >= 0 ? "+" : ""}{c.impactoCenariosPct.toFixed(1)}%.
            </Text>
          </View>
        )}

        {/* NOTA METODOLÓGICA */}
        <View style={{ ...styles.card, backgroundColor: COR.sky, borderColor: COR.teal }}>
          <Text style={styles.h3}>Como esse valor foi calculado</Text>
          <Text style={{ ...styles.paragraph, fontSize: 9 }}>
            Cada amostra recebe um score de similaridade multi-dimensional (0–100) considerando área, quartos, banheiros, vagas,
            condomínio e IPTU. O preço/m² de cada uma é ponderado pela similaridade — quanto mais parecida com o alvo, mais peso na média.
            O valor recomendado é o preço/m² médio ponderado × área do alvo. Range de negociação é ±8% do recomendado.
            A confiança avalia quantidade de amostras, dispersão de preço/m² e similaridade média.
          </Text>
        </View>

        {/* ASSINATURA */}
        <View style={{ marginTop: 6 }}>
          <Text style={{ ...styles.h3, marginBottom: 2 }}>Assinam esta análise</Text>
          <Text style={{ ...styles.paragraph, fontFamily: FONT_HEAD }}>
            {CRECI_ASSINATURA}
          </Text>
          <Text style={styles.small}>
            Este documento é uma análise de referência de mercado com base em imóveis à venda na data emitida.
            Não constitui laudo pericial nem tem valor tributário. Recomendação sujeita a avaliação final do proprietário.
          </Text>
        </View>

        {/* Footer com paginação */}
        <View style={styles.footer} fixed>
          <Text>Patrícia Vidal · Júlio Aguiar · Corretores de Imóveis</Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}

// ============================================================
// Sub-componentes
// ============================================================
function FichaItem({ label, valor, largura = "48%" }: { label: string; valor: string; largura?: string }) {
  return (
    <View style={{ width: largura as any, marginBottom: 4 }}>
      <Text style={{ ...styles.eyebrow, marginBottom: 1 }}>{label}</Text>
      <Text style={{ fontSize: 10, color: COR.navy, fontFamily: FONT_BODY }}>{valor}</Text>
    </View>
  )
}

function BlocoBands({ bands }: { bands: PriceBand[] }) {
  if (!bands || bands.length === 0) return null
  return (
    <View style={styles.card} wrap={false}>
      <Text style={styles.h3}>Faixas de preço</Text>
      <View style={styles.bandsRow}>
        {bands.map((b) => (
          <View key={b.id} style={styles.bandCard}>
            <Text style={styles.bandLabel}>{b.label}</Text>
            <Text style={styles.bandValor}>{fmtReais(b.valor)}</Text>
            <Text style={styles.bandDias}>~{b.diasEstimados} dias para vender</Text>
            <Text style={styles.bandDesc}>{b.descricao}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

function BlocoComparativo({
  alvo, amostras, similaridades, pesos, precoM2Medio,
}: {
  alvo: ACM["imovelAlvo"]
  amostras: AmostraACM[]
  similaridades: number[]
  pesos: number[]
  precoM2Medio: number
}) {
  const pesoTotal = pesos.reduce((s, p) => s + p, 0) || 1

  // Header
  const headerCells = ["Característica", "Alvo", ...amostras.map((_, i) => `A${i + 1}`)]
  const rows: { label: string; values: string[]; bold?: boolean }[] = [
    { label: "Bairro", values: [alvo.bairro || "—", ...amostras.map((a) => a.bairro || "—")] },
    { label: "Área", values: [fmtN(alvo.areaTotal, " m²"), ...amostras.map((a) => fmtN(a.areaTotal, " m²"))] },
    { label: "Quartos", values: [fmtN(alvo.quartos), ...amostras.map((a) => fmtN(a.quartos))] },
    { label: "Banheiros", values: [fmtN(alvo.banheiros), ...amostras.map((a) => fmtN(a.banheiros))] },
    { label: "Vagas", values: [String(alvo.vagas ?? "—"), ...amostras.map((a) => String(a.vagas ?? "—"))] },
    { label: "Preço", values: ["—", ...amostras.map((a) => fmtReais(a.precoAnuncio))], bold: true },
    { label: "R$/m²", values: [fmtReais(precoM2Medio) + " (méd.)", ...amostras.map((a) => fmtReais(a.precoM2))], bold: true },
    { label: "Similaridade", values: ["100%", ...similaridades.map((s) => `${s}%`)] },
    { label: "Peso na média", values: ["—", ...pesos.map((p) => `${((p / pesoTotal) * 100).toFixed(0)}%`)] },
  ]

  const colFlex = [2.5, 1.5, ...amostras.map(() => 1)]

  return (
    <View style={{ marginTop: 4 }}>
      {/* header */}
      <View style={styles.tableHeaderRow}>
        {headerCells.map((c, i) => (
          <Text key={i} style={{ ...styles.th, flex: colFlex[i] }}>{c}</Text>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.tableRow}>
          {[row.label, ...row.values].map((cell, ci) => (
            <Text
              key={ci}
              style={{
                ...(ci === 0 ? styles.th : ci === 1 ? styles.tdAlvo : styles.td),
                flex: colFlex[ci],
                fontFamily: row.bold || ci === 0 || ci === 1 ? FONT_HEAD : FONT_BODY,
                fontSize: ci === 0 ? 7.5 : 9,
                paddingVertical: 1,
              }}
            >
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  )
}

function BlocoInsight({ insight }: { insight: InsightExplicacao }) {
  const cor =
    insight.tipo === "positivo" ? COR.green :
    insight.tipo === "alerta"   ? COR.amber :
    insight.tipo === "negativo" ? COR.red   : COR.teal
  const marker =
    insight.tipo === "positivo" ? "✓" :
    insight.tipo === "alerta"   ? "!" :
    insight.tipo === "negativo" ? "✕" : "•"
  return (
    <View style={{ ...styles.insightCard, borderColor: cor }}>
      <Text style={{ ...styles.insightBullet, color: cor }}>{marker}</Text>
      <View style={styles.insightBody}>
        <Text style={styles.insightTitulo}>{insight.titulo}</Text>
        <Text style={styles.insightDesc}>{insight.descricao}</Text>
      </View>
    </View>
  )
}

function rotuloCenario(id: string): string {
  const map: Record<string, string> = {
    "reforma-cozinha": "Reforma da cozinha",
    "reforma-banheiro": "Reforma de banheiro",
    "pintura-recente": "Pintura recente",
    "mobiliado": "Vender mobiliado",
    "vista": "Vista permanente / diferenciada",
    "andar-alto": "Andar alto",
    "exclusividade": "Vender com exclusividade",
  }
  return map[id] || id
}
