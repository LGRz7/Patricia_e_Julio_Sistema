"use client"

/**
 * TemplateGaleria.tsx — grid de cards, cada card é um template pronto.
 * Ao clicar num card, o corretor entra no editor daquele template.
 */

import { LayoutGrid, Video, Image as ImageIcon, MessageCircle, ArrowRight, Sparkles } from "lucide-react"
import { TEMPLATES_MARKETING, type TemplateMarketing } from "@/data/painel/templates-marketing"
import { getPersona } from "@/data/painel/personas"
import type { TipoCriativo } from "@/types/marketing"

const ICON_POR_TIPO: Record<TipoCriativo, typeof LayoutGrid> = {
  carrossel: LayoutGrid,
  reels: Video,
  story: ImageIcon,
  post: MessageCircle,
}

interface Props {
  onSelecionar: (templateId: string) => void
}

export function TemplateGaleria({ onSelecionar }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={13} className="text-teal" />
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-teal">
            Templates prontos
          </span>
        </div>
        <p className="text-[12px] text-navy/70 leading-relaxed max-w-lg">
          Escolhe um template, preenche os dados, baixa em PNG. Já vem no padrão da Patrícia e do Júlio — sem clichê, sem fachada solta.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES_MARKETING.map((t) => (
          <TemplateCard key={t.id} template={t} onClick={() => onSelecionar(t.id)} />
        ))}
      </div>
    </div>
  )
}

// ============================================================
// TemplateCard
// ============================================================
function TemplateCard({
  template,
  onClick,
}: {
  template: TemplateMarketing
  onClick: () => void
}) {
  const IconTipo = ICON_POR_TIPO[template.tipo] || LayoutGrid
  const persona = template.personaSugerida ? getPersona(template.personaSugerida) : null
  const aspecto = template.aspecto === "4:5" ? "aspect-[4/5]" : template.aspecto === "1:1" ? "aspect-square" : "aspect-[9/16]"

  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left rounded-3xl border border-sky/60 bg-white overflow-hidden hover:border-teal hover:shadow-[0_16px_32px_-16px_rgba(47,65,86,0.28)] transition-all"
    >
      {/* Thumbnail simulada — usa a paleta do template */}
      <div
        className={`relative w-full ${aspecto} overflow-hidden`}
        style={{
          background: `linear-gradient(160deg, ${template.corAcento} 0%, #567C8D 100%)`,
        }}
      >
        <div
          className="absolute inset-0 flex flex-col justify-end p-4"
          style={{
            background: `linear-gradient(180deg, rgba(200,217,230,0.6) 0%, rgba(200,217,230,0.5) 55%, ${template.corAcento} 55%)`,
          }}
        >
          {/* Camada foto simulada — 55% top */}
          <div className="absolute top-0 left-0 right-0 h-[55%] flex items-center justify-center">
            <div
              className="w-14 h-14 rounded-2xl grid place-items-center bg-white/70 text-teal"
              style={{ boxShadow: "0 6px 16px -6px rgba(47,65,86,0.35)" }}
            >
              <ImageIcon size={22} strokeWidth={1.6} />
            </div>
          </div>

          {/* Faixa embaixo com nome + preço fake */}
          <div className="relative text-beige">
            <div className="text-[9px] font-bold uppercase tracking-[0.16em] opacity-80">
              Bairro · {template.tipo}
            </div>
            <div className="font-display text-[16px] font-bold leading-tight mt-1 truncate">
              {template.nome}
            </div>
            <div className="text-[11px] font-bold mt-1 opacity-90">R$ 000.000</div>
          </div>
        </div>

        {/* Tag aspecto */}
        <div
          className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider"
          style={{ background: "rgba(37,51,71,0.7)", color: "#F5EFEB", backdropFilter: "blur(4px)" }}
        >
          {template.aspecto}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start gap-2 mb-2">
          <span
            className="w-8 h-8 rounded-lg grid place-items-center text-beige flex-shrink-0"
            style={{ background: template.corAcento }}
          >
            <IconTipo size={14} strokeWidth={2} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[13.5px] font-bold text-navy leading-tight">
              {template.nome}
            </div>
            {persona && (
              <div className="text-[10px] font-medium text-teal mt-0.5 truncate">
                Ideal pra: {persona.name}
              </div>
            )}
          </div>
        </div>

        <p className="text-[11.5px] text-navy/70 leading-relaxed line-clamp-2">
          {template.descricao}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10.5px] font-medium text-teal">
            {template.dimensoes.w}×{template.dimensoes.h}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-navy group-hover:text-teal transition-colors">
            Usar <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </button>
  )
}
