import { NextResponse } from "next/server"
import { headers } from "next/headers"
import {
  verificarSenha, criarSessionToken, cookieOptions, COOKIE_NAME,
  checarRateLimit, registrarFalha, registrarSucesso,
} from "@/lib/painel/auth"

export const runtime = "nodejs"

export async function POST(req: Request) {
  let body: { email?: string; senha?: string; remember?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const email = body.email?.trim()
  const senha = body.senha?.trim()
  if (!email || !senha) {
    return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
  }

  // Rate limit por IP + email (evita brute-force sem bloquear usuário legítimo em rede compartilhada)
  const h = headers()
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown"
  const chave = `${ip}|${email.toLowerCase()}`

  const rate = checarRateLimit(chave)
  if (!rate.permitido) {
    return NextResponse.json(
      { error: `Muitas tentativas. Tente de novo em ${Math.ceil((rate.segundosRestantes || 0) / 60)} min.` },
      { status: 429 },
    )
  }

  const user = await verificarSenha(email, senha)
  if (!user) {
    registrarFalha(chave)
    // Delay artificial pra dificultar timing attack
    await new Promise((r) => setTimeout(r, 400))
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
  }

  registrarSucesso(chave)
  const token = await criarSessionToken(user)
  const res = NextResponse.json({ user })
  res.cookies.set(COOKIE_NAME, token, cookieOptions(body.remember !== false))
  return res
}
