/**
 * marketing-store.server.ts — persistência dos pedidos de criativo.
 *
 * Mesmo padrão dual do imoveis/acm: filesystem em dev, Vercel Blob em prod.
 */
import "server-only"
import { promises as fs } from "fs"
import path from "path"
import { randomUUID } from "crypto"
import type { PedidoCriativo, MetaSemanal } from "@/types/marketing"

const FILE_PATH = path.join(process.cwd(), "data", "marketing-pedidos.json")
const META_PATH = path.join(process.cwd(), "data", "marketing-meta.json")

interface StorageAdapter {
  readPedidos(): Promise<PedidoCriativo[]>
  writePedidos(list: PedidoCriativo[]): Promise<void>
  readMeta(): Promise<MetaSemanal | null>
  writeMeta(meta: MetaSemanal): Promise<void>
  mode: "fs" | "blob"
}

// ============================================================
// Adapter FS (dev / self-host com filesystem gravável)
// ============================================================
const fsAdapter: StorageAdapter = {
  mode: "fs",
  async readPedidos() {
    try {
      const raw = await fs.readFile(FILE_PATH, "utf8")
      const list = JSON.parse(raw) as PedidoCriativo[]
      return Array.isArray(list) ? list : []
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return []
      console.warn("[marketing-store] falha ao ler pedidos:", (err as Error).message)
      return []
    }
  },
  async writePedidos(list) {
    await fs.mkdir(path.dirname(FILE_PATH), { recursive: true })
    await fs.writeFile(FILE_PATH, JSON.stringify(list, null, 2), "utf8")
  },
  async readMeta() {
    try {
      const raw = await fs.readFile(META_PATH, "utf8")
      return JSON.parse(raw) as MetaSemanal
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return null
      return null
    }
  },
  async writeMeta(meta) {
    await fs.mkdir(path.dirname(META_PATH), { recursive: true })
    await fs.writeFile(META_PATH, JSON.stringify(meta, null, 2), "utf8")
  },
}

// ============================================================
// Adapter Vercel Blob (produção Vercel)
// ============================================================
const BLOB_KEY_PEDIDOS = "painel/marketing-pedidos.json"
const BLOB_KEY_META = "painel/marketing-meta.json"

async function loadBlobAdapter(): Promise<StorageAdapter | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return null
  try {
    const { put, list } = await import("@vercel/blob")

    async function readJson<T>(prefixKey: string): Promise<T | null> {
      try {
        const { blobs } = await list({ prefix: prefixKey, token, limit: 1 })
        if (!blobs.length) return null
        const res = await fetch(blobs[0].url, { cache: "no-store" })
        if (!res.ok) return null
        return (await res.json()) as T
      } catch (err) {
        console.warn(`[marketing-store blob] falha ao ler ${prefixKey}:`, (err as Error).message)
        return null
      }
    }
    async function writeJson(key: string, data: unknown) {
      await put(key, JSON.stringify(data, null, 2), {
        access: "public",
        contentType: "application/json",
        allowOverwrite: true,
        token,
      })
    }

    return {
      mode: "blob",
      async readPedidos() {
        const list = await readJson<PedidoCriativo[]>(BLOB_KEY_PEDIDOS)
        return Array.isArray(list) ? list : []
      },
      async writePedidos(list) { await writeJson(BLOB_KEY_PEDIDOS, list) },
      async readMeta() {
        return await readJson<MetaSemanal>(BLOB_KEY_META)
      },
      async writeMeta(meta) { await writeJson(BLOB_KEY_META, meta) },
    }
  } catch (err) {
    console.warn("[marketing-store] @vercel/blob não disponível:", (err as Error).message)
    return null
  }
}

// ============================================================
// Escolha do adapter (lazy)
// ============================================================
let cached: StorageAdapter | null = null
async function getAdapter(): Promise<StorageAdapter> {
  if (cached) return cached
  if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
    const blob = await loadBlobAdapter()
    if (blob) { cached = blob; return blob }
    console.warn("[marketing-store] rodando em produção sem BLOB_READ_WRITE_TOKEN — dados NÃO vão sobreviver a deploys")
  }
  cached = fsAdapter
  return fsAdapter
}

// ============================================================
// Pedidos
// ============================================================
export async function listPedidos(): Promise<PedidoCriativo[]> {
  const a = await getAdapter()
  const list = await a.readPedidos()
  return list.sort((x, y) => (y.criadoEm || "").localeCompare(x.criadoEm || ""))
}

export async function getPedido(id: string): Promise<PedidoCriativo | null> {
  const list = await listPedidos()
  return list.find((p) => p.id === id || p.slug === id) || null
}

export async function createPedido(
  input: Omit<PedidoCriativo, "id" | "slug" | "criadoEm" | "atualizadoEm" | "criativos"> & { slug?: string; criativos?: PedidoCriativo["criativos"] },
): Promise<PedidoCriativo> {
  const a = await getAdapter()
  const list = await a.readPedidos()
  const id = randomUUID()
  const nowIso = new Date().toISOString()
  const slug = ensureUniqueSlug(input.slug || makeSlug(input), list)
  const pedido: PedidoCriativo = {
    ...input,
    id,
    slug,
    criativos: input.criativos || [],
    criadoEm: nowIso,
    atualizadoEm: nowIso,
  }
  list.push(pedido)
  await a.writePedidos(list)
  return pedido
}

export async function updatePedido(
  id: string,
  patch: Partial<PedidoCriativo>,
): Promise<PedidoCriativo | null> {
  const a = await getAdapter()
  const list = await a.readPedidos()
  const idx = list.findIndex((p) => p.id === id || p.slug === id)
  if (idx < 0) return null
  const current = list[idx]
  const next: PedidoCriativo = {
    ...current,
    ...patch,
    id: current.id,
    criadoEm: current.criadoEm,
    atualizadoEm: new Date().toISOString(),
    slug: current.slug,
  }
  list[idx] = next
  await a.writePedidos(list)
  return next
}

export async function deletePedido(id: string): Promise<boolean> {
  const a = await getAdapter()
  const list = await a.readPedidos()
  const next = list.filter((p) => p.id !== id && p.slug !== id)
  const changed = next.length !== list.length
  if (changed) await a.writePedidos(next)
  return changed
}

// ============================================================
// Meta semanal
// ============================================================
export const META_DEFAULT: MetaSemanal = {
  postsPorSemana: 3,
  personaFocoIds: [],
}

export async function getMeta(): Promise<MetaSemanal> {
  const a = await getAdapter()
  return (await a.readMeta()) || META_DEFAULT
}

export async function saveMeta(patch: Partial<MetaSemanal>): Promise<MetaSemanal> {
  const a = await getAdapter()
  const atual = await getMeta()
  const merged: MetaSemanal = {
    postsPorSemana: patch.postsPorSemana ?? atual.postsPorSemana,
    personaFocoIds: patch.personaFocoIds ?? atual.personaFocoIds,
  }
  await a.writeMeta(merged)
  return merged
}

// ============================================================
// Helpers
// ============================================================
function makeSlug(input: { personaId: string; tipo: string; gancho: string }): string {
  return `${input.tipo}-${input.personaId}-${input.gancho}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}
function ensureUniqueSlug(base: string, existing: PedidoCriativo[]): string {
  if (!existing.some((e) => e.slug === base)) return base
  let i = 2
  while (existing.some((e) => e.slug === `${base}-${i}`)) i++
  return `${base}-${i}`
}
