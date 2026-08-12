import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { COOKIE_NAME, verificarSessionToken } from "@/lib/painel/auth"
import { listAcms, createAcm } from "@/lib/painel/acm-store.server"
import { computeSugestao, slugifyApelido } from "@/lib/painel/acm-calc"
import type { ACM, ImovelAlvoACM, AmostraACM } from "@/types/acm"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET autenticado — lista todas as ACMs. */
export async function GET() {
  const token = cookies().get(COOKIE_NAME)?.value
  const user = token ? await verificarSessionToken(token) : null
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 })

  const acms = await listAcms()
  return NextResponse.json({ acms })
}

/** POST autenticado — cria uma ACM. */
export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value
  const user = token ? await verificarSessionToken(token) : null
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 })

  let body: Partial<ACM>
  try { body = await req.json() } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }) }

  if (!body.imovelAlvo?.apelido) {
    return NextResponse.json({ error: "imovelAlvo.apelido é obrigatório" }, { status: 400 })
  }

  const imovelAlvo = body.imovelAlvo as ImovelAlvoACM
  const amostras: AmostraACM[] = Array.isArray(body.amostras) ? body.amostras : []
  const cenariosAtivos: string[] = Array.isArray(body.calculo?.cenariosAtivos)
    ? body.calculo!.cenariosAtivos!
    : []

  // Recalcula sugestão no servidor (nunca confiar no client pra número que vira PDF)
  const calculo = computeSugestao(imovelAlvo, amostras, cenariosAtivos)

  const slug = body.slug || slugifyApelido(imovelAlvo.apelido) || undefined

  const acm = await createAcm({
    slug,
    imovelAlvo,
    amostras,
    calculo,
    status: body.status || "rascunho",
    criadoPor: user.papel,
  })

  return NextResponse.json({ acm, createdBy: user.nome }, { status: 201 })
}
