import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { COOKIE_NAME, verificarSessionToken } from "@/lib/painel/auth"
import { getMeta, saveMeta } from "@/lib/painel/marketing-store.server"
import type { MetaSemanal } from "@/types/marketing"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const token = cookies().get(COOKIE_NAME)?.value
  const user = token ? await verificarSessionToken(token) : null
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 })

  const meta = await getMeta()
  return NextResponse.json({ meta })
}

export async function PUT(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value
  const user = token ? await verificarSessionToken(token) : null
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 })

  let patch: Partial<MetaSemanal>
  try { patch = await req.json() }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }) }

  const meta = await saveMeta(patch)
  return NextResponse.json({ meta, updatedBy: user.nome })
}
