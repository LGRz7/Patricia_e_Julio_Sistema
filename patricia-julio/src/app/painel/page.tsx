"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { MapPin, Building2, Wallet, Route, Sparkles, ArrowRight, TrendingUp, Fuel } from "lucide-react"
import { useUsuario } from "@/hooks/painel/useUsuario"

export default function PainelHome() {
  const { usuario } = useUsuario()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const saudacao = periodoDoDia()
  const nomeCorto = usuario?.papel === "patricia" ? "Patrícia" : usuario?.papel === "julio" ? "Júlio" : usuario?.nome?.split(" ")[0] || "por aí"

  return (
    <div className="px-5 lg:px-10 pt-6 lg:pt-10 pb-10 space-y-6">
      {/* HERO SAUDAÇÃO */}
      <section
        className="relative overflow-hidden rounded-3xl px-6 py-7 lg:px-9 lg:py-9 text-beige"
        style={{ background: "linear-gradient(135deg, #2F4156 0%, #567C8D 100%)" }}
      >
        <div className="relative z-10 max-w-xl">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-beige/70">Painel dos Corretores</div>
          <h1 className="mt-2 font-display text-[26px] lg:text-[34px] font-bold leading-[1.05] tracking-tight">
            {saudacao}, {nomeCorto}.
          </h1>
          <p className="mt-3 text-[13px] text-beige/80 leading-relaxed max-w-md">
            Calcule quanto custa cada visita, crie posts de marketing e gerencie o catálogo. Tudo no seu ritmo.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/painel/marketing"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-beige text-navy text-[12.5px] font-bold hover:bg-white transition-colors"
            >
              <Sparkles size={14} strokeWidth={2.2} />
              Criar post
            </Link>
            <Link
              href="/painel/mapa"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-beige/30 text-beige text-[12.5px] font-semibold hover:bg-beige/10 transition-colors"
            >
              <MapPin size={14} strokeWidth={2} />
              Calcular trajeto
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-6 -bottom-8 w-[220px] h-[220px] rounded-full opacity-40" style={{ background: "radial-gradient(circle, rgba(200,217,230,0.4), transparent 70%)" }} />
        <div className="pointer-events-none absolute right-10 top-6 w-[80px] h-[80px] rounded-full opacity-25" style={{ background: "radial-gradient(circle, rgba(245,239,235,0.5), transparent 70%)" }} />
      </section>

      {/* Atalhos principais - CLEAN e RÁPIDO */}
      <section className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <ShortcutCard href="/painel/marketing" icon={Sparkles} title="Marketing" desc="Criar posts" color="navy" />
        <ShortcutCard href="/painel/mapa" icon={MapPin} title="Trajeto" desc="Origem → imóvel" color="teal" />
        <ShortcutCard href="/painel/catalogo" icon={Building2} title="Catálogo" desc="Gerenciar imóveis" color="navy" />
        <ShortcutCard href="/painel/financeiro" icon={Wallet} title="Gastos" desc="Uber, táxi, combustível" color="teal" />
      </section>

      {/* Link para funcionalidades extras */}
      <section className="text-center py-4">
        <p className="text-[11.5px] text-teal mb-3">Mais funcionalidades</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/painel/acm" className="text-[12px] font-semibold text-navy hover:text-teal transition-colors inline-flex items-center gap-1">
            ACM <ArrowRight size={11} />
          </Link>
          <Link href="/painel/perfil" className="text-[12px] font-semibold text-navy hover:text-teal transition-colors inline-flex items-center gap-1">
            Perfil <ArrowRight size={11} />
          </Link>
        </div>
      </section>
    </div>
  )
}

function periodoDoDia() {
  const h = new Date().getHours()
  if (h < 12) return "Bom dia"
  if (h < 18) return "Boa tarde"
  return "Boa noite"
}

function ShortcutCard({ href, icon: Icon, title, desc, color }: { 
  href: string
  icon: typeof Route
  title: string
  desc: string
  color: "navy" | "teal"
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center justify-center gap-3 p-5 lg:p-6 rounded-3xl border-2 border-sky/60 bg-white hover:border-teal hover:shadow-lg transition-all"
    >
      <span 
        className="w-14 h-14 rounded-2xl grid place-items-center text-beige"
        style={{ 
          background: color === "navy" 
            ? "linear-gradient(135deg, #2F4156, #567C8D)" 
            : "linear-gradient(135deg, #567C8D, #88B5C8)"
        }}
      >
        <Icon size={24} strokeWidth={2} />
      </span>
      <div className="text-center">
        <div className="text-[15px] font-bold text-navy">{title}</div>
        <div className="text-[11px] text-teal mt-1">{desc}</div>
      </div>
    </Link>
  )
}
