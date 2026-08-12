"use client"

import { useCallback, useEffect, useState } from "react"

export interface Usuario {
  id: string
  nome: string
  email: string
  papel: "patricia" | "julio"
}

/**
 * useUsuario — puxa a sessão do endpoint /api/auth/me (cookie httpOnly).
 * Não guarda senha nem token no client — só o perfil pra exibição.
 */
export function useUsuario() {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  const recarregar = useCallback(async () => {
    try {
      const r = await fetch("/api/auth/me", { cache: "no-store" })
      const data = await r.json()
      setUsuario(data?.user || null)
    } catch {
      setUsuario(null)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    recarregar()
    // Reage a eventos do próprio app (após login/logout)
    function onChange() { recarregar() }
    window.addEventListener("pj-auth:change", onChange)
    return () => window.removeEventListener("pj-auth:change", onChange)
  }, [recarregar])

  const sair = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setUsuario(null)
    window.dispatchEvent(new CustomEvent("pj-auth:change"))
    // Redireciona pra login
    window.location.href = "/painel/login"
  }, [])

  return { usuario, carregando, recarregar, sair }
}
