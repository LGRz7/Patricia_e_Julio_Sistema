import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { revalidatePath, revalidateTag } from "next/cache"
import { COOKIE_NAME, verificarSessionToken } from "@/lib/painel/auth"
import { getImoveisMerged, getPublicados, savePublicados, upsertImovel } from "@/lib/painel/imoveis-store.server"
import type { Imovel } from "@/types/imovel"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET público — lista todos (base + publicados). */
export async function GET() {
  const list = await getImoveisMerged()
  return NextResponse.json({ imoveis: list })
}

/** POST autenticado — cria ou atualiza (upsert por slug). */
export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value
  const user = token ? await verificarSessionToken(token) : null
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 })

  let body: Partial<Imovel>
  try { body = await req.json() } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }) }

  if (!body.slug || !body.titulo || !body.localizacao) {
    return NextResponse.json({ error: "slug, titulo e localizacao são obrigatórios" }, { status: 400 })
  }

  // Preenche defaults
  const imovel: Imovel = {
    slug: body.slug,
    titulo: body.titulo,
    localizacao: body.localizacao,
    valor: body.valor ?? null,
    tipo: body.tipo ?? "apartamento",
    status: body.status ?? "disponivel",
    resumo: body.resumo ?? "",
    descricao: body.descricao ?? "",
    diferenciais: Array.isArray(body.diferenciais) ? body.diferenciais : [],
    imagens: Array.isArray(body.imagens) ? body.imagens : [],
    responsavel: body.responsavel ?? "patricia",
    quartos: body.quartos,
    suites: body.suites,
    banheiros: body.banheiros,
    vagas: body.vagas,
    area: body.area,
    condominio: body.condominio,
    maisFotosNoWhatsapp: body.maisFotosNoWhatsapp,
    exemplo: false,
  }

  const saved = await upsertImovel(imovel)

  // Revalida rotas públicas que consomem imóveis
  try {
    revalidatePath("/")
    revalidatePath("/imoveis")
    revalidatePath(`/imoveis/${saved.slug}`)
    revalidateTag("imoveis")
  } catch {}

  return NextResponse.json({ imovel: saved, updatedBy: user.nome }, { status: 200 })
}
