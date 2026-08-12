"use client"
import { useEffect } from "react"
import { registerServiceWorker } from "@/lib/painel/pwa"

export function PwaRegister() {
  useEffect(() => { registerServiceWorker() }, [])
  return null
}
