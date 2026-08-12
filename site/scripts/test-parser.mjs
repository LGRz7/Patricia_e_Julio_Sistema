/**
 * test-parser.mjs — smoke test do marketing-parser.
 * Valida heurísticas principais sem precisar do browser.
 *
 * Executar: node --experimental-vm-modules scripts/test-parser.mjs
 * (ou apenas: node scripts/test-parser.mjs — usa ESM)
 */

import { fileURLToPath, pathToFileURL } from "node:url"
import { readFileSync } from "node:fs"
import path from "node:path"
import * as ts from "typescript"

const parserPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "lib",
  "painel",
  "marketing-parser.ts",
)

// Compila o TS pra JS in-memory e importa
const src = readFileSync(parserPath, "utf8")
const jsSrc = ts.transpileModule(src, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
    esModuleInterop: true,
    isolatedModules: true,
  },
}).outputText

// Remove imports type-only (não afetam runtime)
const cleaned = jsSrc.replace(/^import type .*$/gm, "").replace(/^import \{[^}]*\}\s+from\s+"@\/types\/marketing";?$/gm, "")

// Salva num tmp e importa
import os from "node:os"
import { writeFileSync } from "node:fs"
const tmpFile = path.join(os.tmpdir(), `parser-${Date.now()}.mjs`)
writeFileSync(tmpFile, cleaned)
const mod = await import(pathToFileURL(tmpFile).href)
const analisarPedidoLivre = mod.analisarPedidoLivre

// ============================================================
// Casos de teste
// ============================================================
const CASOS = [
  {
    nome: "Imóvel destaque · preço em mil + área em m²",
    entrada: {
      tipo: "post",
      texto: "vista permanente em Icaraí, 620 mil, 2 quartos, 78m², 1 vaga",
      personaId: "upgrade-familiar",
    },
    espera: {
      templateId: "imovel-destaque",
      dados: {
        bairro: "Icaraí",
        gancho: "Vista permanente",
        preco: "620000",
      },
    },
  },
  {
    nome: "Imóvel destaque · preço em milhões",
    entrada: {
      tipo: "post",
      texto: "cobertura duplex em Piratininga, 1.2 milhões, 3 quartos, 140m²",
      personaId: "upgrade-familiar",
    },
    espera: {
      templateId: "imovel-destaque",
      dados: {
        bairro: "Piratininga",
        preco: "1200000",
      },
    },
  },
  {
    nome: "Prestação vs Aluguel",
    entrada: {
      tipo: "post",
      texto: "aluguel 2500 vs prestação 2100 em Fonseca, financiamento com FGTS",
      personaId: "primeira-compra-consciente",
    },
    espera: {
      templateId: "prestacao-vs-aluguel",
      dados: {
        bairro: "Fonseca",
        aluguel: "2500",
        prestacao: "2100",
      },
    },
  },
  {
    nome: "Guia de Bairro (migrante)",
    entrada: {
      tipo: "post",
      texto: "3 coisas que ninguém te conta sobre morar em Icaraí",
      personaId: "migrante-rio-niteroi",
    },
    espera: {
      templateId: "guia-bairro",
      dados: {
        bairro: "Icaraí",
      },
    },
  },
  {
    nome: "Story",
    entrada: {
      tipo: "story",
      texto: "novo lançamento em Itaipuaçu, 350 mil, entrega em 18 meses",
      personaId: "investidor-marica",
    },
    espera: {
      templateId: "story-foto-grande",
      dados: {
        bairro: "Itaipuaçu",
        gancho: "Novo lançamento",
      },
    },
  },
  {
    nome: "Reels usa story-foto-grande com aviso",
    entrada: {
      tipo: "reels",
      texto: "roteiro sobre financiar imóvel usando FGTS",
      personaId: "primeira-compra-consciente",
    },
    espera: {
      templateId: "story-foto-grande",
    },
  },
  {
    nome: "Preço bruto (sem 'mil')",
    entrada: {
      tipo: "post",
      texto: "apartamento em Ingá por 780000, 3 quartos",
      personaId: "upgrade-familiar",
    },
    espera: {
      templateId: "imovel-destaque",
      dados: {
        bairro: "Ingá",
        preco: "780000",
      },
    },
  },
  {
    nome: "Preço com R$ formatado",
    entrada: {
      tipo: "post",
      texto: "duplex em Camboinhas R$ 1.850.000",
      personaId: "segunda-casa-praia",
    },
    espera: {
      templateId: "imovel-destaque",
      dados: {
        bairro: "Camboinhas",
        preco: "1850000",
      },
    },
  },
]

// ============================================================
// Runner
// ============================================================
let passaram = 0
let falharam = 0

for (const caso of CASOS) {
  const resultado = analisarPedidoLivre(caso.entrada)
  const problemas = []

  if (resultado.templateId !== caso.espera.templateId) {
    problemas.push(`templateId: esperado ${caso.espera.templateId}, got ${resultado.templateId}`)
  }

  if (caso.espera.dados) {
    for (const [k, v] of Object.entries(caso.espera.dados)) {
      const got = resultado.dados[k] || ""
      if (String(got).trim() !== String(v).trim()) {
        problemas.push(`dados.${k}: esperado "${v}", got "${got}"`)
      }
    }
  }

  if (problemas.length === 0) {
    console.log(`✓ ${caso.nome}`)
    passaram++
  } else {
    console.log(`✗ ${caso.nome}`)
    for (const p of problemas) console.log(`   ${p}`)
    console.log(`   → resultado completo: ${JSON.stringify(resultado.dados)}`)
    console.log(`   → explicacao: ${resultado.explicacao}`)
    falharam++
  }
}

console.log(`\n${passaram} passou · ${falharam} falhou · ${passaram + falharam} total`)
process.exit(falharam > 0 ? 1 : 0)
