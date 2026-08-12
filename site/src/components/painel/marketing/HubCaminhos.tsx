"use client"

/**
 * HubCaminhos.tsx — os 2 caminhos disponíveis (Estúdio vs Yann).
 * Cada caminho é um card grande com título, descrição, tempo, quando usar,
 * quando evitar e CTA. Estúdio é destacado como recomendado.
 */

import Link from "next/link"
import { Wand2, Sparkles, ArrowRight, Clock, CheckCircle2, AlertCircle, Zap } from "lucide-react"
import { CAMINHOS_MARKETING, FASES_MARKETING, type CaminhoMarketing } from "@/data/painel/marketing-hub"

export function HubCaminhos() {
  return (
    <section>
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={13} className="text-teal" />
          <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal">
            Dois caminhos, um resultado
          </span>
        </div>
        <h2 className="font-display text-[19px] lg:text-[22px] font-bold text-navy leading-tight">
          Como você quer criar hoje?
        </h2>
        <p className="text-[12.5px] text-teal mt-1 max-w-lg leading-relaxed">
          Você escolhe conforme o dia. Post rápido no Estúdio, ou peça criação automática. Os dois usam as mesmas regras da casa.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {CAMINHOS_MARKETING.map((c) => (
          <CaminhoCard key={c.id} caminho={c} />
        ))}
      </div>
    </section>
  )
}

// ============================================================
// CaminhoCard
// ============================================================
function CaminhoCard({ caminho }: { caminho: CaminhoMarketing }) {
  const Icon = caminho.id === "estudio" ? Wand2 : Sparkles
  const totalFases = FASES_MARKETING.length

  return (
    <Link
      href={caminho.href}
      className="group relative rounded-3xl border bg-white overflow-hidden hover:shadow-[0_20px_44px_-16px_rgba(47,65,86,0.28)] transition-all"
      style={{
        borderColor: caminho.recomendado ? "rgba(86,124,141,0.5)" : "rgba(200,217,230,0.6)",
        borderWidth: caminho.recomendado ? 2 : 1,
        background: caminho.recomendado ? "linear-gradient(135deg, #FFFFFF 0%, #F5EFEB 100%)" : undefined,
      }}
    >
      <div className="p-5 lg:p-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <span
            className="w-11 h-11 rounded-2xl grid place-items-center text-beige flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #2F4156, #567C8D)",
              boxShadow: "0 10px 22px -8px rgba(47,65,86,0.4)",
            }}
          >
            <Icon size={18} strokeWidth={2} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal">
                {caminho.subtitulo}
              </div>
              {caminho.recomendado && (
                <span
                  className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(15,122,84,0.14)", color: "#0F7A54" }}
                >
                  Recomendado
                </span>
              )}
            </div>
            <h3 className="font-display text-[17px] lg:text-[19px] font-bold text-navy leading-tight mt-0.5">
              {caminho.titulo}
            </h3>
          </div>
        </div>

        <p className="text-[12.5px] text-navy/80 mt-3 leading-relaxed">
          {caminho.descricao}
        </p>

        {/* Tempo + fases cobertas */}
        <div className="mt-4 flex items-center gap-3 flex-wrap text-[11px] text-teal">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <Clock size={11} />
            {caminho.tempoEstimado}
          </span>
          <span className="text-sky">·</span>
          <span className="font-medium">
            Cobre {caminho.fasesExecuta.length} de {totalFases} fases
          </span>
        </div>

        {/* Indicador visual das fases */}
        <div className="mt-2 flex items-center gap-1">
          {FASES_MARKETING.map((f) => {
            const executa = caminho.fasesExecuta.includes(f.numero)
            return (
              <div
                key={f.numero}
                className="flex-1 h-1.5 rounded-full transition-all"
                style={{
                  background: executa ? "#567C8D" : "rgba(200,217,230,0.5)",
                }}
                title={`Fase ${f.numero} · ${f.titulo}`}
              />
            )
          })}
        </div>

        {/* Quando usar */}
        <div className="mt-4 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-teal">
            Ideal quando é...
          </div>
          <ul className="space-y-1.5">
            {caminho.quandoUsar.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-[11.5px] text-navy/85 leading-relaxed">
                <CheckCircle2 size={11} className="text-teal flex-shrink-0 mt-0.5" />
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Quando evitar */}
        <div
          className="mt-3 pt-3 flex items-start gap-2 border-t border-sky/40 text-[11px] leading-relaxed"
          style={{ color: "#8a5c00" }}
        >
          <AlertCircle size={11} className="flex-shrink-0 mt-0.5" />
          <span>{caminho.quandoEvitar}</span>
        </div>

        {/* CTA */}
        <div className="mt-5 flex items-center justify-between">
          <span
            className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-navy group-hover:text-teal transition-colors"
          >
            {caminho.cta}
            <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  )
}
