import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { revalidatePath, revalidateTag } from "next/cache"
import { COOKIE_NAME, verificarSessionToken } from "@/lib/painel/auth"
import { getImovelMerged, removeImovelPublicado } from "@/lib/painel/imoveis-store.server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface Ctx { params: { slug: string } }

/** GET público — imóvel por slug. */
export async function GET(_req: Request, { params }: Ctx) {
  const im = await getImovelMerged(params.slug)
  if (!im) return NextResponse.json({ error: "não encontrado" }, { status: 404 })
  return NextResponse.json({ imovel: im })
}

/** DELETE autenticado — remove APENAS da camada de publicados.
 * Se o slug existir apenas no data/imoveis.ts (base), a "remoção" não persiste
 * (a resposta indica isso). Pra remover da base, o dev tem que editar o arquivo TS.
 */
export async function DELETE(_req: Request, { params }: Ctx) {
  const token = cookies().get(COOKIE_NAME)?.value
  const user = token ? await verificarSessionToken(token) : null
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 })

  const ok = await removeImovelPublicado(params.slug)

  try {
    revalidatePath("/")
    revalidatePath("/imoveis")
    revalidatePath(`/imoveis/${params.slug}`)
    revalidateTag("imoveis")
  } catch {}

  return NextResponse.json({ removidoDaPublicacao: ok, deletedBy: user.nome })
}
