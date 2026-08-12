"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import {
  ArrowLeft, AlertCircle, FileText, TrendingUp, Building2, ShieldCheck, Layers,
  CheckCircle2, AlertTriangle, Target, Info,
} from "lucide-react"
import { apiGetAcm } from "@/lib/painel/acm-api"
import { rotuloConfianca } from "@/lib/painel/acm-calc"
import { getExplanationSource, type InsightExplicacao } from "@/lib/painel/acm-explicacao"
import type { ACM } from "@/types/acm"

/**
 * Detalhe de uma ACM — mostra o cálculo salvo (bands, confidence, explicabilidade).
 * PDF export sai em B.3.
 */
export default function AcmDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [acm, setAcm] = useState<ACM | null | undefined>(undefined)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let mounted = true
    apiGetAcm(String(id))
      .then((data) => { if (mounted) setAcm(data) })
      .catch((e: Error) => { if (mounted) { setErro(e.message); setAcm(null) } })
    return () => { mounted = false }
  }, [id])

  const insights: InsightExplicacao[] = useMemo(() => {
    if (!acm) return []
    return getExplanationSource().generate({
      alvo: acm.imovelAlvo,
      amostras: acm.amostras,
      calculo: acm.calculo,
    })
  }, [acm])

  if (acm === undefined) {
    return (
      <div className="px-5 lg:px-10 pt-6 lg:pt-10 pb-10 space-y-4 max-w-5xl">
        <div className="h-4 w-24 rounded bg-sky/40 animate-pulse" />
        <div className="h-8 w-2/3 rounded bg-sky/40 animate-pulse" />
        <div className="h-40 rounded-3xl bg-sky/25 animate-pulse" />
        <div className="h-60 rounded-3xl bg-sky/20 animate-pulse" />
      </div>
    )
  }

  if (acm === null) {
    return (
      <div className="px-5 lg:px-10 pt-6 lg:pt-10 pb-10 space-y-4 max-w-2xl">
        <Link href="/painel/acm" className="inline-flex items-center gap-1.5 text-[12px] text-teal hover:text-navy">
          <ArrowLeft size={13} /> Voltar
        </Link>
        <div className="rounded-3xl border border-sky/60 bg-white p-6 flex items-start gap-3">
          <AlertCircle size={16} className="text-red-700 mt-0.5" />
          <div>
            <h2 className="font-display text-[16px] font-bold text-navy">Análise não encontrada</h2>
            <p className="text-[12.5px] text-teal mt-1">{erro || "Verifique o link e tente novamente."}</p>
          </div>
        </div>
      </div>
    )
  }

  const c = acm.calculo
  const confRot = rotuloConfianca(c.confianca)

  return (
    <div className="px-5 lg:px-10 pt-6 lg:pt-10 pb-10 space-y-6 max-w-5xl">
      {/* HEADER */}
      <div>
        <Link href="/painel/acm" className="inline-flex items-center gap-1.5 text-[12px] text-teal hover:text-navy transition-colors">
          <ArrowLeft size={13} />
          Voltar pra lista
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal">Análise Comparativa</div>
            <h1 className="mt-1 font-display text-[24px] lg:text-[30px] font-bold text-navy tracking-tight leading-tight">
              {acm.imovelAlvo.apelido}
            </h1>
            <p className="mt-1 text-[12.5px] text-teal">
              {acm.imovelAlvo.bairro}, {acm.imovelAlvo.cidade} · {acm.amostras.length} amostras · {acm.status === "concluida" ? "Concluída" : "Rascunho"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/api/acm/${acm.slug}/pdf?inline=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-navy text-[12px] font-semibold bg-white border border-sky hover:bg-beige transition-colors"
              title="Abrir PDF numa nova aba (não baixa)"
            >
              <FileText size={13} strokeWidth={2} />
              Ver PDF
            </a>
            <a
              href={`/api/acm/${acm.slug}/pdf`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-beige text-[12.5px] font-bold transition-transform active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)", boxShadow: "0 10px 22px -8px rgba(47,65,86,0.45)" }}
            >
              <FileText size={14} strokeWidth={2.2} />
              Baixar PDF
            </a>
          </div>
        </div>
      </div>

      {/* Valor sugerido + confidence */}
      <section
        className="relative overflow-hidden rounded-3xl px-6 py-8 lg:px-10 lg:py-9 text-beige"
        style={{ background: "linear-gradient(135deg, #2F4156 0%, #567C8D 100%)" }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider"
              style={{ background: "rgba(245,239,235,0.16)", color: "#F5EFEB" }}
            >
              <ShieldCheck size={11} strokeWidth={2.4} />
              Confiança {confRot.label} · <span className="tabular-nums">{c.confianca}%</span>
            </span>
            {c.cenariosAtivos.length > 0 && (
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-beige/70">
                {c.cenariosAtivos.length} cenário{c.cenariosAtivos.length > 1 ? "s" : ""} aplicado{c.cenariosAtivos.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="mt-3 flex items-end gap-2 flex-wrap">
            <div className="font-display text-[38px] lg:text-[48px] font-bold leading-none tabular-nums">
              {fmtReais(c.valorSugerido)}
            </div>
            <div className="pb-2 text-[13px] text-beige/70">valor recomendado</div>
          </div>
          <p className="mt-4 text-[12px] text-beige/80 leading-relaxed max-w-xl">
            Base: <b className="tabular-nums">{fmtReais(c.precoM2Medio)}/m²</b> × {acm.imovelAlvo.areaTotal} m² (área do alvo)
            {c.impactoCenariosPct !== 0 && (
              <> · {c.impactoCenariosPct > 0 ? "+" : ""}{c.impactoCenariosPct.toFixed(1)}% cenários simulados</>
            )}. Range de negociação ±8%.
          </p>
        </div>
        <div className="pointer-events-none absolute -right-10 -bottom-14 w-[280px] h-[280px] rounded-full opacity-30" style={{ background: "radial-gradient(circle, rgba(200,217,230,0.45), transparent 70%)" }} />
      </section>

      {/* Bands */}
      {c.bands.length > 0 && (
        <section className="rounded-3xl border border-sky/60 bg-white p-5 lg:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-teal" />
            <h2 className="font-display text-[15px] font-bold text-navy">Faixas de preço</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {c.bands.map((b) => (
              <div key={b.id} className="rounded-2xl p-4 border border-sky/50 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal">{b.label}</span>
                  <span className="text-[9.5px] tabular-nums font-bold text-navy/60">~{b.diasEstimados}d</span>
                </div>
                <div className="mt-1 font-display text-[18px] font-bold text-navy tabular-nums">{fmtReais(b.valor)}</div>
                <p className="mt-1.5 text-[10.5px] text-navy/70 leading-relaxed">{b.descricao}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Explicabilidade */}
      {insights.length > 0 && (
        <section className="rounded-3xl border border-sky/60 bg-white p-5 lg:p-6 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-teal" />
            <h2 className="font-display text-[15px] font-bold text-navy">Por que esse valor</h2>
          </div>
          <ul className="space-y-2">
            {insights.map((ins, i) => (
              <InsightCard key={i} insight={ins} />
            ))}
          </ul>
        </section>
      )}

      {/* Amostras */}
      <section className="rounded-3xl border border-sky/60 bg-white p-5 lg:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Building2 size={14} className="text-teal" />
          <h2 className="font-display text-[15px] font-bold text-navy">Amostras usadas no cálculo</h2>
        </div>
        {acm.amostras.length === 0 ? (
          <p className="text-[12.5px] text-teal">Nenhuma amostra cadastrada.</p>
        ) : (
          <ul className="divide-y divide-sky/40">
            {acm.amostras.map((a, i) => {
              const sim = c.similaridades[i] ?? 0
              const pesoRel = calcPesoRelativo(c.pesosAplicados, i)
              return (
                <li key={a.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg grid place-items-center text-beige font-bold text-[13px] flex-shrink-0" style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)" }}>
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-navy truncate">
                        {a.bairro || acm.imovelAlvo.bairro} · {a.areaTotal} m² · {a.quartos}Q · {a.banheiros}B · {a.vagas}V
                      </div>
                      <div className="text-[10.5px] text-teal truncate">
                        {a.fonte ? `${a.fonte} · ` : ""}Similaridade <b className="tabular-nums">{sim}%</b> · pesou <b className="tabular-nums">{(pesoRel * 100).toFixed(0)}%</b> na média
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[13px] font-bold text-navy tabular-nums">{fmtReais(a.precoAnuncio)}</div>
                    <div className="text-[10.5px] text-teal tabular-nums">{fmtReais(a.precoM2)}/m²</div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <div className="flex items-start gap-2 p-3 rounded-2xl bg-beige/60 border border-sky/60">
        <Info size={12} className="text-teal flex-shrink-0 mt-0.5" />
        <p className="text-[10.5px] text-navy/70 leading-relaxed">
          Cálculo salvo em <code className="text-[10px] px-1 py-0.5 rounded bg-white border border-sky/60">data/acm.json</code>. Confidence, bands e explicações são recomputadas a partir dos dados registrados no momento da análise.
        </p>
      </div>
    </div>
  )
}

// ============================================================
// Sub-componentes
// ============================================================

function InsightCard({ insight }: { insight: InsightExplicacao }) {
  const { icon: Icon, bg, border, iconColor } = pickInsightStyle(insight.tipo)
  return (
    <li className="flex items-start gap-3 p-3 rounded-2xl border" style={{ background: bg, borderColor: border }}>
      <Icon size={14} className="flex-shrink-0 mt-0.5" style={{ color: iconColor }} />
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-bold text-navy">{insight.titulo}</div>
        <p className="mt-0.5 text-[11.5px] text-navy/75 leading-relaxed">{insight.descricao}</p>
      </div>
    </li>
  )
}

function pickInsightStyle(tipo: InsightExplicacao["tipo"]) {
  if (tipo === "positivo") return { icon: CheckCircle2, bg: "rgba(15,122,84,0.08)", border: "rgba(15,122,84,0.24)", iconColor: "#0F7A54" }
  if (tipo === "alerta")   return { icon: AlertTriangle, bg: "rgba(217,138,0,0.08)", border: "rgba(217,138,0,0.28)", iconColor: "#D98A00" }
  if (tipo === "negativo") return { icon: AlertTriangle, bg: "rgba(178,58,46,0.08)", border: "rgba(178,58,46,0.28)", iconColor: "#B23A2E" }
  return { icon: Target, bg: "rgba(86,124,141,0.08)", border: "rgba(86,124,141,0.28)", iconColor: "#567C8D" }
}

function calcPesoRelativo(pesos: number[], idx: number): number {
  const total = pesos.reduce((s, p) => s + p, 0) || 1
  return (pesos[idx] || 0) / total
}

function fmtReais(v: number | undefined | null): string {
  if (typeof v !== "number" || !isFinite(v) || v <= 0) return "—"
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v)
}
