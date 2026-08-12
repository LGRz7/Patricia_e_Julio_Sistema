/**
 * imoveis-store.server.ts — storage server-side pros imóveis publicados.
 *
 * Estratégia dual:
 *   • Dev / self-hosted / com filesystem gravável: usa data/imoveis-published.json
 *   • Vercel produção (filesystem read-only): usa @vercel/blob se BLOB_READ_WRITE_TOKEN
 *     estiver setado, senão avisa que persistência não vai sobreviver a deploys.
 *
 * O site público (Server Components) lê via getPublicados() e faz merge com o
 * catálogo base (data/imoveis.ts).
 */
import "server-only"
import { promises as fs } from "fs"
import path from "path"
import type { Imovel } from "@/types/imovel"

const FILE_PATH = path.join(process.cwd(), "data", "imoveis-published.json")

interface StorageAdapter {
  read(): Promise<Imovel[]>
  write(imoveis: Imovel[]): Promise<void>
  mode: "fs" | "blob" | "readonly"
}

// ============================================================
// Adapter: FS (dev / self-hosted)
// ============================================================
const fsAdapter: StorageAdapter = {
  mode: "fs",
  async read() {
    try {
      const raw = await fs.readFile(FILE_PATH, "utf8")
      const list = JSON.parse(raw) as Imovel[]
      return Array.isArray(list) ? list : []
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return []
      console.warn("[imoveis-store] falha ao ler arquivo:", (err as Error).message)
      return []
    }
  },
  async write(imoveis) {
    await fs.mkdir(path.dirname(FILE_PATH), { recursive: true })
    await fs.writeFile(FILE_PATH, JSON.stringify(imoveis, null, 2), "utf8")
  },
}

// ============================================================
// Adapter: Vercel Blob (produção)
// Só é usado se BLOB_READ_WRITE_TOKEN está setado.
// ============================================================
const BLOB_KEY = "painel/imoveis-published.json"

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
          const json = (await res.json()) as Imovel[]
          return Array.isArray(json) ? json : []
        } catch (err) {
          console.warn("[imoveis-store blob] falha ao ler:", (err as Error).message)
          return []
        }
      },
      async write(imoveis) {
        await put(BLOB_KEY, JSON.stringify(imoveis, null, 2), {
          access: "public",
          contentType: "application/json",
          allowOverwrite: true,
          token,
        })
      },
    }
  } catch (err) {
    console.warn("[imoveis-store] @vercel/blob não instalado. Rode `npm i @vercel/blob` pra ativar storage persistente em prod.", (err as Error).message)
    return null
  }
}

// ============================================================
// Escolhe o adapter no boot (lazy)
// ============================================================
let cached: StorageAdapter | null = null

async function getAdapter(): Promise<StorageAdapter> {
  if (cached) return cached
  // Vercel prod → blob (se disponível)
  if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
    const blob = await loadBlobAdapter()
    if (blob) { cached = blob; return blob }
    console.warn("[imoveis-store] Vercel detected without BLOB_READ_WRITE_TOKEN — persistência limitada")
  }
  cached = fsAdapter
  return fsAdapter
}

// ============================================================
// API pública (usada por API routes e Server Components)
// ============================================================
export async function getPublicados(): Promise<Imovel[]> {
  const a = await getAdapter()
  return a.read()
}

export async function savePublicados(imoveis: Imovel[]): Promise<void> {
  const a = await getAdapter()
  await a.write(imoveis)
}

/**
 * Atualiza um imóvel específico (upsert por slug) e persiste tudo.
 * Retorna o imóvel salvo.
 */
export async function upsertImovel(imovel: Imovel): Promise<Imovel> {
  const list = await getPublicados()
  const idx = list.findIndex((i) => i.slug === imovel.slug)
  if (idx >= 0) list[idx] = imovel
  else list.push(imovel)
  await savePublicados(list)
  return imovel
}

export async function removeImovelPublicado(slug: string): Promise<boolean> {
  const list = await getPublicados()
  const next = list.filter((i) => i.slug !== slug)
  const changed = next.length !== list.length
  if (changed) await savePublicados(next)
  return changed
}

/**
 * Retorna imóveis combinando o catálogo base + publicados.
 * Publicados sobrescrevem base quando slug igual.
 */
export async function getImoveisMerged(): Promise<Imovel[]> {
  const { imoveis: base } = await import("@/data/imoveis")
  const publicados = await getPublicados()
  const map = new Map<string, Imovel>()
  base.forEach((i) => map.set(i.slug, i))
  publicados.forEach((i) => map.set(i.slug, i))
  return Array.from(map.values())
}

export async function getImovelMerged(slug: string): Promise<Imovel | null> {
  const list = await getImoveisMerged()
  return list.find((i) => i.slug === slug) || null
}
