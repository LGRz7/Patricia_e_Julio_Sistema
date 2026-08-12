"use client"

/**
 * HubPipeline.tsx — as 5 fases do processo de criação de post do MazyOS.
 * Cada fase é um card na timeline vertical (mobile) ou horizontal (desktop).
 *
 * Fonte de verdade: src/data/painel/marketing-hub.ts (que espelha as skills do MazyOS).
 */

import { useState } from "react"
import {
  Target, Type, Image as ImageIcon, MessageSquare, Send,
  ChevronDown, Sparkles, Wand2, Home,
} from "lucide-react"
import { FASES_MARKETING, type FaseMarketing, type OndeAcontece } from "@/data/painel/marketing-hub"

const ICONES = {
  target: Target,
  type: Type,
  image: ImageIcon,
  "message-square": MessageSquare,
  send: Send,
} as const

export function HubPipeline() {
  const [aberta, setAberta] = useState<number | null>(1)

  return (
    <section className="rounded-3xl border border-sky/60 bg-white p-5 lg:p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={13} className="text-teal" />
            <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal">
              Como um post nasce aqui
            </span>
          </div>
          <h2 className="font-display text-[19px] lg:text-[22px] font-bold text-navy leading-tight">
            O caminho do briefing até o feed
          </h2>
          <p className="text-[12.5px] text-teal mt-1 max-w-lg leading-relaxed">
            5 fases que todo post passa. Você controla tudo pelo Estúdio — escolhe fazer manual ou automatizado. Clica em cada fase pra ver os dois caminhos.
          </p>
        </div>
      </div>

      {/* Linha do tempo — vertical em mobile, horizontal em desktop */}
      <ol className="grid gap-2.5 lg:grid-cols-5 lg:gap-3">
        {FASES_MARKETING.map((fase) => (
          <FaseCard
            key={fase.numero}
            fase={fase}
            aberta={aberta === fase.numero}
            onToggle={() => setAberta(aberta === fase.numero ? null : fase.numero)}
          />
        ))}
      </ol>
    </section>
  )
}

// ============================================================
// FaseCard
// ============================================================
function FaseCard({
  fase,
  aberta,
  onToggle,
}: {
  fase: FaseMarketing
  aberta: boolean
  onToggle: () => void
}) {
  const Icon = ICONES[fase.iconeNome]
  const badge = badgeOnde(fase.onde)

  return (
    <li className="rounded-2xl border border-sky/50 bg-beige/40 overflow-hidden transition-all">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-3.5 hover:bg-white transition-colors"
        aria-expanded={aberta}
      >
        <div className="flex items-start gap-3 lg:flex-col lg:gap-2.5">
          <div className="flex items-center gap-2 flex-shrink-0 lg:w-full lg:justify-between">
            <span
              className="w-9 h-9 rounded-xl grid place-items-center text-beige flex-shrink-0 relative"
              style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)" }}
            >
              <Icon size={15} strokeWidth={2} />
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-beige text-navy text-[9.5px] font-bold grid place-items-center border border-sky"
                aria-hidden
              >
                {fase.numero}
              </span>
            </span>
            <ChevronDown
              size={14}
              className={`text-teal transition-transform ${aberta ? "rotate-180" : ""}`}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-teal">
              Fase {fase.numero}
            </div>
            <div className="text-[13.5px] font-bold text-navy leading-tight mt-0.5">
              {fase.titulo}
            </div>
            <div className="text-[10.5px] text-navy/60 mt-0.5 leading-tight">
              {fase.subtitulo}
            </div>
            <div className="mt-2">
              <BadgeOnde badge={badge} />
            </div>
          </div>
        </div>
      </button>

      {aberta && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-sky/40 bg-white space-y-3">
          <p className="text-[12px] text-navy/85 leading-relaxed">{fase.descricao}</p>

          <ComoFaz
            titulo="No Estúdio"
            icon={Wand2}
            texto={fase.noEstudio}
            corFundo="rgba(15,122,84,0.06)"
            corBorda="rgba(15,122,84,0.28)"
            corTexto="#0F7A54"
          />
          <ComoFaz
            titulo="Pedindo automático"
            icon={Sparkles}
            texto={fase.peloYann}
            corFundo="rgba(86,124,141,0.08)"
            corBorda="rgba(86,124,141,0.32)"
            corTexto="#567C8D"
          />
        </div>
      )}
    </li>
  )
}

// ============================================================
// Badge "onde acontece"
// ============================================================
function badgeOnde(onde: OndeAcontece): { label: string; cor: string; icone: typeof Home } {
  const map: Record<OndeAcontece, { label: string; cor: string; icone: typeof Home }> = {
    aqui: { label: "No painel", cor: "#0F7A54", icone: Home },
    mazyos: { label: "Automático", cor: "#567C8D", icone: Sparkles },
    corretor: { label: "Você posta", cor: "#D98A00", icone: Send },
  }
  return map[onde]
}

function BadgeOnde({ badge }: { badge: { label: string; cor: string; icone: typeof Home } }) {
  const Icon = badge.icone
  return (
    <span
      className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{
        background: `${badge.cor}15`,
        color: badge.cor,
        border: `1px solid ${badge.cor}30`,
      }}
    >
      <Icon size={9} strokeWidth={2.4} />
      {badge.label}
    </span>
  )
}

function ComoFaz({
  titulo, icon: Icon, texto, corFundo, corBorda, corTexto,
}: {
  titulo: string
  icon: typeof Wand2
  texto: string
  corFundo: string
  corBorda: string
  corTexto: string
}) {
  return (
    <div
      className="rounded-xl p-2.5 border"
      style={{ background: corFundo, borderColor: corBorda }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={11} style={{ color: corTexto }} />
        <span
          className="text-[9.5px] font-bold uppercase tracking-wider"
          style={{ color: corTexto }}
        >
          {titulo}
        </span>
      </div>
      <p className="text-[11.5px] leading-relaxed text-navy/85">{texto}</p>
    </div>
  )
}
