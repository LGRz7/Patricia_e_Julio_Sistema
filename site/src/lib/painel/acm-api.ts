/**
 * acm-api.ts — client wrapper das rotas /api/acm.
 * Usado nas páginas do painel (client components).
 */
"use client"

import type { ACM } from "@/types/acm"

export async function apiListAcms(): Promise<ACM[]> {
  const r = await fetch("/api/acm", { cache: "no-store" })
  if (!r.ok) throw new Error(`Falha ao listar (${r.status})`)
  const data = await r.json()
  return Array.isArray(data?.acms) ? data.acms : []
}

export async function apiGetAcm(id: string): Promise<ACM | null> {
  const r = await fetch(`/api/acm/${encodeURIComponent(id)}`, { cache: "no-store" })
  if (r.status === 404) return null
  if (!r.ok) throw new Error(`Falha ao buscar (${r.status})`)
  const data = await r.json()
  return data?.acm || null
}

/** Cria uma ACM nova. */
export async function apiCreateAcm(payload: Omit<ACM, "id" | "slug" | "criadoEm" | "atualizadoEm"> & { slug?: string }): Promise<ACM> {
  const r = await fetch("/api/acm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (r.status === 401) throw new Error("Sessão expirou. Faça login de novo.")
  const data = await r.json()
  if (!r.ok) throw new Error(data?.error || `Falha ao salvar (${r.status})`)
  return data.acm as ACM
}

/** Atualiza uma ACM (patch). */
export async function apiUpdateAcm(id: string, patch: Partial<ACM>): Promise<ACM> {
  const r = await fetch(`/api/acm/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  })
  if (r.status === 401) throw new Error("Sessão expirou. Faça login de novo.")
  const data = await r.json()
  if (!r.ok) throw new Error(data?.error || `Falha ao atualizar (${r.status})`)
  return data.acm as ACM
}

export async function apiDeleteAcm(id: string): Promise<boolean> {
  const r = await fetch(`/api/acm/${encodeURIComponent(id)}`, { method: "DELETE" })
  if (r.status === 401) throw new Error("Sessão expirou. Faça login de novo.")
  if (!r.ok) throw new Error(`Falha ao excluir (${r.status})`)
  const data = await r.json()
  return !!data?.removido
}


// ============================================================
// Busca automática de comparáveis (Fase B++ com scraper caseiro)
// ============================================================
import type { AmostraACM, ImovelAlvoACM } from "@/types/acm"

export type ScraperMode = "playwright" | "http" | "assisted"

export interface UrlAssistida {
  titulo: string
  descricao: string
  href: string
  fonte: "ZAP"
}

export interface BuscaComparaveisMeta {
  modo: ScraperMode
  totalDisponivel: number
  candidatosApos: number
  candidatosRankeados: number
  ampliouParaCidade: boolean
  erro?: string
  duracaoMs: number
  fontesConsultadas: string[]
}

/** Amostra retornada pela busca automática — carrega o score de similaridade calculado no server. */
export type AmostraSugerida = AmostraACM & { _similaridade?: number }

export async function apiBuscarComparaveis(
  alvo: Partial<ImovelAlvoACM> & Pick<ImovelAlvoACM, "cidade" | "bairro" | "areaTotal">,
  top = 6,
): Promise<{ amostras: AmostraSugerida[]; urlsAssistidas: UrlAssistida[]; meta: BuscaComparaveisMeta }> {
  const r = await fetch("/api/acm/buscar-comparaveis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...alvo, top }),
  })
  if (r.status === 401) throw new Error("Sessão expirou. Faça login de novo.")
  const data = await r.json()
  if (!r.ok) throw new Error(data?.error || `Falha ao buscar (${r.status})`)
  return {
    amostras: Array.isArray(data?.amostras) ? data.amostras : [],
    urlsAssistidas: Array.isArray(data?.urlsAssistidas) ? data.urlsAssistidas : [],
    meta: data?.meta || {
      modo: "assisted",
      totalDisponivel: 0,
      candidatosApos: 0,
      candidatosRankeados: 0,
      ampliouParaCidade: false,
      duracaoMs: 0,
      fontesConsultadas: [],
    },
  }
}
