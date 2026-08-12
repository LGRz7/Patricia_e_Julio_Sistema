"use client"

import { useCallback, useEffect, useState } from "react"
import { isIos, isStandalone } from "@/lib/painel/pwa"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
  prompt(): Promise<void>
}

const DISMISS_KEY = "pj-pwa-dismissed"
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 dias

/**
 * usePwaInstall — captura beforeinstallprompt e expõe API pra modal.
 */
export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [installed, setInstalled] = useState(false)

  const dismiss = useCallback(() => {
    setVisible(false)
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {}
  }, [])

  const install = useCallback(async () => {
    if (!deferred) return
    await deferred.prompt()
    const choice = await deferred.userChoice
    setDeferred(null)
    setVisible(false)
    if (choice.outcome === "accepted") setInstalled(true)
  }, [deferred])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (isStandalone()) { setInstalled(true); return }

    // Se dismissou há < 7 dias, não reaparece
    const last = Number(localStorage.getItem(DISMISS_KEY) || "0")
    if (last && Date.now() - last < DISMISS_TTL_MS) return

    function onPrompt(e: Event) {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      // Aparece 3s depois pra não roubar atenção no load
      setTimeout(() => setVisible(true), 3000)
    }
    function onInstalled() { setInstalled(true); setVisible(false) }

    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)

    // Fallback iOS — não emite beforeinstallprompt. Mostra tutorial após 4s.
    if (isIos()) {
      const t = setTimeout(() => setVisible(true), 4000)
      return () => { clearTimeout(t); window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled) }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  return { visible, installed, install, dismiss, isIos: isIos(), canPrompt: !!deferred }
}
