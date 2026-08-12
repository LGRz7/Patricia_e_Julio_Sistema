"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

/**
 * Bloqueia menus de contexto, cópia, corte, arrasto e teclas de atalho
 * comuns pra copiar conteúdo. Libera dentro de inputs/textareas.
 *
 * ⚠️ NÃO roda dentro de /painel — é área privada dos corretores, eles
 * precisam interagir com forms, uploads e conteúdo sem restrição.
 * (O selectstart bloqueado quebrava o click em <label htmlFor> nos
 * uploads de foto do Estúdio, entre outras coisas.)
 */
export function CopyGuard() {
  const pathname = usePathname()
  const insidePainel = pathname?.startsWith("/painel") ?? false

  useEffect(() => {
    if (insidePainel) return

    const isEditable = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false
      const tag = el.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true
      if (el.isContentEditable) return true
      if (el.closest(".allow-copy")) return true
      return false
    }

    const block = (e: Event) => {
      if (isEditable(e.target)) return
      e.preventDefault()
    }

    const blockKeys = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return
      const k = e.key.toLowerCase()
      if ((e.ctrlKey || e.metaKey) && ["c", "x", "a", "s", "p", "u"].includes(k)) {
        e.preventDefault()
      }
    }

    document.addEventListener("contextmenu", block)
    document.addEventListener("copy", block)
    document.addEventListener("cut", block)
    document.addEventListener("dragstart", block)
    document.addEventListener("selectstart", block)
    document.addEventListener("keydown", blockKeys)

    return () => {
      document.removeEventListener("contextmenu", block)
      document.removeEventListener("copy", block)
      document.removeEventListener("cut", block)
      document.removeEventListener("dragstart", block)
      document.removeEventListener("selectstart", block)
      document.removeEventListener("keydown", blockKeys)
    }
  }, [insidePainel])

  return null
}
