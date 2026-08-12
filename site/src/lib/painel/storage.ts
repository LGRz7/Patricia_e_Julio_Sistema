/**
 * Storage do painel — usa IndexedDB (via idb-keyval) pra persistir:
 *   - imóveis do catálogo (que o admin adiciona)
 *   - trajetos calculados (histórico → dashboard financeiro)
 *   - usuário identificado
 *   - preferências (custo Uber/L combustível/etc)
 *
 * Todos os dados vivem no navegador do corretor. Pra sincronizar o
 * catálogo com o site público, o admin usa `exportarImoveisTs()` que
 * gera o conteúdo de `src/data/imoveis.ts` pronto pra colar no repo.
 */
import { get, set, del, keys, entries } from "idb-keyval"
import type { Imovel } from "@/types/imovel"

// ============================================================
// Namespaced keys
// ============================================================
export const K = {
  USUARIO: "pj-usuario",
  PREFS:   "pj-prefs",
  TRAJETOS: "pj-trajetos",         // array<Trajeto>
  IMOVEIS_ADMIN: "pj-imoveis-adm", // Record<slug, Imovel>
} as const

// ============================================================
// Tipos do painel
// ============================================================
export type PapelUsuario = "patricia" | "julio" | "visitante"

export interface Usuario {
  id: string           // uuid
  papel: PapelUsuario
  nome: string
  whatsapp?: string
  identificadoEm: string  // ISO
}

export interface Prefs {
  /** R$/km base do Uber (default 2.50) */
  uberKm: number
  /** Tarifa mínima do Uber (default 7) */
  uberBase: number
  /** R$/km táxi (default 3.50) */
  taxiKm: number
  /** Bandeirada do táxi (default 6) */
  taxiBase: number
  /** Consumo médio (km/L) do carro do corretor (default 12) */
  autonomia: number
  /** Preço do litro da gasolina (default 6.20) */
  precoGasolina: number
  /** Comissão média esperada (% do valor do imóvel) (default 5) */
  comissaoPct: number
  /** Meta de posts/semana no Marketing (default 5) */
  metaPostsSemana: number
}

export const PREFS_DEFAULT: Prefs = {
  uberKm: 2.5,
  uberBase: 7,
  taxiKm: 3.5,
  taxiBase: 6,
  autonomia: 12,
  precoGasolina: 6.2,
  comissaoPct: 5,
  metaPostsSemana: 5,
}

export interface Trajeto {
  id: string
  criadoEm: string       // ISO
  corretor: PapelUsuario
  imovelSlug?: string
  imovelTitulo: string
  origem: { label: string; lat: number; lon: number }
  destino: { label: string; lat: number; lon: number }
  distanciaKm: number    // ida
  duracaoMin: number     // ida
  custo: {
    uberIdaVolta: number
    taxiIdaVolta: number
    gasolinaIdaVolta: number
  }
  meioEscolhido?: "uber" | "taxi" | "gasolina"
  gastoRegistrado?: number  // valor efetivamente lançado no financeiro
}

// ============================================================
// Usuário
// ============================================================
export async function getUsuario(): Promise<Usuario | null> {
  try {
    return (await get<Usuario>(K.USUARIO)) ?? null
  } catch {
    return null
  }
}

export async function setUsuario(u: Usuario): Promise<void> {
  await set(K.USUARIO, u)
}

export async function clearUsuario(): Promise<void> {
  await del(K.USUARIO)
}

// ============================================================
// Preferências (financeiras + carro)
// ============================================================
export async function getPrefs(): Promise<Prefs> {
  const saved = await get<Partial<Prefs>>(K.PREFS)
  return { ...PREFS_DEFAULT, ...(saved || {}) }
}

export async function savePrefs(patch: Partial<Prefs>): Promise<Prefs> {
  const merged = { ...(await getPrefs()), ...patch }
  await set(K.PREFS, merged)
  return merged
}

// ============================================================
// Trajetos (histórico + financeiro)
// ============================================================
export async function listTrajetos(): Promise<Trajeto[]> {
  return (await get<Trajeto[]>(K.TRAJETOS)) ?? []
}

export async function addTrajeto(t: Trajeto): Promise<void> {
  const list = await listTrajetos()
  list.unshift(t)
  await set(K.TRAJETOS, list.slice(0, 500)) // limite razoável
}

export async function updateTrajeto(id: string, patch: Partial<Trajeto>): Promise<void> {
  const list = await listTrajetos()
  const idx = list.findIndex((t) => t.id === id)
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...patch }
    await set(K.TRAJETOS, list)
  }
}

export async function removeTrajeto(id: string): Promise<void> {
  const list = await listTrajetos()
  await set(K.TRAJETOS, list.filter((t) => t.id !== id))
}

// ============================================================
// Imóveis do admin (rascunhos + edits + novos)
// ============================================================
export async function listImoveisAdm(): Promise<Imovel[]> {
  const rec = (await get<Record<string, Imovel>>(K.IMOVEIS_ADMIN)) ?? {}
  return Object.values(rec).sort((a, b) => a.titulo.localeCompare(b.titulo))
}

export async function saveImovelAdm(imovel: Imovel): Promise<void> {
  const rec = (await get<Record<string, Imovel>>(K.IMOVEIS_ADMIN)) ?? {}
  rec[imovel.slug] = imovel
  await set(K.IMOVEIS_ADMIN, rec)
}

export async function removeImovelAdm(slug: string): Promise<void> {
  const rec = (await get<Record<string, Imovel>>(K.IMOVEIS_ADMIN)) ?? {}
  delete rec[slug]
  await set(K.IMOVEIS_ADMIN, rec)
}

/**
 * Gera o TypeScript pronto pra colar em src/data/imoveis.ts.
 * Combina os imóveis do admin com os que já vieram do repo (base).
 */
export async function exportarImoveisTs(baseImoveis: Imovel[]): Promise<string> {
  const admin = await listImoveisAdm()
  // Admin sobrescreve base quando slug igual; senão vira novo item
  const map = new Map<string, Imovel>()
  for (const i of baseImoveis) map.set(i.slug, i)
  for (const i of admin) map.set(i.slug, i)
  const merged = Array.from(map.values())

  const body = merged
    .map((i) => "  " + JSON.stringify(i, null, 2).replace(/\n/g, "\n  "))
    .join(",\n")

  return `import type { Imovel } from "@/types/imovel"

/**
 * Imóveis do catálogo.
 * Gerado automaticamente pelo Painel dos Corretores em ${new Date().toISOString()}.
 * Manter esse arquivo sempre atualizado — é o que o site público consome.
 */
export const imoveis: Imovel[] = [
${body}
]

export function getImovel(slug: string): Imovel | undefined {
  return imoveis.find((i) => i.slug === slug)
}

export function getImoveisDestaque(): Imovel[] {
  return imoveis.filter((i) => i.status === "disponivel")
}
`
}

// ============================================================
// Debug util
// ============================================================
export async function listAllKeys(): Promise<IDBValidKey[]> {
  return await keys()
}

export async function dumpAll(): Promise<Record<string, unknown>> {
  const all = await entries()
  return Object.fromEntries(all.map(([k, v]) => [String(k), v]))
}


// ============================================================
// Cache de geocoding (evita re-request de imóveis já resolvidos)
// ============================================================
const K_GEO = "pj-geo-cache"

export interface GeoCache {
  [chave: string]: { lat: number; lon: number; ts: number }
}

export async function geocodeCached(chave: string): Promise<{ lat: number; lon: number } | null> {
  const cache = (await get<GeoCache>(K_GEO)) ?? {}
  const item = cache[chave]
  if (!item) return null
  // Cache válido por 30 dias
  if (Date.now() - item.ts > 30 * 24 * 60 * 60 * 1000) return null
  return { lat: item.lat, lon: item.lon }
}

export async function geocodeCacheSet(chave: string, coords: { lat: number; lon: number }): Promise<void> {
  const cache = (await get<GeoCache>(K_GEO)) ?? {}
  cache[chave] = { ...coords, ts: Date.now() }
  await set(K_GEO, cache)
}
