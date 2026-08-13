"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useMemo, useState, useEffect } from "react"
import {
  LayoutDashboard, MapPin, Building2, Wallet, LogOut, Menu, X, UserCog,
  Calculator, Megaphone, MoreHorizontal, ChevronRight, Globe,
} from "lucide-react"
import { useUsuario } from "@/hooks/painel/useUsuario"

interface NavItem { href: string; label: string; icon: typeof LayoutDashboard }

/**
 * NAV completa — usada na sidebar desktop (todos os itens em ordem).
 * Ordem baseada em frequência de uso projetada:
 *   Início → Catálogo → ACM (precificação) → Marketing → Trajeto → Financeiro → Perfil
 */
const NAV: NavItem[] = [
  { href: "/painel",              label: "Início",     icon: LayoutDashboard },
  { href: "/painel/catalogo",     label: "Catálogo",   icon: Building2 },
  { href: "/painel/acm",          label: "ACM",        icon: Calculator },
  { href: "/painel/marketing",    label: "Marketing",  icon: Megaphone },
  { href: "/painel/mapa",         label: "Trajeto",    icon: MapPin },
  { href: "/painel/financeiro",   label: "Financeiro", icon: Wallet },
  { href: "/painel/perfil",       label: "Perfil",     icon: UserCog },
]

/**
 * Bottom nav mobile — apenas 4 primary + "Mais".
 * Trajeto/Financeiro/Perfil ficam dentro do sheet "Mais".
 */
const BOTTOM_PRIMARY: NavItem[] = [
  { href: "/painel",              label: "Início",    icon: LayoutDashboard },
  { href: "/painel/catalogo",     label: "Catálogo",  icon: Building2 },
  { href: "/painel/acm",          label: "ACM",       icon: Calculator },
  { href: "/painel/marketing",    label: "Marketing", icon: Megaphone },
]

const BOTTOM_MAIS: NavItem[] = [
  { href: "/painel/mapa",         label: "Trajeto",    icon: MapPin },
  { href: "/painel/financeiro",   label: "Financeiro", icon: Wallet },
  { href: "/painel/perfil",       label: "Perfil",     icon: UserCog },
]

function activeIndexOf(pathname: string, list: NavItem[]): number {
  // Match mais específico ganha (evita /painel bater em tudo)
  let bestIdx = 0
  let bestLen = -1
  for (let i = 0; i < list.length; i++) {
    const href = list[i].href
    if (pathname === href || pathname.startsWith(href + "/")) {
      if (href.length > bestLen) { bestLen = href.length; bestIdx = i }
    }
  }
  return bestLen === -1 ? -1 : bestIdx
}

export function PainelShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { usuario, sair } = useUsuario()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [montado, setMontado] = useState(false)

  useEffect(() => {
    setMontado(true)
  }, [])

  const activeIndex = useMemo(() => activeIndexOf(pathname, NAV), [pathname])

  const iniciais = usuario?.papel === "patricia" ? "P" : usuario?.papel === "julio" ? "J" : (usuario?.nome?.[0] || "?").toString().toUpperCase()

  // Renderiza versão simplificada no servidor para evitar hidratação desigual
  if (!montado) {
    return (
      <div className="min-h-[100svh] bg-beige text-navy">
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:min-h-[100svh]">
          <aside className="hidden lg:flex flex-col border-r border-sky/60 bg-beige/60">
            <div className="p-6 border-b border-sky/60">
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-xl grid place-items-center text-white font-display font-bold text-[15px] shadow-[0_10px_20px_-6px_rgba(47,65,86,0.4)]" style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)" }}>PJ</span>
                <div>
                  <div className="font-display font-bold text-navy text-[15px] leading-tight">Painel dos Corretores</div>
                  <div className="text-[10.5px] text-teal font-medium">Patrícia · Júlio</div>
                </div>
              </div>
            </div>
          </aside>
          <main className="min-w-0 pb-24 lg:pb-8">
            {children}
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100svh] bg-beige text-navy">
      {/* ============= TOPBAR MOBILE =============
          pt-safe: respeita o notch/dynamic island do iOS quando instalado
          como PWA em tela cheia (sem esse padding, o status bar do sistema
          sobrepõe o botão de menu e a marca).                                 */}
      <header
        className="lg:hidden sticky top-0 z-30 bg-beige/90 backdrop-blur-lg border-b border-sky/60"
        style={{ paddingTop: "env(safe-area-inset-top, 0)" }}
      >
        <div className="flex items-center gap-3 px-4 py-2.5">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-11 h-11 grid place-items-center rounded-2xl bg-white border border-sky/70 shadow-[0_2px_6px_-2px_rgba(47,65,86,0.15)] active:scale-95 transition-transform"
            aria-label="Abrir menu"
          >
            <Menu size={22} strokeWidth={2.2} />
          </button>
          <Link href="/painel" className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-10 h-10 rounded-2xl grid place-items-center text-white font-display font-bold text-[14px] shadow-[0_6px_14px_-4px_rgba(47,65,86,0.4)] flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)" }}
            >
              PJ
            </span>
            <span className="font-display font-bold text-[17px] text-navy leading-tight truncate">Painel</span>
          </Link>
          <button
            onClick={() => router.push("/")}
            className="ml-auto inline-flex items-center gap-1 px-3 h-10 rounded-full bg-white/70 border border-sky/60 text-teal text-[12px] font-semibold hover:bg-white active:scale-95 transition-transform"
          >
            Ver site
          </button>
        </div>
      </header>

      {/* ============= DRAWER MOBILE ============= */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" />
          <aside
            className="absolute left-0 top-0 bottom-0 w-[86%] max-w-[340px] bg-beige border-r border-sky/60 flex flex-col animate-[slideIn_240ms_cubic-bezier(0.23,1,0.32,1)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-5 border-b border-sky/60">
              <Link
                href="/painel"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <span
                  className="w-12 h-12 rounded-2xl grid place-items-center text-white font-display font-bold text-[17px] shadow-[0_10px_20px_-6px_rgba(47,65,86,0.4)] flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)" }}
                >
                  PJ
                </span>
                <div className="min-w-0">
                  <div className="font-display font-bold text-navy text-[16px] leading-tight truncate">Painel dos Corretores</div>
                  <div className="text-[12px] text-teal font-medium mt-0.5 truncate">Patrícia &amp; Júlio</div>
                </div>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-10 h-10 grid place-items-center rounded-full text-navy/70 hover:bg-sky/40 transition-colors flex-shrink-0"
                aria-label="Fechar menu"
              >
                <X size={20} />
              </button>
            </div>
            <NavList items={NAV} active={activeIndex} onNav={() => setMobileOpen(false)} size="lg" />
            <div className="p-4 border-t border-sky/60">
              <UsuarioBadge usuario={usuario} iniciais={iniciais} onSair={sair} size="lg" />
            </div>
          </aside>
          <style>{`@keyframes slideIn { from { transform: translateX(-100%) } to { transform: translateX(0) } }`}</style>
        </div>
      )}

      {/* ============= DESKTOP LAYOUT ============= */}
      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:min-h-[100svh]">
        {/* Sidebar desktop */}
        <aside className="hidden lg:flex flex-col border-r border-sky/60 bg-beige/60">
          <div className="p-6 border-b border-sky/60">
            <Link href="/painel" className="flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-xl grid place-items-center text-white font-display font-bold text-[15px] shadow-[0_10px_20px_-6px_rgba(47,65,86,0.4)]" style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)" }}>PJ</span>
              <div>
                <div className="font-display font-bold text-navy text-[15px] leading-tight">Painel dos Corretores</div>
                <div className="text-[10.5px] text-teal font-medium">Patrícia · Júlio</div>
              </div>
            </Link>
          </div>
          <NavList items={NAV} active={activeIndex} />
          <div className="mt-auto p-4 border-t border-sky/60">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12.5px] text-teal hover:bg-sky/40 transition-colors font-medium"
            >
              <Globe size={14} strokeWidth={2} />
              Ver o site público
            </Link>
            <UsuarioBadge usuario={usuario} iniciais={iniciais} onSair={sair} />
          </div>
        </aside>

        <main className="min-w-0 pb-24 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}

function NavList({
  items,
  active,
  onNav,
  size = "sm",
}: {
  items: NavItem[]
  active: number
  onNav?: () => void
  size?: "sm" | "lg"
}) {
  const isLg = size === "lg"
  return (
    <nav className={`flex flex-col flex-1 overflow-y-auto ${isLg ? "p-4 gap-1.5" : "p-3 gap-1"}`}>
      {items.map((item, i) => {
        const Icon = item.icon
        const isActive = i === active
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNav}
            className={`relative flex items-center rounded-2xl font-medium transition-colors duration-300 ${
              isLg ? "gap-4 px-4 py-4 text-[16px]" : "gap-3 px-4 py-3 text-[13.5px]"
            }`}
            style={{
              background: isActive ? "linear-gradient(135deg, #2F4156, #567C8D)" : "transparent",
              color: isActive ? "#F5EFEB" : "#2F4156",
              boxShadow: isActive ? "0 10px 22px -6px rgba(47,65,86,0.35)" : "none",
            }}
          >
            <Icon size={isLg ? 22 : 17} strokeWidth={isActive ? 2.2 : 1.9} className="flex-shrink-0" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function UsuarioBadge({
  usuario, iniciais, onSair, size = "sm",
}: {
  usuario: ReturnType<typeof useUsuario>["usuario"]
  iniciais: string
  onSair: () => Promise<void>
  size?: "sm" | "lg"
}) {
  if (!usuario) return null
  const isLg = size === "lg"
  return (
    <div className={`flex items-center rounded-2xl bg-white/60 border border-sky/60 ${
      isLg ? "mt-0 gap-4 px-4 py-4" : "mt-2 gap-2.5 px-3 py-2.5"
    }`}>
      <Link
        href="/painel/perfil"
        className={`flex items-center flex-1 min-w-0 group ${isLg ? "gap-4" : "gap-2.5"}`}
        title="Ver meu perfil"
      >
        <div
          className={`rounded-full grid place-items-center text-white font-bold group-hover:scale-105 transition-transform flex-shrink-0 ${
            isLg ? "w-14 h-14 text-[18px]" : "w-8 h-8 text-xs"
          }`}
          style={{ background: usuario.papel === "julio" ? "#567C8D" : "#2F4156" }}
        >
          {iniciais}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-bold text-navy truncate group-hover:text-teal transition-colors ${isLg ? "text-[17px] leading-tight" : "text-[12px]"}`}>
            {usuario.nome}
          </div>
          <div className={`text-teal flex items-center gap-1.5 ${isLg ? "text-[13px] mt-1" : "text-[10px]"}`}>
            <UserCog size={isLg ? 14 : 9} /> Ver perfil
          </div>
        </div>
      </Link>
      <button
        onClick={onSair}
        className={`grid place-items-center text-navy/60 hover:text-navy rounded-xl hover:bg-sky/40 transition-colors flex-shrink-0 ${
          isLg ? "w-12 h-12" : "w-7 h-7"
        }`}
        title="Sair"
        aria-label="Sair"
      >
        <LogOut size={isLg ? 22 : 13} />
      </button>
    </div>
  )
}

/**
 * Bottom-nav mobile — 4 primary + "Mais" (abre sheet com overflow).
 */
export function BottomNavMobile() {
  const pathname = usePathname()
  const router = useRouter()
  const { sair } = useUsuario()
  const [maisAberto, setMaisAberto] = useState(false)
  const [montado, setMontado] = useState(false)

  useEffect(() => {
    setMontado(true)
  }, [])

  // Fecha sheet ao navegar
  useEffect(() => { setMaisAberto(false) }, [pathname])

  // Não renderiza nada no servidor para evitar hidratação desigual
  if (!montado) {
    return null
  }

  const primaryActive = activeIndexOf(pathname, BOTTOM_PRIMARY)
  const secondaryActive = activeIndexOf(pathname, BOTTOM_MAIS)
  const maisEstaAtivo = secondaryActive >= 0

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-beige/95 backdrop-blur-xl border-t border-sky/60 grid grid-cols-5 pb-safe"
      >
        {BOTTOM_PRIMARY.map((item, i) => {
          const active = i === primaryActive
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium"
              style={{ color: active ? "#2F4156" : "#567C8D" }}
            >
              <Icon size={19} strokeWidth={active ? 2.4 : 1.85} />
              <span>{item.label}</span>
            </Link>
          )
        })}
        <button
          onClick={() => setMaisAberto(true)}
          className="flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium"
          style={{ color: maisEstaAtivo ? "#2F4156" : "#567C8D" }}
          aria-label="Mais opções"
        >
          <MoreHorizontal size={19} strokeWidth={maisEstaAtivo ? 2.4 : 1.85} />
          <span>Mais</span>
        </button>
      </nav>

      {/* SHEET "MAIS" */}
      {maisAberto && (
        <div
          className="lg:hidden fixed inset-0 z-30 flex items-end"
          onClick={() => setMaisAberto(false)}
          role="dialog"
          aria-label="Mais opções"
        >
          <div className="absolute inset-0 bg-navy/45 backdrop-blur-sm" />
          <div
            className="relative w-full bg-beige rounded-t-3xl border-t border-sky/60 pb-safe animate-[slideUp_240ms_cubic-bezier(0.23,1,0.32,1)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-3 pb-1">
              <div className="mx-auto w-10 h-1 rounded-full bg-sky/70" />
            </div>
            <div className="px-5 pt-3 pb-2 flex items-center justify-between">
              <h2 className="font-display text-[14px] font-bold text-navy">Mais opções</h2>
              <button
                onClick={() => setMaisAberto(false)}
                className="w-8 h-8 grid place-items-center rounded-full text-navy/60"
                aria-label="Fechar"
              >
                <X size={16} />
              </button>
            </div>
            <ul className="px-3 pb-2">
              {BOTTOM_MAIS.map((item, i) => {
                const Icon = item.icon
                const active = i === secondaryActive
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMaisAberto(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors"
                      style={{
                        background: active ? "linear-gradient(135deg, #2F4156, #567C8D)" : "transparent",
                        color: active ? "#F5EFEB" : "#2F4156",
                      }}
                    >
                      <Icon size={17} strokeWidth={active ? 2.2 : 1.9} className="flex-shrink-0" />
                      <span className="text-[13.5px] font-medium flex-1">{item.label}</span>
                      <ChevronRight size={14} className="opacity-60" />
                    </Link>
                  </li>
                )
              })}
              <li>
                <button
                  onClick={() => router.push("/")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-teal hover:bg-sky/40 transition-colors"
                >
                  <Globe size={17} strokeWidth={1.9} className="flex-shrink-0" />
                  <span className="text-[13.5px] font-medium flex-1 text-left">Ver o site público</span>
                  <ChevronRight size={14} className="opacity-60" />
                </button>
              </li>
              <li className="pt-2 mt-2 border-t border-sky/60">
                <button
                  onClick={async () => {
                    setMaisAberto(false)
                    await sair()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-navy/70 hover:bg-sky/40 transition-colors"
                >
                  <LogOut size={17} strokeWidth={1.9} className="flex-shrink-0" />
                  <span className="text-[13.5px] font-medium flex-1 text-left">Sair</span>
                </button>
              </li>
            </ul>
            <style>{`@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>
          </div>
        </div>
      )}
    </>
  )
}
