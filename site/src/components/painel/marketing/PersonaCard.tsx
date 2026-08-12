"use client"

import { AlertCircle, Sparkles, Target, MapPin, Users } from "lucide-react"
import type { Persona } from "@/data/painel/personas"

const PALETA_ID_TO_COLOR: Record<string, string> = {
  "primeira-compra-consciente": "#2F4156",
  "upgrade-familiar":           "#567C8D",
  "investidor-marica":          "#0F7A54",
  "segunda-casa-praia":         "#D98A00",
  "migrante-rio-niteroi":       "#7B4E9A",
}

/**
 * Card visual de persona — mostra idade, renda, produto, dor, gancho e argumento.
 * Usado em /painel/marketing/publico-alvo (grid) e no wizard de gerar (seleção).
 */
export function PersonaCard({
  persona,
  selecionavel,
  selecionada,
  onClick,
  compacto,
}: {
  persona: Persona
  selecionavel?: boolean
  selecionada?: boolean
  onClick?: () => void
  compacto?: boolean
}) {
  const cor = PALETA_ID_TO_COLOR[persona.id] || "#2F4156"

  const conteudo = (
    <>
      <div className="flex items-start gap-3">
        <span
          className="w-10 h-10 rounded-xl grid place-items-center text-beige flex-shrink-0"
          style={{ background: cor }}
        >
          <Users size={16} strokeWidth={2} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-teal">
            {persona.age[0]}–{persona.age[1]} anos · {fmtRendaFaixa(persona.incomeBrl)}
          </div>
          <div className="font-display font-bold text-navy text-[15px] leading-tight mt-0.5">
            {persona.name}
          </div>
        </div>
      </div>

      {!compacto && (
        <>
          <div className="mt-3 flex items-start gap-2">
            <Target size={11} className="text-teal flex-shrink-0 mt-0.5" />
            <p className="text-[11.5px] text-navy leading-relaxed">
              <span className="font-semibold">Produto:</span> {persona.product}
            </p>
          </div>

          <div className="mt-2 flex items-start gap-2">
            <MapPin size={11} className="text-teal flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-navy/80 leading-relaxed">{persona.regions.join(" · ")}</p>
          </div>

          <div className="mt-3 space-y-2">
            <BlocoLista icon={AlertCircle} label="Dores" items={persona.pain} cor="#B23A2E" />
            <BlocoLista icon={Sparkles} label="O que para o scroll" items={persona.hook} cor={cor} />
          </div>

          <div className="mt-3 pt-3 border-t border-sky/50 space-y-1.5">
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal min-w-[70px]">Objeção</span>
              <span className="text-[11px] text-navy/80 leading-relaxed flex-1">{persona.objection}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal min-w-[70px]">Fecha com</span>
              <span className="text-[11px] text-navy/80 leading-relaxed flex-1">{persona.closer}</span>
            </div>
          </div>
        </>
      )}
    </>
  )

  const baseCls = "rounded-3xl p-4 lg:p-5 transition-all bg-white"

  if (selecionavel) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseCls} text-left border-2 ${selecionada ? "border-teal shadow-[0_10px_24px_-8px_rgba(47,65,86,0.28)]" : "border-sky/60 hover:border-sky"}`}
        aria-pressed={selecionada}
      >
        {conteudo}
      </button>
    )
  }

  return <div className={`${baseCls} border border-sky/60`}>{conteudo}</div>
}

// ============================================================
// Helpers
// ============================================================
function BlocoLista({ icon: Icon, label, items, cor }: { icon: typeof Target; label: string; items: string[]; cor: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={10} style={{ color: cor }} />
        <span className="text-[9.5px] font-bold uppercase tracking-wider text-teal">{label}</span>
      </div>
      <ul className="flex flex-wrap gap-1">
        {items.map((it, i) => (
          <li
            key={i}
            className="text-[10.5px] px-2 py-0.5 rounded-md font-medium"
            style={{ background: "rgba(86,124,141,0.08)", color: "#2F4156" }}
          >
            {it}
          </li>
        ))}
      </ul>
    </div>
  )
}

function fmtRendaFaixa(faixa: [number, number]): string {
  const [min, max] = faixa
  if (max >= 999999) return `${fmtK(min)}+`
  return `${fmtK(min)}–${fmtK(max)}`
}
function fmtK(v: number): string {
  return "R$ " + (v / 1000).toFixed(0) + "k"
}

// re-exports Wallet in case parent uses it — no-op
export type { }
