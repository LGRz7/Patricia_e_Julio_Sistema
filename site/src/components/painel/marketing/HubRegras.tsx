"use client"

/**
 * HubRegras.tsx — as "regras da casa" do marketing de P&J.
 * Fonte única em src/data/painel/marketing-hub.ts. Reutilizado no hub e no Estúdio.
 */

import { ShieldCheck } from "lucide-react"
import { REGRAS_CASA } from "@/data/painel/marketing-hub"

export function HubRegras({ compacto }: { compacto?: boolean }) {
  return (
    <section className="rounded-3xl border border-sky/60 bg-white p-5 lg:p-6">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck size={14} className="text-teal" />
        <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal">
          As regras da casa
        </span>
      </div>

      <p className="text-[12px] text-navy/70 leading-relaxed mb-4 max-w-lg">
        Não importa o caminho — todo post que sai daqui segue essas regras. É o que faz o feed parecer profissional em vez de amador de corretor.
      </p>

      <ul className={`grid gap-2.5 ${compacto ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
        {REGRAS_CASA.map((r) => (
          <li key={r.id} className="rounded-2xl bg-beige/50 border border-sky/40 p-3">
            <div className="text-[12px] font-bold text-navy leading-tight">
              {r.label}
            </div>
            <div className="text-[10.5px] text-navy/70 mt-1 leading-relaxed">
              {r.detalhe}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
