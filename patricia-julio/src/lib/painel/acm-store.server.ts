/**
 * acm-store.server.ts — persistência server-side das ACMs.
 *
 * Mesmo padrão dual do imoveis-store:
 *   • Dev / self-hosted: data/acm.json
 *   • Vercel prod (fs read-only): @vercel/blob se BLOB_READ_WRITE_TOKEN estiver setado
 *
 * As ACMs vivem só no painel — o site público nunca lê elas.
 */
import "server-only"
import { promises as fs } from "fs"
import path from "path"
import { randomUUID } from "crypto"
import type { ACM } from "@/types/acm"

const FILE_PATH = path.join(process.cwd(), "data", "acm.json")

interface StorageAdapter {
  read(): Promise<ACM[]>
  write(list: ACM[]): Promise<void>
  mode: "fs" | "blob"
}

const fsAdapter: StorageAdapter = {
  mode: "fs",
  async read() {
    try {
      const raw = await fs.readFile(FILE_PATH, "utf8")
      const list = JSON.parse(raw) as ACM[]
      return Array.isArray(list) ? list : []
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return []
      console.warn("[acm-store] falha ao ler:", (err as Error).message)
      return []
    }
  },
  async write(list) {
    await fs.mkdir(path.dirname(FILE_PATH), { recursive: true })
    await fs.writeFile(FILE_PATH, JSON.stringify(list, null, 2), "utf8")
  },
}

const BLOB_KEY = "painel/acm.json"

async function loadBlobAdapter(): Promise<StorageAdapter | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return null
  try {
    const { put, list } = await import("@vercel/blob")
    return {
      mode: "blob",
      async read() {
        try {
          const { blobs } = await list({ prefix: BLOB_KEY, token, limit: 1 })
          if (!blobs.length) return []
          const res = await fetch(blobs[0].url, { cache: "no-store" })
          if (!res.ok) return []
          const json = (await res.json()) as ACM[]
          return Array.isArray(json) ? json : []
        } catch (err) {
          console.warn("[acm-store blob] falha ao ler:", (err as Error).message)
          return []
        }
      },
      async write(list) {
        await put(BLOB_KEY, JSON.stringify(list, null, 2), {
          access: "public",
          contentType: "application/json",
          allowOverwrite: true,
          token,
        })
      },
    }
  } catch (err) {
    console.warn("[acm-store] @vercel/blob não disponível:", (err as Error).message)
    return null
  }
}

let cached: StorageAdapter | null = null
async function getAdapter(): Promise<StorageAdapter> {
  if (cached) return cached
  if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
    const blob = await loadBlobAdapter()
    if (blob) { cached = blob; return blob }
  }
  cached = fsAdapter
  return fsAdapter
}

// ============================================================
// API pública
// ============================================================
export async function listAcms(): Promise<ACM[]> {
  const a = await getAdapter()
  const list = await a.read()
  // Mais recentes primeiro
  return list.sort((a1, b1) => (b1.criadoEm || "").localeCompare(a1.criadoEm || ""))
}

export async function getAcm(id: string): Promise<ACM | null> {
  const list = await listAcms()
  return list.find((a) => a.id === id || a.slug === id) || null
}

export async function createAcm(input: Omit<ACM, "id" | "slug" | "criadoEm" | "atualizadoEm"> & { slug?: string }): Promise<ACM> {
  const a = await getAdapter()
  const list = await a.read()
  const id = randomUUID()
  const nowIso = new Date().toISOString()
  const slug = ensureUniqueSlug(input.slug || id.slice(0, 8), list)
  const acm: ACM = {
    ...input,
    id,
    slug,
    criadoEm: nowIso,
    atualizadoEm: nowIso,
  }
  list.push(acm)
  await a.write(list)
  return acm
}

export async function updateAcm(id: string, patch: Partial<ACM>): Promise<ACM | null> {
  const a = await getAdapter()
  const list = await a.read()
  const idx = list.findIndex((x) => x.id === id || x.slug === id)
  if (idx < 0) return null
  // Não permite trocar id, permite ajustar slug se vier no patch (mas garante unicidade)
  const current = list[idx]
  const next: ACM = {
    ...current,
    ...patch,
    id: current.id,
    criadoEm: current.criadoEm,
    atualizadoEm: new Date().toISOString(),
    slug: patch.slug && patch.slug !== current.slug
      ? ensureUniqueSlug(patch.slug, list.filter((_, i) => i !== idx))
      : current.slug,
  }
  list[idx] = next
  await a.write(list)
  return next
}

export async function deleteAcm(id: string): Promise<boolean> {
  const a = await getAdapter()
  const list = await a.read()
  const next = list.filter((x) => x.id !== id && x.slug !== id)
  const changed = next.length !== list.length
  if (changed) await a.write(next)
  return changed
}

// ============================================================
// Helpers
// ============================================================
function ensureUniqueSlug(base: string, existing: ACM[]): string {
  if (!existing.some((e) => e.slug === base)) return base
  let i = 2
  while (existing.some((e) => e.slug === `${base}-${i}`)) i++
  return `${base}-${i}`
}
