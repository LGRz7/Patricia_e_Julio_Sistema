"use client"

/**
 * /painel/marketing — Área simplificada de Marketing
 * 
 * Foco: criação rápida de posts via Estúdio + histórico
 */

import Link from "next/link"
import { useState } from "react"
import {
  Megaphone, ArrowRight, History, Clock, CheckCircle2, Wand2, Loader2, Trophy,
} from "lucide-react"

export default function MarketingHome() {
  const [mostrarOpcoes, setMostrarOpcoes] = useState(false)

  return (
    <div className="px-5 lg:px-10 pt-6 lg:pt-10 pb-10 space-y-6 max-w-6xl" suppressHydrationWarning>
      {/* ============================================================ */}
      {/* KPIs - NO TOPO (DADOS FIXOS POR ENQUANTO)                    */}
      {/* ============================================================ */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3" suppressHydrationWarning>
        <KpiCard 
          label="Pendentes"
          valor="0"
          sub="aguardando produção"
          icon={Clock}
          cor="#2F4156"
        />
        <KpiCard 
          label="Gerando"
          valor="0"
          sub="processando"
          icon={Loader2}
          cor="#567C8D"
        />
        <KpiCard 
          label="Prontos"
          valor="0"
          sub="pra baixar e postar"
          icon={CheckCircle2}
          cor="#2F4156"
        />
        <KpiCard 
          label="Publicados"
          valor="0"
          sub="no IG/FB"
          icon={Trophy}
          cor="#567C8D"
        />
      </section>

      {/* ============================================================ */}
      {/* HERO ULTRA SIMPLES - SÓ O BOTÃO (MOVIDO PARA CIMA)          */}
      {/* ============================================================ */}
      <section
        className="relative overflow-hidden rounded-3xl px-8 py-12 lg:px-12 lg:py-16 text-center"
        style={{ background: "linear-gradient(135deg, #2F4156 0%, #567C8D 100%)" }}
      >
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-beige/70 mb-4">
            <Megaphone size={12} strokeWidth={2.2} />
            Marketing
          </div>
          <h1 className="font-display text-[32px] lg:text-[42px] font-bold leading-[1.05] tracking-tight text-beige mb-4">
            Criar posts para Instagram
          </h1>
          <p className="text-[14px] lg:text-[15px] text-beige/85 leading-relaxed mb-8 max-w-xl mx-auto">
            Templates prontos com as cores, tipografia e CRECIs já configurados. Clique abaixo para começar.
          </p>

          <button
            onClick={() => setMostrarOpcoes(true)}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-beige text-navy text-[15px] lg:text-[16px] font-bold hover:bg-white transition-all shadow-2xl hover:scale-105 active:scale-100"
          >
            <Wand2 size={18} strokeWidth={2.5} />
            Criar Post
          </button>
        </div>
        <div
          className="pointer-events-none absolute -right-8 -bottom-10 w-[280px] h-[280px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, rgba(200,217,230,0.5), transparent 70%)" }}
        />
      </section>

      {/* ============================================================ */}
      {/* MODAL DE OPÇÕES - Aparece depois de clicar                    */}
      {/* ============================================================ */}
      {mostrarOpcoes && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setMostrarOpcoes(false)}>
          <div className="bg-white rounded-3xl p-6 lg:p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-[22px] lg:text-[26px] font-bold text-navy">Estúdio de Criativos</h2>
                <p className="text-[13px] text-teal mt-1">Templates prontos para criar posts rapidamente</p>
              </div>
              <button
                onClick={() => setMostrarOpcoes(false)}
                className="w-10 h-10 rounded-full bg-beige/40 hover:bg-beige flex items-center justify-center transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 4L4 12M4 4l8 8" />
                </svg>
              </button>
            </div>

            <Link
              href="/painel/marketing/estudio"
              className="group relative overflow-hidden rounded-2xl border-2 border-teal bg-gradient-to-br from-sky/5 to-transparent p-8 hover:border-teal hover:shadow-xl transition-all block"
            >
              <div className="w-14 h-14 rounded-xl bg-teal flex items-center justify-center mb-5">
                <Wand2 size={26} className="text-beige" strokeWidth={2.5} />
              </div>

              <h3 className="font-display text-[20px] font-bold text-navy mb-3">
                Estúdio de Criativos
              </h3>
              <p className="text-[13px] text-navy/70 leading-relaxed mb-5">
                Templates prontos com paleta, tipografia e CRECI pré-configurados. Preenche → preview → PNG na hora.
              </p>

              <div className="space-y-2.5 mb-5">
                <div className="flex items-start gap-2 text-[12px] text-navy/80">
                  <Clock size={14} className="text-teal flex-shrink-0 mt-0.5" />
                  <span><b>3-5 minutos</b> por criativo</span>
                </div>
                <div className="flex items-start gap-2 text-[12px] text-navy/80">
                  <CheckCircle2 size={14} className="text-teal flex-shrink-0 mt-0.5" />
                  <span>Ideal quando você já tem a foto e a copy pronta</span>
                </div>
              </div>

              <div className="pt-4 border-t border-sky/40 flex items-center justify-between">
                <span className="text-[12px] font-semibold text-teal">Abrir Estúdio</span>
                <ArrowRight size={16} className="text-teal group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <div className="mt-6 pt-6 border-t border-sky/40 text-center">
              <p className="text-[11px] text-teal/60">
                Crie posts profissionais em minutos com templates personalizados
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Componente KPI Card
// ============================================================
function KpiCard({
  label,
  valor,
  sub,
  icon: Icon,
  cor,
}: {
  label: string
  valor: string
  sub: string
  icon: typeof Clock
  cor: string
}) {
  return (
    <div className="rounded-2xl bg-white border border-sky/60 p-4 relative overflow-hidden">
      <div className="flex items-center justify-between mb-3 gap-2">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-teal whitespace-nowrap truncate">
          {label}
        </span>
        <span
          className="w-7 h-7 rounded-lg grid place-items-center flex-shrink-0"
          style={{ background: cor, color: "#F5EFEB" }}
        >
          <Icon size={13} strokeWidth={2} />
        </span>
      </div>
      <div className="font-display text-[20px] lg:text-[26px] font-bold text-navy leading-none tabular-nums">
        {valor}
      </div>
      <div className="text-[10.5px] text-teal mt-1.5 truncate">{sub}</div>
    </div>
  )
}
