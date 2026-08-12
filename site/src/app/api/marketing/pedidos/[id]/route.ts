import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { COOKIE_NAME, verificarSessionToken } from "@/lib/painel/auth"
import { getPedido, updatePedido, deletePedido } from "@/lib/painel/marketing-store.server"
import type { PedidoCriativo } from "@/types/marketing"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface Ctx { params: { id: string } }

export async function GET(_req: Request, { params }: Ctx) {
  const token = cookies().get(COOKIE_NAME)?.value
  const user = token ? await verificarSessionToken(token) : null
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 })

  const pedido = await getPedido(params.id)
  if (!pedido) return NextResponse.json({ error: "não encontrado" }, { status: 404 })
  return NextResponse.json({ pedido })
}

export async function PUT(req: Request, { params }: Ctx) {
  const token = cookies().get(COOKIE_NAME)?.value
  const user = token ? await verificarSessionToken(token) : null
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 })

  let patch: Partial<PedidoCriativo>
  try { patch = await req.json() }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }) }

  const updated = await updatePedido(params.id, patch)
  if (!updated) return NextResponse.json({ error: "não encontrado" }, { status: 404 })
  return NextResponse.json({ pedido: updated, updatedBy: user.nome })
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const token = cookies().get(COOKIE_NAME)?.value
  const user = token ? await verificarSessionToken(token) : null
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 })

  const ok = await deletePedido(params.id)
  if (!ok) return NextResponse.json({ error: "não encontrado" }, { status: 404 })
  return NextResponse.json({ removido: true, deletedBy: user.nome })
}
