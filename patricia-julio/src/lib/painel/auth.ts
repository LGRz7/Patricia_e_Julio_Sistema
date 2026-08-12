/**
 * auth.ts — autenticação do painel.
 *
 * Ordem de resolução da senha (na ordem — primeiro que casar):
 *   1. PROD/HARDENED: PAINEL_SENHA_PATRICIA_HASH / PAINEL_SENHA_JULIO_HASH (bcrypt)
 *   2. DEV: PAINEL_SENHA_PATRICIA / PAINEL_SENHA_JULIO (texto puro — só usar local)
 *   3. Sem envs configuradas: NEGA todo login (falha explícita, não abre a porta)
 *
 * Em produção, marque o dev-mode como travado setando `PAINEL_DEV_LOGIN=off` OU
 * simplesmente deixando as senhas em texto puro fora do env. Prefira sempre HASH.
 *
 * Sessão em JWT (jose) num cookie httpOnly de 7 dias.
 */
import "server-only"
import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"
import { profissionais } from "@/data/profissionais"

export interface Usuario {
  id: string
  nome: string
  email: string
  papel: "patricia" | "julio"
}

// ============================================================
// Config
// ============================================================
const JWT_ALG = "HS256"
const JWT_TTL = "7d"
export const COOKIE_NAME = "pj_painel_session"

function getJwtSecret(): Uint8Array {
  const secret = process.env.PAINEL_JWT_SECRET || process.env.JWT_SECRET
  if (!secret || secret.length < 24) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("PAINEL_JWT_SECRET não configurado (mínimo 24 chars)")
    }
    console.warn("[auth] usando JWT_SECRET fallback dev — DEFINA PAINEL_JWT_SECRET em produção!")
    return new TextEncoder().encode("pj-dev-secret-please-change-me-in-prod-32chars")
  }
  return new TextEncoder().encode(secret)
}

// ============================================================
// Identifica papel a partir do login (email ou username)
// ============================================================
function identificarPapel(loginBruto: string): "patricia" | "julio" | null {
  const q = loginBruto.trim().toLowerCase()
  if (!q) return null

  // Match direto por username
  if (q === "patricia" || q.startsWith("patricia@") || /patricia|vidal/i.test(q)) return "patricia"
  if (q === "julio" || q.startsWith("julio@") || /jul|aguiar/i.test(q)) return "julio"
  return null
}

// ============================================================
// Verifica senha — bcrypt hash > texto plano dev > nega
// ============================================================
export async function verificarSenha(loginBruto: string, senha: string): Promise<Usuario | null> {
  const q = loginBruto?.trim()
  if (!q || !senha) return null

  const papel = identificarPapel(q)
  if (!papel) return null

  // 1) HASH (produção)
  const hashEnv = papel === "patricia"
    ? process.env.PAINEL_SENHA_PATRICIA_HASH
    : process.env.PAINEL_SENHA_JULIO_HASH

  if (hashEnv && hashEnv.startsWith("$2")) {
    let ok = false
    try { ok = await bcrypt.compare(senha, hashEnv) }
    catch { ok = false }
    if (!ok) return null
    return montarUsuario(papel, q)
  }

  // 2) TEXTO PLANO (dev). Bloqueado em produção.
  const senhaDevEnv = papel === "patricia"
    ? process.env.PAINEL_SENHA_PATRICIA
    : process.env.PAINEL_SENHA_JULIO
  const devLoginTravado = process.env.PAINEL_DEV_LOGIN === "off"
  const emProd = process.env.NODE_ENV === "production"

  if (senhaDevEnv && !devLoginTravado && !emProd) {
    if (senha !== senhaDevEnv) return null
    console.warn(`[auth] login DEV com senha em texto — configure PAINEL_SENHA_${papel.toUpperCase()}_HASH em produção`)
    return montarUsuario(papel, q)
  }

  // 3) Nem hash nem dev: NEGA
  console.warn(`[auth] sem credencial configurada pro papel "${papel}" — defina PAINEL_SENHA_${papel.toUpperCase()}_HASH`)
  return null
}

function montarUsuario(papel: "patricia" | "julio", loginQ: string): Usuario {
  const perfil = profissionais.find((p) => p.id === papel)
  return {
    id: papel,
    nome: perfil?.nome || (papel === "julio" ? "Júlio Aguiar" : "Patrícia Vidal"),
    email: loginQ.includes("@") ? loginQ : `${papel}@corretores`,
    papel,
  }
}

// ============================================================
// Sessão JWT
// ============================================================
export async function criarSessionToken(u: Usuario): Promise<string> {
  return await new SignJWT({ id: u.id, nome: u.nome, email: u.email, papel: u.papel })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(JWT_TTL)
    .setSubject(u.id)
    .sign(getJwtSecret())
}

export async function verificarSessionToken(token: string): Promise<Usuario | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), { algorithms: [JWT_ALG] })
    return {
      id: String(payload.id || payload.sub || ""),
      nome: String(payload.nome || ""),
      email: String(payload.email || ""),
      papel: (payload.papel as Usuario["papel"]) || "patricia",
    }
  } catch {
    return null
  }
}

// ============================================================
// Config do cookie
// ============================================================
export function cookieOptions(remember = true) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: remember ? 60 * 60 * 24 * 7 : undefined,
  }
}

// ============================================================
// Rate limit simples (in-memory) contra brute-force
// Suficiente pra painel interno com 2 usuários. Se escalar, trocar por Redis.
// ============================================================
const tentativas = new Map<string, { count: number; primeiroEm: number }>()
const JANELA_MS = 15 * 60 * 1000       // 15 min
const MAX_TENTATIVAS = 8               // 8 falhas em 15 min → bloqueia
const BLOQUEIO_MS = 30 * 60 * 1000     // depois trava por 30 min

export function checarRateLimit(chave: string): { permitido: boolean; segundosRestantes?: number } {
  const agora = Date.now()
  const reg = tentativas.get(chave)
  if (!reg) return { permitido: true }

  if (agora - reg.primeiroEm > JANELA_MS + BLOQUEIO_MS) {
    tentativas.delete(chave)
    return { permitido: true }
  }
  if (reg.count >= MAX_TENTATIVAS) {
    const passou = agora - reg.primeiroEm
    if (passou < JANELA_MS + BLOQUEIO_MS) {
      const segundosRestantes = Math.ceil((JANELA_MS + BLOQUEIO_MS - passou) / 1000)
      return { permitido: false, segundosRestantes }
    }
  }
  return { permitido: true }
}

export function registrarFalha(chave: string) {
  const agora = Date.now()
  const reg = tentativas.get(chave)
  if (!reg || agora - reg.primeiroEm > JANELA_MS) {
    tentativas.set(chave, { count: 1, primeiroEm: agora })
    return
  }
  reg.count++
}

export function registrarSucesso(chave: string) {
  tentativas.delete(chave)
}
