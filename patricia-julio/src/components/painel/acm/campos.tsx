"use client"

/**
 * Inputs reutilizáveis do wizard de ACM.
 * Todos seguem o mesmo padrão visual (bg beige, border sky, focus teal ring).
 */

import { type LucideIcon } from "lucide-react"

interface BaseFieldProps {
  label: string
  hint?: string
  obrigatorio?: boolean
  destaqueFaltante?: boolean   // borda amber quando parser não conseguiu preencher
  className?: string
  icon?: LucideIcon
}

// ============================================================
// Texto simples
// ============================================================
export function CampoTexto({
  label, value, onChange, placeholder, hint, obrigatorio, destaqueFaltante, className, icon: Icon,
}: BaseFieldProps & { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className={"block " + (className || "")}>
      <LabelLine label={label} obrigatorio={obrigatorio} />
      <div className="relative mt-1.5">
        {Icon && <Icon size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal pointer-events-none" />}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass(destaqueFaltante, !!Icon)}
        />
      </div>
      {hint && <Hint text={hint} />}
    </label>
  )
}

// ============================================================
// Número (área, quartos, vagas, banheiros)
// ============================================================
export function CampoNumero({
  label, value, onChange, unidade, min = 0, max, step = 1, hint, obrigatorio, destaqueFaltante, className,
}: BaseFieldProps & { value: number | undefined; onChange: (v: number | undefined) => void; unidade?: string; min?: number; max?: number; step?: number }) {
  return (
    <label className={"block " + (className || "")}>
      <LabelLine label={label} obrigatorio={obrigatorio} />
      <div className="relative mt-1.5">
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => {
            const raw = e.target.value
            if (raw === "") onChange(undefined)
            else {
              const n = Number(raw)
              onChange(isFinite(n) ? n : undefined)
            }
          }}
          min={min}
          max={max}
          step={step}
          className={inputClass(destaqueFaltante) + (unidade ? " pr-14" : "")}
        />
        {unidade && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10.5px] font-bold uppercase tracking-wider text-teal">
            {unidade}
          </span>
        )}
      </div>
      {hint && <Hint text={hint} />}
    </label>
  )
}

// ============================================================
// Moeda (BRL) — mostra R$ na esquerda, formata milhares
// ============================================================
export function CampoValor({
  label, value, onChange, hint, obrigatorio, destaqueFaltante, className,
}: BaseFieldProps & { value: number | undefined; onChange: (v: number | undefined) => void }) {
  return (
    <label className={"block " + (className || "")}>
      <LabelLine label={label} obrigatorio={obrigatorio} />
      <div className="relative mt-1.5">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold tracking-wider text-teal">R$</span>
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => {
            const raw = e.target.value
            if (raw === "") onChange(undefined)
            else {
              const n = Number(raw)
              onChange(isFinite(n) && n >= 0 ? n : undefined)
            }
          }}
          min={0}
          step={1000}
          className={inputClass(destaqueFaltante) + " pl-10 tabular-nums"}
        />
        {value !== undefined && value > 0 && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10.5px] text-teal/70 tabular-nums pointer-events-none">
            {fmtReaisCompact(value)}
          </span>
        )}
      </div>
      {hint && <Hint text={hint} />}
    </label>
  )
}

// ============================================================
// Textarea (observações)
// ============================================================
export function CampoAreaTexto({
  label, value, onChange, placeholder, rows = 3, hint, obrigatorio, className,
}: BaseFieldProps & { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <label className={"block " + (className || "")}>
      <LabelLine label={label} obrigatorio={obrigatorio} />
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl bg-beige border border-sky text-navy text-[13px] outline-none focus:border-teal focus:ring-[3px] focus:ring-teal/15 transition-all resize-y"
      />
      {hint && <Hint text={hint} />}
    </label>
  )
}

// ============================================================
// Select (fonte da amostra, cidade)
// ============================================================
export function CampoSelect<T extends string>({
  label, value, onChange, options, hint, obrigatorio, className,
}: BaseFieldProps & { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <label className={"block " + (className || "")}>
      <LabelLine label={label} obrigatorio={obrigatorio} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={inputClass(false) + " appearance-none pr-9 bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=\"http://www.w3.org/2000/svg\"%20width=\"12\"%20height=\"12\"%20viewBox=\"0%200%2024%2024\"%20fill=\"none\"%20stroke=\"%23567C8D\"%20stroke-width=\"2\"%20stroke-linecap=\"round\"%20stroke-linejoin=\"round\"><polyline%20points=\"6%209%2012%2015%2018%209\"/></svg>')] bg-no-repeat bg-[right_1rem_center] cursor-pointer"}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {hint && <Hint text={hint} />}
    </label>
  )
}

// ============================================================
// Helpers internos
// ============================================================
function LabelLine({ label, obrigatorio }: { label: string; obrigatorio?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-[10.5px] font-bold uppercase tracking-wider text-teal">{label}</span>
      {obrigatorio && <span className="text-red-500 text-[10.5px] font-bold">*</span>}
    </span>
  )
}

function Hint({ text }: { text: string }) {
  return <p className="mt-1 text-[10.5px] text-navy/60 leading-relaxed">{text}</p>
}

function inputClass(destaqueFaltante?: boolean, comIcon?: boolean): string {
  const paddingLeft = comIcon ? "pl-9" : "pl-3.5"
  const border = destaqueFaltante
    ? "border-amber-400 bg-amber-50/60"
    : "border-sky bg-beige"
  return `w-full h-11 ${paddingLeft} pr-3.5 rounded-xl ${border} text-navy text-[13.5px] font-medium outline-none focus:border-teal focus:ring-[3px] focus:ring-teal/15 transition-all`
}

// ============================================================
// Formatters (usados nos previews inline)
// ============================================================
export function fmtReais(v: number | undefined | null): string {
  if (typeof v !== "number" || !isFinite(v) || v <= 0) return "—"
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v)
}

export function fmtReaisCompact(v: number): string {
  if (v >= 1_000_000) return `~${(v / 1_000_000).toFixed(v >= 10_000_000 ? 1 : 2).replace(".", ",")}M`
  if (v >= 1_000) return `~${Math.round(v / 1_000)}k`
  return `${v}`
}

export function fmtM2(v: number | undefined | null): string {
  if (typeof v !== "number" || !isFinite(v) || v <= 0) return "—"
  return `${v} m²`
}
