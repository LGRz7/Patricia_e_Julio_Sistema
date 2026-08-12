"use client"

import Link from "next/link"
import { ArrowLeft, Info, Users, ShieldCheck, Ban } from "lucide-react"
import { PERSONAS, REGRAS_CRIATIVO } from "@/data/painel/personas"
import { PersonaCard } from "@/components/painel/marketing/PersonaCard"

/**
 * Público-alvo — read-only. Corretor consulta as 5 personas antes de pedir um criativo.
 * Os dados são sincronizados pelo administrador.
 */
export default function PublicoAlvoPage() {
  return (
    <div className="px-5 lg:px-10 pt-6 lg:pt-10 pb-10 space-y-6 max-w-5xl">
      {/* HEADER */}
      <div>
        <Link href="/painel/marketing" className="inline-flex items-center gap-1.5 text-[12px] text-teal hover:text-navy transition-colors">
          <ArrowLeft size={13} />
          Voltar
        </Link>
        <div className="mt-2">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal">Marketing · Público-alvo</div>
          <h1 className="mt-1 font-display text-[24px] lg:text-[30px] font-bold text-navy tracking-tight leading-tight">
            Quem a gente atrai (e como)
          </h1>
          <p className="mt-2 text-[13px] text-teal leading-relaxed max-w-2xl">
            Cinco personas dentro do público confirmado (renda 7k+, 26+, Niterói · Maricá · Rio).
            Cada criativo fala com UMA persona por vez — nunca duas ao mesmo tempo. Escolhe uma antes de pedir.
          </p>
        </div>
      </div>

      {/* Grid das 5 personas */}
      <section className="grid gap-3 lg:grid-cols-2">
        {PERSONAS.map((p) => (
          <PersonaCard key={p.id} persona={p} />
        ))}
      </section>

      {/* Regras editoriais */}
      <section className="rounded-3xl border border-sky/60 bg-white p-5 lg:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-teal" />
          <h2 className="font-display text-[15px] font-bold text-navy">Regras editoriais globais</h2>
        </div>
        <ul className="space-y-2">
          {REGRAS_CRIATIVO.ligeirosDeReferencia.map((regra, i) => (
            <li key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-beige/40 border border-sky/40">
              <span className="w-6 h-6 rounded-lg grid place-items-center text-beige font-bold text-[11px] flex-shrink-0" style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)" }}>
                {i + 1}
              </span>
              <p className="text-[12.5px] text-navy leading-relaxed">{regra}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Clichês proibidos */}
      <section className="rounded-3xl border border-sky/60 bg-white p-5 lg:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Ban size={14} className="text-red-700" />
          <h2 className="font-display text-[15px] font-bold text-navy">Nunca use nos criativos</h2>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {REGRAS_CRIATIVO.clichesProibidos.map((c) => (
            <span key={c} className="text-[11.5px] px-2.5 py-1 rounded-full font-semibold" style={{ background: "rgba(178,58,46,0.08)", color: "#B23A2E", border: "1px solid rgba(178,58,46,0.25)" }}>
              &quot;{c}&quot;
            </span>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-navy/60 leading-relaxed">
          Copy genérica queima confiança. Prefira benefício concreto ancorado em número, bairro e imóvel real.
        </p>
      </section>

      {/* Nota fonte */}
      <div className="flex items-start gap-2 p-3 rounded-2xl bg-beige/60 border border-sky/60">
        <Info size={13} className="text-teal flex-shrink-0 mt-0.5" />
        <p className="text-[11.5px] text-navy/75 leading-relaxed">
          Este painel exibe as personas configuradas. Atualizações são feitas pelo administrador.
        </p>
      </div>
    </div>
  )
}
