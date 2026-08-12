import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { COOKIE_NAME, verificarSessionToken } from "@/lib/painel/auth"
import { verificarAdmin, autor } from "@/lib/painel/admin-auth"
import { listAcms } from "@/lib/painel/acm-store.server"
import { listPedidos, getMeta } from "@/lib/painel/marketing-store.server"
import { getPublicados } from "@/lib/painel/imoveis-store.server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/admin/export
 *
 * Baixa um snapshot completo dos dados do painel em UM JSON.
 * Útil pra:
 *   - Backup periódico (Yann roda uma vez por mês)
 *   - Debug (mandar pro suporte com dados anonimizados)
 *   - Migração pra outra infra
 *
 * Auth: JWT session (corretor logado no browser) OU bearer admin token
 * Formato: `application/json` com Content-Disposition attachment
 */
export async function GET(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value
  const user = token ? await verificarSessionToken(token) : null
  const admin = verificarAdmin(req)
  const a = autor(user, admin)
  if (!a.autorizado) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 })
  }

  const url = new URL(req.url)
  const compacto = url.searchParams.get("compact") === "1"

  // Coleta em paralelo
  const [acms, pedidos, meta, imoveis] = await Promise.all([
    listAcms().catch(() => []),
    listPedidos().catch(() => []),
    getMeta().catch(() => null),
    getPublicados().catch(() => []),
  ])

  const payload = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    generator: "painel-corretores-export",
    exportedBy: { papel: a.papel, fonte: a.fonte },
    counts: {
      acms: acms.length,
      pedidosMarketing: pedidos.length,
      imoveisPublicados: imoveis.length,
    },
    data: {
      acm: acms,
      marketing: {
        meta,
        pedidos,
      },
      imoveisPublicados: imoveis,
    },
  }

  const json = compacto ? JSON.stringify(payload) : JSON.stringify(payload, null, 2)

  const filename = `painel-backup-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.json`
  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": String(Buffer.byteLength(json, "utf8")),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  })
}
