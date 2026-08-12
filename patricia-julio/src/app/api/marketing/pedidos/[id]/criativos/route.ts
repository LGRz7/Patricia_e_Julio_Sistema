import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { randomUUID } from "crypto"
import { COOKIE_NAME, verificarSessionToken } from "@/lib/painel/auth"
import { verificarAdmin, autor } from "@/lib/painel/admin-auth"
import { getPedido, updatePedido } from "@/lib/painel/marketing-store.server"
import type { Criativo, PedidoCriativo, StatusPedido, TipoCriativo } from "@/types/marketing"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface Ctx { params: { id: string } }

interface AnexarCriativosBody {
  criativos: {
    tipo?: TipoCriativo
    titulo: string
    legendaSugerida?: string
    hashtags?: string[]
    arquivoUrl?: string
    thumbnailUrl?: string
  }[]
  /** Opcional: força um status novo (default: "pronto"). */
  status?: StatusPedido
  /** Se true, substitui os criativos existentes. Default: append. */
  substituir?: boolean
}

/**
 * POST /api/marketing/pedidos/[id]/criativos
 *
 * Anexa criativo(s) a um pedido pendente. Usado pelo Yann (via admin token)
 * pra entregar o output do MazyOS pro corretor ver no painel.
 *
 * Auth aceita:
 *   - Session cookie JWT (corretor ou Yann logado como corretor)
 *   - Bearer token: `Authorization: Bearer $PAINEL_ADMIN_TOKEN` (Yann de fora)
 */
export async function POST(req: Request, { params }: Ctx) {
  const token = cookies().get(COOKIE_NAME)?.value
  const user = token ? await verificarSessionToken(token) : null
  const admin = verificarAdmin(req)
  const a = autor(user, admin)
  if (!a.autorizado) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 })
  }

  let body: AnexarCriativosBody
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }) }

  if (!Array.isArray(body.criativos) || body.criativos.length === 0) {
    return NextResponse.json({ error: "criativos[] é obrigatório" }, { status: 400 })
  }

  const pedido = await getPedido(params.id)
  if (!pedido) return NextResponse.json({ error: "pedido não encontrado" }, { status: 404 })

  // Normaliza cada criativo
  const nowIso = new Date().toISOString()
  const novos: Criativo[] = body.criativos.map((c) => {
    if (!c?.titulo) throw new Error("cada criativo precisa de titulo")
    return {
      id: randomUUID(),
      tipo: c.tipo || pedido.tipo,
      titulo: c.titulo,
      legendaSugerida: c.legendaSugerida,
      hashtags: Array.isArray(c.hashtags) ? c.hashtags.slice(0, 30) : undefined,
      arquivoUrl: c.arquivoUrl,
      thumbnailUrl: c.thumbnailUrl,
      criadoEm: nowIso,
    }
  })

  const anteriores = pedido.criativos || []
  const merged: Criativo[] = body.substituir ? novos : [...anteriores, ...novos]

  const patch: Partial<PedidoCriativo> = {
    criativos: merged,
    status: body.status || "pronto",
  }
  const atualizado = await updatePedido(params.id, patch)
  if (!atualizado) return NextResponse.json({ error: "falha ao atualizar" }, { status: 500 })

  return NextResponse.json({
    pedido: atualizado,
    criativosAdicionados: novos.length,
    total: merged.length,
    autor: a,
  })
}
