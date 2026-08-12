/**
 * marketing-api.ts — client wrapper das rotas /api/marketing.
 */
"use client"

import type { PedidoCriativo, MetaSemanal } from "@/types/marketing"

// ============================================================
// Pedidos
// ============================================================
export async function apiListPedidos(): Promise<PedidoCriativo[]> {
  const r = await fetch("/api/marketing/pedidos", { cache: "no-store" })
  if (!r.ok) throw new Error(`Falha ao listar (${r.status})`)
  const data = await r.json()
  return Array.isArray(data?.pedidos) ? data.pedidos : []
}

export async function apiGetPedido(id: string): Promise<PedidoCriativo | null> {
  const r = await fetch(`/api/marketing/pedidos/${encodeURIComponent(id)}`, { cache: "no-store" })
  if (r.status === 404) return null
  if (!r.ok) throw new Error(`Falha ao buscar (${r.status})`)
  const data = await r.json()
  return data?.pedido || null
}

export async function apiCreatePedido(
  payload: Omit<PedidoCriativo, "id" | "slug" | "criadoEm" | "atualizadoEm" | "criativos"> & {
    criativos?: PedidoCriativo["criativos"]
  },
): Promise<PedidoCriativo> {
  const r = await fetch("/api/marketing/pedidos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (r.status === 401) throw new Error("Sessão expirou. Faça login de novo.")
  const data = await r.json()
  if (!r.ok) throw new Error(data?.error || `Falha ao criar (${r.status})`)
  return data.pedido as PedidoCriativo
}

export async function apiUpdatePedido(id: string, patch: Partial<PedidoCriativo>): Promise<PedidoCriativo> {
  const r = await fetch(`/api/marketing/pedidos/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  })
  if (r.status === 401) throw new Error("Sessão expirou. Faça login de novo.")
  const data = await r.json()
  if (!r.ok) throw new Error(data?.error || `Falha ao atualizar (${r.status})`)
  return data.pedido as PedidoCriativo
}

export async function apiDeletePedido(id: string): Promise<boolean> {
  const r = await fetch(`/api/marketing/pedidos/${encodeURIComponent(id)}`, { method: "DELETE" })
  if (r.status === 401) throw new Error("Sessão expirou. Faça login de novo.")
  if (!r.ok) throw new Error(`Falha ao excluir (${r.status})`)
  const data = await r.json()
  return !!data?.removido
}

// ============================================================
// Meta
// ============================================================
export async function apiGetMeta(): Promise<MetaSemanal> {
  const r = await fetch("/api/marketing/meta", { cache: "no-store" })
  if (!r.ok) throw new Error(`Falha ao buscar meta (${r.status})`)
  const data = await r.json()
  return data.meta
}

export async function apiSaveMeta(patch: Partial<MetaSemanal>): Promise<MetaSemanal> {
  const r = await fetch("/api/marketing/meta", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  })
  if (r.status === 401) throw new Error("Sessão expirou. Faça login de novo.")
  const data = await r.json()
  if (!r.ok) throw new Error(data?.error || `Falha ao salvar meta (${r.status})`)
  return data.meta as MetaSemanal
}
