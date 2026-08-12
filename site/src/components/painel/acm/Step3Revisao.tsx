"use client"

import { useMemo, useState } from "react"
import {
  TrendingUp, ArrowUp, ArrowDown, Sliders, Info, Sparkles, Zap, ShieldCheck,
  AlertTriangle, CheckCircle2, Target, Layers,
} from "lucide-react"
import type { AmostraACM, ACMCalculo, ImovelAlvoACM } from "@/types/acm"
import { computeSugestao, rotuloConfianca, CENARIOS_DISPONIVEIS } from "@/lib/painel/acm-calc"
import { getExplanationSource, type InsightExplicacao } from "@/lib/painel/acm-explicacao"
import { fmtReais } from "./campos"

interface Props {
  alvo: ImovelAlvoACM
  amostras: AmostraACM[]
  cenariosAtivos: string[]
  onCenariosChange: (ids: string[]) => void
  onAmostraChange: (id: string, patch: Partial<AmostraACM>) => void
}

export function Step3Revisao({
  alvo, amostras, cenariosAtivos, onCenariosChange, onAmostraChange,
}: Props) {
  // Recalcula em tempo real quando cenário/ajuste muda
  const calculo: ACMCalculo = useMemo(
    () => computeSugestao(alvo, amostras, cenariosAtivos),
    [alvo, amostras, cenariosAtivos],
  )

  const insights: InsightExplicacao[] = useMemo(
    () => getExplanationSource().generate({ alvo, amostras, calculo }),
    [alvo, amostras, calculo],
  )

  const confRot = rotuloConfianca(calculo.confianca)
  const [bandDestaque, setBandDestaque] = useState<string>("recomendado")

  return (
    <div className="space-y-6">
      {/* HEADER + Valor sugerido */}
      <section
        className="relative overflow-hidden rounded-3xl px-6 py-8 lg:px-10 lg:py-10 text-beige"
        style={{ background: "linear-gradient(135deg, #2F4156 0%, #567C8D 100%)" }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-beige/70">Passo 3 de 3 · Sugestão</div>
            <ConfidenceChip label={confRot.label} valor={calculo.confianca} />
          </div>
          <div className="mt-3 flex items-end gap-2 flex-wrap">
            <div className="font-display text-[38px] lg:text-[48px] font-bold leading-none tabular-nums">
              {fmtReais(calculo.valorSugerido)}
            </div>
            <div className="pb-2 text-[13px] text-beige/70">
              valor recomendado pra <span className="text-beige font-semibold">{alvo.apelido || "seu imóvel"}</span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <RangePill icon={ArrowDown} label="Piso de negociação" valor={calculo.valorMinimo} />
            <RangePill icon={ArrowUp} label="Teto de exposição" valor={calculo.valorMaximo} />
          </div>
          <p className="mt-5 text-[12px] text-beige/80 leading-relaxed max-w-xl">
            Base: <b className="tabular-nums">{fmtReais(calculo.precoM2Medio)}/m²</b> × {alvo.areaTotal} m² (área do alvo)
            {calculo.impactoCenariosPct !== 0 && (
              <> · {calculo.impactoCenariosPct > 0 ? "+" : ""}{calculo.impactoCenariosPct.toFixed(1)}% cenários simulados</>
            )}.
          </p>
        </div>
        <div className="pointer-events-none absolute -right-10 -bottom-14 w-[280px] h-[280px] rounded-full opacity-30" style={{ background: "radial-gradient(circle, rgba(200,217,230,0.45), transparent 70%)" }} />
      </section>

      {/* PRICE BANDS */}
      <section className="rounded-3xl border border-sky/60 bg-white p-5 lg:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-teal" />
          <h2 className="font-display text-[15px] font-bold text-navy">Faixas de preço</h2>
          <span className="text-[11px] text-teal">— escolha o posicionamento estratégico</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {calculo.bands.map((b) => {
            const ativo = bandDestaque === b.id
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setBandDestaque(b.id)}
                className={`text-left rounded-2xl p-4 border transition-all ${
                  ativo
                    ? "border-teal shadow-[0_10px_22px_-8px_rgba(47,65,86,0.35)]"
                    : "border-sky/50 hover:border-sky"
                }`}
                style={{ background: ativo ? "#F5EFEB" : "#fff" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal">{b.label}</span>
                  <span className="text-[9.5px] tabular-nums font-bold text-navy/60">~{b.diasEstimados}d</span>
                </div>
                <div className="mt-1 font-display text-[18px] font-bold text-navy tabular-nums">{fmtReais(b.valor)}</div>
                <p className="mt-1.5 text-[10.5px] text-navy/70 leading-relaxed">{b.descricao}</p>
              </button>
            )
          })}
        </div>
      </section>

      {/* SIMULADOR DE CENÁRIOS */}
      <section className="rounded-3xl border border-sky/60 bg-white p-5 lg:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-teal" />
          <h2 className="font-display text-[15px] font-bold text-navy">Simulador de cenários</h2>
          <span className="text-[11px] text-teal">— marque o que se aplica</span>
        </div>
        <p className="text-[11.5px] text-navy/70 leading-relaxed">
          Cada cenário aplica um ajuste percentual em cima do valor base. O total é multiplicativo (não somativo) — a ordem de magnitude é o que importa.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {CENARIOS_DISPONIVEIS.map((c) => {
            const ativo = cenariosAtivos.includes(c.id)
            return (
              <label
                key={c.id}
                className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-colors ${
                  ativo ? "border-teal bg-sky/25" : "border-sky/50 bg-white hover:border-sky"
                }`}
              >
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={() => {
                    if (ativo) onCenariosChange(cenariosAtivos.filter((x) => x !== c.id))
                    else onCenariosChange([...cenariosAtivos, c.id])
                  }}
                  className="w-4 h-4 accent-navy mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12.5px] font-bold text-navy">{c.label}</span>
                    <span className={`text-[10.5px] font-bold tabular-nums ${c.impactoPct >= 0 ? "text-teal" : "text-red-700"}`}>
                      {c.impactoPct > 0 ? "+" : ""}{c.impactoPct}%
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10.5px] text-navy/65 leading-relaxed">{c.descricao}</p>
                </div>
              </label>
            )
          })}
        </div>
        {cenariosAtivos.length > 0 && (
          <div className="pt-3 border-t border-sky/50 flex items-center justify-between gap-3">
            <span className="text-[11px] text-teal">
              {cenariosAtivos.length} cenário{cenariosAtivos.length > 1 ? "s" : ""} ativo{cenariosAtivos.length > 1 ? "s" : ""} · impacto total <b className="tabular-nums">{calculo.impactoCenariosPct > 0 ? "+" : ""}{calculo.impactoCenariosPct.toFixed(1)}%</b>
            </span>
            <button
              type="button"
              onClick={() => onCenariosChange([])}
              className="text-[10.5px] font-semibold text-teal hover:text-navy"
            >
              Limpar
            </button>
          </div>
        )}
      </section>

      {/* EXPLICABILIDADE */}
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
        <div className="mt-2 p-3 rounded-2xl bg-beige/60 border border-sky/60 flex items-start gap-2">
          <Info size={12} className="text-teal flex-shrink-0 mt-0.5" />
          <p className="text-[10.5px] text-navy/70 leading-relaxed">
            Explicações geradas por regras a partir do cálculo. Não é IA generativa — cada frase deriva direto de um número deste relatório.
          </p>
        </div>
      </section>

      {/* Tabela comparativa */}
      <section className="rounded-3xl border border-sky/60 bg-white p-4 lg:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-teal" />
          <h2 className="font-display text-[15px] font-bold text-navy">Comparativo</h2>
        </div>

        <div className="overflow-x-auto -mx-4 lg:-mx-6">
          <table className="w-full min-w-[720px] text-[12px]">
            <thead>
              <tr className="text-left">
                <th className="px-4 lg:px-6 py-2 text-[10px] font-bold uppercase tracking-wider text-teal">Característica</th>
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-navy bg-navy/10">Alvo</th>
                {amostras.map((_, i) => (
                  <th key={i} className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-teal">A{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-sky/40">
              <Row label="Bairro" values={[alvo.bairro || "—", ...amostras.map((a) => a.bairro || "—")]} />
              <Row label="Área" values={[fmtStr(alvo.areaTotal, " m²"), ...amostras.map((a) => fmtStr(a.areaTotal, " m²"))]} numeric />
              <Row label="Quartos" values={[String(alvo.quartos || "—"), ...amostras.map((a) => String(a.quartos || "—"))]} numeric />
              <Row label="Banheiros" values={[String(alvo.banheiros || "—"), ...amostras.map((a) => String(a.banheiros || "—"))]} numeric />
              <Row label="Vagas" values={[String(alvo.vagas ?? "—"), ...amostras.map((a) => String(a.vagas ?? "—"))]} numeric />
              <Row label="Preço" values={["—", ...amostras.map((a) => fmtReais(a.precoAnuncio))]} numeric bold />
              <Row label="R$/m²" values={[fmtReais(calculo.precoM2Medio) + " (méd.)", ...amostras.map((a) => fmtReais(a.precoM2))]} numeric bold />
              <Row
                label="Similaridade"
                values={["100%", ...calculo.similaridades.map((s) => s + "%")]}
                numeric
                hint="Score composto: área, quartos, banheiros, vagas, condomínio, IPTU."
              />
              <Row
                label="Peso na média"
                values={["—", ...calculo.pesosAplicados.map((p, i) => {
                  const total = calculo.pesosAplicados.reduce((s, x) => s + x, 0) || 1
                  return ((p / total) * 100).toFixed(0) + "%"
                })]}
                numeric
              />
            </tbody>
          </table>
        </div>
      </section>

      {/* Ajuste percentual por amostra */}
      <section className="rounded-3xl border border-sky/60 bg-white p-4 lg:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sliders size={14} className="text-teal" />
          <h2 className="font-display text-[15px] font-bold text-navy">Ajustar amostra (opcional)</h2>
        </div>
        <p className="text-[11.5px] text-teal">
          Se uma amostra tem condição que a diferencia (ex.: reforma pesada pendente), aplique um ajuste percentual no preço/m² dela antes de entrar na média. Não mexa sem motivo.
        </p>

        <div className="space-y-2">
          {amostras.map((a, i) => (
            <div key={a.id} className="flex items-center gap-3 p-3 rounded-2xl bg-beige/40 border border-sky/40">
              <span className="w-8 h-8 rounded-lg grid place-items-center text-beige font-bold text-xs" style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)" }}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-bold text-navy truncate">
                  {a.bairro || alvo.bairro || "Amostra"} · {a.areaTotal} m²
                </div>
                <div className="text-[10.5px] text-teal tabular-nums">
                  {fmtReais(a.precoAnuncio)} · {fmtReais(a.precoM2)}/m² base
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <input
                  type="range"
                  min={-20}
                  max={20}
                  step={1}
                  value={a.ajustePct ?? 0}
                  onChange={(e) => onAmostraChange(a.id, { ajustePct: Number(e.target.value) })}
                  className="w-28 lg:w-40 accent-navy"
                />
                <span
                  className={`w-14 text-right tabular-nums text-[12px] font-bold ${
                    (a.ajustePct ?? 0) === 0 ? "text-navy/60" : (a.ajustePct ?? 0) > 0 ? "text-teal" : "text-red-700"
                  }`}
                >
                  {(a.ajustePct ?? 0) > 0 ? "+" : ""}{a.ajustePct ?? 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-start gap-2 p-3 rounded-2xl bg-beige/60 border border-sky/60">
        <Info size={13} className="text-teal flex-shrink-0 mt-0.5" />
        <p className="text-[11.5px] text-navy/75 leading-relaxed">
          Quando terminar, escolha <b>Salvar rascunho</b> pra continuar depois, ou <b>Concluir análise</b> pra travar o valor e voltar pra tela de detalhe (o PDF sai no próximo bloco).
        </p>
      </div>
    </div>
  )
}

// ============================================================
// Sub-componentes
// ============================================================

function ConfidenceChip({ label, valor }: { label: string; valor: number }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider"
      style={{ background: "rgba(245,239,235,0.16)", color: "#F5EFEB" }}
    >
      <ShieldCheck size={11} strokeWidth={2.4} />
      Confiança {label} · <span className="tabular-nums">{valor}%</span>
    </span>
  )
}

function RangePill({ icon: Icon, label, valor }: { icon: typeof ArrowDown; label: string; valor: number }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/12 border border-white/25 text-[11px] font-semibold text-beige">
      <Icon size={11} strokeWidth={2.4} />
      <span className="text-beige/70">{label}</span>
      <span className="tabular-nums font-bold">{fmtReais(valor)}</span>
    </span>
  )
}

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

function Row({ label, values, numeric, bold, hint }: { label: string; values: string[]; numeric?: boolean; bold?: boolean; hint?: string }) {
  return (
    <tr>
      <td className="px-4 lg:px-6 py-2.5 text-[11px] font-semibold text-teal">
        {label}
        {hint && <span className="ml-1 text-navy/40 text-[9px] italic">· {hint}</span>}
      </td>
      {values.map((v, i) => (
        <td
          key={i}
          className={`px-3 py-2.5 ${numeric ? "tabular-nums" : ""} ${bold ? "font-bold" : "font-medium"} ${
            i === 0 ? "bg-navy/[0.04] text-navy" : "text-navy/80"
          }`}
        >
          {v}
        </td>
      ))}
    </tr>
  )
}

function fmtStr(v: number | undefined, suffix = ""): string {
  if (!v || v <= 0) return "—"
  return `${v}${suffix}`
}
