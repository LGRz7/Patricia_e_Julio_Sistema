/**
 * imoveis-api.ts — client wrapper pras rotas /api/imoveis.
 * Usado no dashboard (client components).
 */
"use client"

import type { Imovel } from "@/types/imovel"

export async function apiListImoveis(): Promise<Imovel[]> {
  const r = await fetch("/api/imoveis", { cache: "no-store" })
  if (!r.ok) throw new Error(`Falha ao listar (${r.status})`)
  const data = await r.json()
  return Array.isArray(data?.imoveis) ? data.imoveis : []
}

export async function apiGetImovel(slug: string): Promise<Imovel | null> {
  const r = await fetch(`/api/imoveis/${encodeURIComponent(slug)}`, { cache: "no-store" })
  if (r.status === 404) return null
  if (!r.ok) throw new Error(`Falha ao buscar (${r.status})`)
  const data = await r.json()
  return data?.imovel || null
}

export async function apiUpsertImovel(imovel: Partial<Imovel>): Promise<Imovel> {
  const r = await fetch("/api/imoveis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(imovel),
  })
  if (r.status === 401) throw new Error("Sessão expirou. Faça login de novo.")
  const data = await r.json()
  if (!r.ok) throw new Error(data?.error || `Falha ao salvar (${r.status})`)
  return data.imovel as Imovel
}

export async function apiDeleteImovel(slug: string): Promise<boolean> {
  const r = await fetch(`/api/imoveis/${encodeURIComponent(slug)}`, { method: "DELETE" })
  if (r.status === 401) throw new Error("Sessão expirou. Faça login de novo.")
  if (!r.ok) throw new Error(`Falha ao excluir (${r.status})`)
  const data = await r.json()
  return !!data?.removidoDaPublicacao
}
