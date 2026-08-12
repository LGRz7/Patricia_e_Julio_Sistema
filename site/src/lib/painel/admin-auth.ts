/**
 * admin-auth.ts — autorização pra endpoints administrativos.
 *
 * O corretor autentica via JWT em cookie (fluxo normal).
 * O Yann (que opera de fora — via curl / MazyOS) autentica via bearer token
 * lido do env `PAINEL_ADMIN_TOKEN`. Sem esse env, endpoints admin ficam
 * inacessíveis (fail-closed).
 *
 * Uso nas rotas:
 *   const admin = await verificarAdmin(req)
 *   if (!admin && !user) → 401
 */
import "server-only"
import type { Usuario } from "./auth"

export interface AdminSession {
  papel: "admin"
  fonte: "token"
}

const MIN_TOKEN_LEN = 24

/**
 * Verifica se o request traz `Authorization: Bearer <PAINEL_ADMIN_TOKEN>`.
 * Retorna a "sessão admin" ou null.
 */
export function verificarAdmin(req: Request): AdminSession | null {
  const tokenEnv = process.env.PAINEL_ADMIN_TOKEN
  if (!tokenEnv || tokenEnv.length < MIN_TOKEN_LEN) return null

  const auth = req.headers.get("authorization") || req.headers.get("Authorization")
  if (!auth) return null
  const m = auth.match(/^Bearer\s+(.+)$/i)
  if (!m) return null
  const token = m[1].trim()
  if (token !== tokenEnv) return null
  return { papel: "admin", fonte: "token" }
}

/**
 * Helper: aceita qualquer um (user via JWT OU admin via bearer).
 * Retorna qual autenticou pra logs / auditoria.
 */
export function autor(
  user: Usuario | null,
  admin: AdminSession | null,
): { autorizado: boolean; papel: string; fonte: "jwt" | "token" | null } {
  if (admin) return { autorizado: true, papel: "admin", fonte: "token" }
  if (user) return { autorizado: true, papel: user.papel, fonte: "jwt" }
  return { autorizado: false, papel: "anon", fonte: null }
}
