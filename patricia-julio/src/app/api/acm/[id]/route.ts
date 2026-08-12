import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { COOKIE_NAME, verificarSessionToken } from "@/lib/painel/auth"
import { getAcm, updateAcm, deleteAcm } from "@/lib/painel/acm-store.server"
import { computeSugestao } from "@/lib/painel/acm-calc"
import type { ACM } from "@/types/acm"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface Ctx { params: { id: string } }

/** GET autenticado — detalhe. */
export async function GET(_req: Request, { params }: Ctx) {
  const token = cookies().get(COOKIE_NAME)?.value
  const user = token ? await verificarSessionToken(token) : null
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 })

  const acm = await getAcm(params.id)
  if (!acm) return NextResponse.json({ error: "não encontrada" }, { status: 404 })
  return NextResponse.json({ acm })
}

/** PUT autenticado — atualiza (recalcula sugestão automaticamente se amostras/alvo mudarem). */
export async function PUT(req: Request, { params }: Ctx) {
  const token = cookies().get(COOKIE_NAME)?.value
  const user = token ? await verificarSessionToken(token) : null
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 })

  let patch: Partial<ACM>
  try { patch = await req.json() } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }) }

  // Se o cliente mandou alvo, amostras ou cenários, recalcula
  const cenariosNoPatch = Array.isArray(patch.calculo?.cenariosAtivos) ? patch.calculo!.cenariosAtivos! : undefined
  if (patch.imovelAlvo || patch.amostras || cenariosNoPatch !== undefined) {
    const current = await getAcm(params.id)
    if (!current) return NextResponse.json({ error: "não encontrada" }, { status: 404 })
    const alvo = patch.imovelAlvo || current.imovelAlvo
    const amostras = patch.amostras || current.amostras
    const cenariosAtivos = cenariosNoPatch !== undefined ? cenariosNoPatch : current.calculo.cenariosAtivos
    patch.calculo = computeSugestao(alvo, amostras, cenariosAtivos)
  }

  const updated = await updateAcm(params.id, patch)
  if (!updated) return NextResponse.json({ error: "não encontrada" }, { status: 404 })
  return NextResponse.json({ acm: updated, updatedBy: user.nome })
}

/** DELETE autenticado. */
export async function DELETE(_req: Request, { params }: Ctx) {
  const token = cookies().get(COOKIE_NAME)?.value
  const user = token ? await verificarSessionToken(token) : null
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 })

  const ok = await deleteAcm(params.id)
  if (!ok) return NextResponse.json({ error: "não encontrada" }, { status: 404 })
  return NextResponse.json({ removido: true, deletedBy: user.nome })
}
