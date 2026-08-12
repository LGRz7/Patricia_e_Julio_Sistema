"use client"

import { MapPin, Home, Info } from "lucide-react"
import type { ImovelAlvoACM } from "@/types/acm"
import { CampoTexto, CampoNumero, CampoValor, CampoAreaTexto, CampoSelect } from "./campos"

interface Props {
  alvo: ImovelAlvoACM
  onChange: (patch: Partial<ImovelAlvoACM>) => void
}

const CIDADES = [
  { value: "Niterói", label: "Niterói" },
  { value: "Maricá", label: "Maricá" },
  { value: "Rio de Janeiro", label: "Rio de Janeiro" },
  { value: "São Gonçalo", label: "São Gonçalo" },
] as const

export function Step1Alvo({ alvo, onChange }: Props) {
  return (
    <div className="space-y-6">
      {/* Bloco Identificação */}
      <section className="rounded-3xl border border-sky/60 bg-white p-5 lg:p-6 space-y-5">
        <SectionHeader
          icon={Home}
          eyebrow="Passo 1 de 3"
          title="Sobre o imóvel que você vai vender"
          subtitle="Só o essencial pra o cálculo. Detalhes ficam nas observações."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <CampoTexto
            label="Apelido interno"
            obrigatorio
            value={alvo.apelido}
            onChange={(v) => onChange({ apelido: v })}
            placeholder="Ex.: Apto Icaraí Presidente Pedreira"
            hint="Nome curto pra você identificar essa análise depois."
          />

          <CampoSelect
            label="Cidade"
            obrigatorio
            value={alvo.cidade}
            onChange={(v) => onChange({ cidade: v })}
            options={CIDADES.map((c) => ({ value: c.value, label: c.label }))}
          />

          <CampoTexto
            label="Bairro"
            obrigatorio
            value={alvo.bairro}
            onChange={(v) => onChange({ bairro: v })}
            placeholder="Ex.: Icaraí"
            icon={MapPin}
          />

          <CampoTexto
            label="Endereço"
            value={alvo.endereco}
            onChange={(v) => onChange({ endereco: v })}
            placeholder="Rua e número"
          />
        </div>
      </section>

      {/* Bloco Métricas */}
      <section className="rounded-3xl border border-sky/60 bg-white p-5 lg:p-6 space-y-5">
        <SectionHeader
          eyebrow="Características"
          title="Números que entram no cálculo"
          subtitle="Área e quartos são obrigatórios — pesam mais na precificação."
        />

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <CampoNumero
            label="Área total"
            obrigatorio
            value={alvo.areaTotal || undefined}
            onChange={(v) => onChange({ areaTotal: v || 0 })}
            unidade="m²"
            min={1}
            step={0.5}
          />
          <CampoNumero
            label="Quartos"
            obrigatorio
            value={alvo.quartos || undefined}
            onChange={(v) => onChange({ quartos: v || 0 })}
            min={0}
            step={1}
          />
          <CampoNumero
            label="Suítes"
            value={alvo.suites}
            onChange={(v) => onChange({ suites: v })}
            min={0}
            step={1}
          />
          <CampoNumero
            label="Banheiros"
            obrigatorio
            value={alvo.banheiros || undefined}
            onChange={(v) => onChange({ banheiros: v || 0 })}
            min={0}
            step={1}
          />
          <CampoNumero
            label="Vagas"
            obrigatorio
            value={alvo.vagas ?? undefined}
            onChange={(v) => onChange({ vagas: v ?? 0 })}
            min={0}
            step={1}
          />
          <CampoValor
            label="Condomínio"
            value={alvo.condominio}
            onChange={(v) => onChange({ condominio: v })}
            hint="Valor mensal, opcional."
          />
          <CampoValor
            label="IPTU"
            value={alvo.iptu}
            onChange={(v) => onChange({ iptu: v })}
            hint="Anual, opcional."
          />
        </div>

        <CampoAreaTexto
          label="Observações"
          value={alvo.observacoes || ""}
          onChange={(v) => onChange({ observacoes: v })}
          placeholder="Ex.: prédio 2018, elevador, portaria 24h, vista pra Baía. Escreva o que vai valorizar no PDF."
          rows={3}
        />
      </section>

      <div className="flex items-start gap-2 p-3 rounded-2xl bg-beige/60 border border-sky/60">
        <Info size={13} className="text-teal flex-shrink-0 mt-0.5" />
        <p className="text-[11.5px] text-navy/75 leading-relaxed">
          No próximo passo você adiciona 4 amostras semelhantes. Vale colar o texto do ZAP / VivaReal — o painel extrai preço, área, quartos e banheiros automaticamente.
        </p>
      </div>
    </div>
  )
}

function SectionHeader({ icon: Icon, eyebrow, title, subtitle }: { icon?: typeof Home; eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3">
      {Icon && (
        <span className="w-9 h-9 rounded-xl grid place-items-center text-beige flex-shrink-0" style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)" }}>
          <Icon size={15} strokeWidth={2} />
        </span>
      )}
      <div>
        <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal">{eyebrow}</div>
        <h2 className="mt-1 font-display text-[16px] lg:text-[18px] font-bold text-navy leading-tight">{title}</h2>
        {subtitle && <p className="text-[11.5px] text-teal mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
