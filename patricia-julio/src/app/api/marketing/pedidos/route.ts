import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { COOKIE_NAME, verificarSessionToken } from "@/lib/painel/auth"
import { listPedidos, createPedido } from "@/lib/painel/marketing-store.server"
import { getPersona } from "@/data/painel/personas"
import type { PedidoCriativo, FormatoPost } from "@/types/marketing"

const FORMATOS_VALIDOS: FormatoPost[] = ["corretores", "imovel", "copy"]

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const token = cookies().get(COOKIE_NAME)?.value
  const user = token ? await verificarSessionToken(token) : null
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 })

  const pedidos = await listPedidos()
  return NextResponse.json({ pedidos })
}

export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value
  const user = token ? await verificarSessionToken(token) : null
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 })

  let body: Partial<PedidoCriativo>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }) }

  if (!body.personaId) return NextResponse.json({ error: "personaId é obrigatório" }, { status: 400 })
  if (!body.tipo) return NextResponse.json({ error: "tipo é obrigatório" }, { status: 400 })
  if (!body.gancho || !body.gancho.trim()) return NextResponse.json({ error: "gancho é obrigatório" }, { status: 400 })

  if (!getPersona(body.personaId)) {
    return NextResponse.json({ error: `persona não encontrada: ${body.personaId}` }, { status: 400 })
  }

  // Formato — opcional (pra compat com pedidos antigos), mas se vier tem que ser válido.
  if (body.formato && !FORMATOS_VALIDOS.includes(body.formato)) {
    return NextResponse.json({ error: `formato inválido: ${body.formato}` }, { status: 400 })
  }
  // Se formato = "imovel", exige o slug do imóvel escolhido.
  if (body.formato === "imovel" && !body.imovelSlug) {
    return NextResponse.json({ error: 'formato "imovel" precisa de imovelSlug' }, { status: 400 })
  }

  const pedido = await createPedido({
    status: body.status || "pendente",
    personaId: body.personaId,
    tipo: body.tipo,
    formato: body.formato,
    imovelSlug: body.formato === "imovel" ? body.imovelSlug : undefined,
    bairro: body.bairro,
    faixaPreco: body.faixaPreco,
    gancho: body.gancho.trim(),
    briefing: body.briefing,
    prazo: body.prazo,
    criadoPor: user.papel,
  })

  return NextResponse.json({ pedido, createdBy: user.nome }, { status: 201 })
}
