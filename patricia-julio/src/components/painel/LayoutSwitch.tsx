"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import type { ReactNode, ComponentType } from "react"

/**
 * Decide se renderiza o shell (sidebar + topbar) ou só o children puro.
 * /painel/login não tem shell — é tela fullscreen.
 */
export function LayoutSwitch({
  shell: Shell,
  bottomNav: BottomNav,
  children,
}: {
  shell: ComponentType<{ children: ReactNode }>
  bottomNav: ComponentType
  children: ReactNode
}) {
  const pathname = usePathname()
  const [montado, setMontado] = useState(false)

  useEffect(() => {
    setMontado(true)
  }, [])

  const semShell = pathname === "/painel/login" || pathname.startsWith("/painel/login/")

  // Evita hidratação desigual - no servidor sempre renderiza sem shell temporariamente
  if (!montado) {
    return <>{children}</>
  }

  if (semShell) return <>{children}</>

  return (
    <>
      <Shell>{children}</Shell>
      <BottomNav />
    </>
  )
}
