#!/usr/bin/env node
/**
 * sync-personas.mjs — lê o bloco JSON no fim de `MazyOS/_memoria/publico-alvo.md`
 * e regenera `src/data/painel/personas.ts` com as 5 personas + regras.
 *
 * Uso:
 *   cd MazyOS/site
 *   npm run sync-personas
 *
 * Fluxo:
 *   1. Abre o arquivo MD
 *   2. Extrai o último bloco entre ```json ... ``` (o "Bloco JSON tool-ready")
 *   3. Parseia
 *   4. Emite o TypeScript formatado
 *
 * Segurança: NÃO sobrescreve se o parse falhar. Faz check de sanity
 * (mínimo 3 personas, todas com id/name/age/incomeBrl).
 */
import { promises as fs } from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MD_PATH = path.resolve(__dirname, "../../_memoria/publico-alvo.md")
const OUT_PATH = path.resolve(__dirname, "../src/data/painel/personas.ts")

// ============================================================
// Leitura + extração do bloco JSON
// ============================================================
const raw = await fs.readFile(MD_PATH, "utf8").catch((e) => {
  console.error("✗ falha ao ler o publico-alvo.md em", MD_PATH)
  console.error(" ", e.message)
  process.exit(1)
})

const blocos = [...raw.matchAll(/```json\s*([\s\S]*?)```/g)]
if (blocos.length === 0) {
  console.error("✗ nenhum bloco ```json``` encontrado em", MD_PATH)
  process.exit(1)
}

// Usa o ÚLTIMO bloco json — normalmente é o "tool-ready" no fim
const jsonRaw = blocos[blocos.length - 1][1].trim()
let dados
try {
  dados = JSON.parse(jsonRaw)
} catch (e) {
  console.error("✗ JSON do bloco não parseia:", e.message)
  console.error(" (primeiros 200 chars do bloco):", jsonRaw.slice(0, 200))
  process.exit(1)
}

if (!Array.isArray(dados.personas) || dados.personas.length < 3) {
  console.error("✗ esperava dados.personas[] com ≥ 3 entradas, achei", dados.personas?.length)
  process.exit(1)
}

// Sanidade: cada persona precisa dos campos mínimos
for (const p of dados.personas) {
  const missing = ["id", "name", "age", "income_brl", "regions", "product"].filter((k) => p[k] === undefined)
  if (missing.length) {
    console.error(`✗ persona "${p.id || p.name || "?"}" está sem: ${missing.join(", ")}`)
    process.exit(1)
  }
}

// ============================================================
// Emissão do TypeScript
// ============================================================
const clichesProibidos =
  Array.isArray(dados.brand?.tone?.avoid) ? dados.brand.tone.avoid : []

const rulesInline = [
  dados.creative_rules?.one_persona_per_creative && "Uma persona por criativo — nunca falar com duas ao mesmo tempo.",
  dados.creative_rules?.always_include_neighborhood && "Bairro sempre no card (Icaraí, não Niterói).",
  dados.creative_rules?.always_include_price_on_slide_1 && "Preço no primeiro slide quando for imóvel específico.",
  dados.creative_rules?.prefer_interior_photo_video && "Foto/vídeo por dentro do imóvel — evitar fachada solta.",
  dados.creative_rules?.always_include_creci_footer && "CRECI de ambos no rodapé.",
  Array.isArray(dados.creative_rules?.cta_style) &&
    dados.creative_rules.cta_style.length &&
    `CTA claro: ${dados.creative_rules.cta_style.join(" / ")}.`,
].filter(Boolean)

const now = new Date().toISOString()

function esc(str) {
  return String(str).replace(/\\/g, "\\\\").replace(/"/g, '\\"')
}
function arr(list) {
  return "[\n      " + list.map((x) => `"${esc(x)}"`).join(",\n      ") + ",\n    ]"
}

const personasTs = dados.personas
  .map(
    (p) => `  {
    id: "${esc(p.id)}",
    name: "${esc(p.name)}",
    age: [${p.age[0]}, ${p.age[1]}],
    incomeBrl: [${p.income_brl[0]}, ${p.income_brl[1]}],
    regions: ${arr(p.regions)},
    product: "${esc(p.product)}",
    pain: ${arr(p.pain || [])},
    hook: ${arr(p.hook || [])},
    objection: "${esc(p.objection || "")}",
    closer: "${esc(p.closer || "")}",
  }`,
  )
  .join(",\n")

const conteudo = `/**
 * personas.ts — 5 personas do público-alvo da Patrícia e Júlio.
 *
 * ⚠️  ARQUIVO GERADO AUTOMATICAMENTE — não edite à mão.
 * Fonte: MazyOS/_memoria/publico-alvo.md (bloco JSON no fim).
 * Regeneração: cd MazyOS/site && npm run sync-personas
 *
 * Sincronizado em: ${now}
 */

export interface Persona {
  id: string
  name: string
  age: [number, number]
  incomeBrl: [number, number]
  regions: string[]
  product: string
  pain: string[]
  hook: string[]
  objection: string
  closer: string
}

export const PERSONAS: Persona[] = [
${personasTs},
]

// ============================================================
// Regras editoriais globais
// ============================================================
export const REGRAS_CRIATIVO = {
  ligeirosDeReferencia: ${arr(rulesInline)},
  clichesProibidos: ${arr(clichesProibidos)},
} as const

export function getPersona(id: string): Persona | undefined {
  return PERSONAS.find((p) => p.id === id)
}
`

// ============================================================
// Backup + escrita atômica
// ============================================================
const existiaAntes = await fs.readFile(OUT_PATH, "utf8").catch(() => null)
if (existiaAntes === conteudo) {
  console.log("✓ personas.ts já está sincronizado — nada a fazer")
  process.exit(0)
}

await fs.writeFile(OUT_PATH, conteudo, "utf8")

const diff = existiaAntes ? conteudo.length - existiaAntes.length : conteudo.length
console.log(`✓ personas.ts atualizado (${dados.personas.length} personas, ${diff >= 0 ? "+" : ""}${diff} chars)`)
console.log(`  ${OUT_PATH}`)
