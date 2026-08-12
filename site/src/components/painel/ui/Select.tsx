"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, ChevronDown, Search } from "lucide-react"

export interface SelectOption {
  value: string
  label: string
  /** Segunda linha opcional (ex.: valor / endereço) */
  subtitle?: string
  /** Grupo — options com mesma key aparecem juntas com header */
  group?: string
  /** Ícone à esquerda */
  icon?: React.ReactNode
  disabled?: boolean
}

interface Props {
  value: string
  onChange: (v: string) => void
  options: SelectOption[]
  placeholder?: string
  /** Ativa busca interna quando > N options */
  searchableAfter?: number
  /** Força busca sempre */
  searchable?: boolean
  disabled?: boolean
  emptyText?: string
  className?: string
}

/**
 * Select custom — brand Patrícia & Júlio (Navy/Teal/Beige).
 * - Sempre bonito, sem UI nativa do browser
 * - Portal-ready via z-index alto (mas anchored no wrapper)
 * - Keyboard: ArrowUp/Down, Enter, Escape, Home/End
 * - Busca interna opcional
 * - Groups (opcional)
 */
export function Select({
  value, onChange, options, placeholder = "Selecione…",
  searchable, searchableAfter = 8, disabled, emptyText = "Nada por aqui.", className,
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [highlight, setHighlight] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isSearchable = searchable ?? options.length > searchableAfter

  const filtered = useMemo(() => {
    if (!query.trim()) return options
    const q = query.toLowerCase()
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.subtitle?.toLowerCase().includes(q) ||
        o.group?.toLowerCase().includes(q)
    )
  }, [options, query])

  const grouped = useMemo(() => {
    const map = new Map<string, SelectOption[]>()
    for (const o of filtered) {
      const g = o.group || ""
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(o)
    }
    return Array.from(map.entries())
  }, [filtered])

  const flat = useMemo(() => grouped.flatMap(([, arr]) => arr), [grouped])
  const selected = options.find((o) => o.value === value) || null

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) close()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close()
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  // Foca no input quando abre com busca
  useEffect(() => {
    if (open && isSearchable) setTimeout(() => inputRef.current?.focus(), 40)
    if (open) {
      const idx = Math.max(0, flat.findIndex((o) => o.value === value))
      setHighlight(idx)
    }
  }, [open, isSearchable, flat, value])

  // Rola pro item destacado
  useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${highlight}"]`)
    el?.scrollIntoView({ block: "nearest" })
  }, [highlight, open])

  function close() { setOpen(false); setQuery("") }
  function pick(v: string) { onChange(v); close() }

  function onKey(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") { e.preventDefault(); setOpen(true) }
      return
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(h + 1, flat.length - 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)) }
    else if (e.key === "Home") { e.preventDefault(); setHighlight(0) }
    else if (e.key === "End") { e.preventDefault(); setHighlight(flat.length - 1) }
    else if (e.key === "Enter") { e.preventDefault(); const o = flat[highlight]; if (o && !o.disabled) pick(o.value) }
  }

  return (
    <div ref={wrapRef} className={`relative ${className || ""}`}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full h-11 pl-3 pr-9 rounded-xl bg-beige border border-sky text-navy text-[13px] font-medium text-left flex items-center gap-2 outline-none transition-colors hover:border-teal focus-visible:border-teal disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          borderColor: open ? "#567C8D" : undefined,
          boxShadow: open ? "0 0 0 3px rgba(86,124,141,0.15)" : undefined,
        }}
      >
        {selected?.icon && <span className="flex-shrink-0 text-teal">{selected.icon}</span>}
        <span className={`flex-1 min-w-0 truncate ${selected ? "text-navy" : "text-navy/50"}`}>
          {selected ? selected.label : placeholder}
        </span>
        {selected?.subtitle && (
          <span className="hidden sm:inline text-[11px] text-teal font-semibold flex-shrink-0 tabular-nums">
            {selected.subtitle}
          </span>
        )}
        <ChevronDown
          size={14}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-teal transition-transform pointer-events-none"
          style={{ transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)` }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-2 z-40 rounded-2xl bg-white border border-sky overflow-hidden"
          style={{ boxShadow: "0 20px 44px -12px rgba(47,65,86,0.20), 0 4px 12px rgba(47,65,86,0.06)" }}
        >
          {isSearchable && (
            <div className="p-2 border-b border-sky/60 bg-beige/40">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-teal" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKey}
                  placeholder="Buscar…"
                  className="w-full h-9 pl-8 pr-3 rounded-lg bg-white border border-sky text-navy text-[12.5px] outline-none focus:border-teal"
                />
              </div>
            </div>
          )}

          <div ref={listRef} className="max-h-[280px] overflow-y-auto py-1" role="listbox">
            {flat.length === 0 && (
              <div className="px-4 py-6 text-center text-[12px] text-teal">{emptyText}</div>
            )}

            {grouped.map(([groupName, opts]) => (
              <div key={groupName || "_default"}>
                {groupName && (
                  <div className="px-3 pt-2 pb-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-teal/70">
                    {groupName}
                  </div>
                )}
                {opts.map((o) => {
                  const flatIdx = flat.indexOf(o)
                  const isSelected = o.value === value
                  const isHighlight = flatIdx === highlight
                  return (
                    <button
                      key={o.value}
                      role="option"
                      aria-selected={isSelected}
                      data-idx={flatIdx}
                      type="button"
                      disabled={o.disabled}
                      onClick={() => !o.disabled && pick(o.value)}
                      onMouseEnter={() => setHighlight(flatIdx)}
                      className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: isHighlight ? "rgba(86,124,141,0.12)" : "transparent",
                      }}
                    >
                      {o.icon && <span className="text-teal flex-shrink-0">{o.icon}</span>}
                      <span className="flex-1 min-w-0">
                        <span className={`block text-[13px] leading-tight ${isSelected ? "font-bold text-navy" : "font-medium text-navy"}`}>{o.label}</span>
                        {o.subtitle && (
                          <span className="block text-[10.5px] text-teal mt-0.5 truncate">{o.subtitle}</span>
                        )}
                      </span>
                      {isSelected && (
                        <Check size={14} className="text-teal flex-shrink-0" strokeWidth={2.4} />
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
