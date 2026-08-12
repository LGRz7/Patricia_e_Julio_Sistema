#!/usr/bin/env node
/**
 * gerar-hash.mjs — gera hash bcrypt pra o env var de senha do painel.
 *
 * Uso:
 *   node scripts/gerar-hash.mjs "MinhaSenh@123"
 *
 * Output: linha pra colar direto no .env / Vercel dashboard:
 *   PAINEL_SENHA_PATRICIA_HASH=$2a$12$Xy...
 *
 * Segurança: rodar SÓ local, nunca em CI/logs. O hash em si pode ser commitado
 * em vars de ambiente da Vercel — bcrypt é lento e não reversa.
 */
import bcrypt from "bcryptjs"

const senha = process.argv[2]
if (!senha) {
  console.error("Uso: node scripts/gerar-hash.mjs \"minhaSenha\"")
  console.error("")
  console.error("Depois copie o hash pra a Vercel:")
  console.error("  PAINEL_SENHA_PATRICIA_HASH=<hash gerado>")
  console.error("  PAINEL_SENHA_JULIO_HASH=<hash gerado>")
  process.exit(1)
}

if (senha.length < 8) {
  console.error("Senha muito curta (mínimo 8 caracteres).")
  process.exit(1)
}

const rounds = 12  // ~250ms por hash — bom trade-off
const hash = await bcrypt.hash(senha, rounds)

console.log("")
console.log("✓ Hash gerado (bcrypt, 12 rounds).")
console.log("")
console.log("Cole em uma linha do .env (ou variável de ambiente da Vercel):")
console.log("")
console.log("  PAINEL_SENHA_PATRICIA_HASH=" + hash)
console.log("      (ou)")
console.log("  PAINEL_SENHA_JULIO_HASH=" + hash)
console.log("")
console.log("Depois de configurar, remova as variáveis PAINEL_SENHA_PATRICIA / PAINEL_SENHA_JULIO em texto puro.")
