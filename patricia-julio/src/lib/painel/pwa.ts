/**
 * pwa.ts — helpers pra service worker + install prompt.
 */

export function registerServiceWorker(): void {
  if (typeof window === "undefined") return
  if (!("serviceWorker" in navigator)) return
  // Só em produção — evita cache atrapalhar dev
  if (process.env.NODE_ENV !== "production") return
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) => {
      console.warn("[SW] falhou:", err)
    })
  })
}

/**
 * Verifica se o app já está instalado (standalone / homescreen).
 */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS legacy
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

/** Detecta iOS (Safari não emite beforeinstallprompt) */
export function isIos(): boolean {
  if (typeof window === "undefined") return false
  const ua = window.navigator.userAgent
  return /iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua)
}
