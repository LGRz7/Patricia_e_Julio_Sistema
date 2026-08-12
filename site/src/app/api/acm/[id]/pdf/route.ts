import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { renderToBuffer } from "@react-pdf/renderer"
import React from "react"
import { COOKIE_NAME, verificarSessionToken } from "@/lib/painel/auth"
import { getAcm } from "@/lib/painel/acm-store.server"
import { AcmPdfDocument } from "@/lib/painel/acm-pdf/document"
import { slugifyApelido } from "@/lib/painel/acm-calc"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/acm/[id]/pdf — retorna o PDF da ACM.
 * Query: ?inline=1 abre no navegador em vez de baixar.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const token = cookies().get(COOKIE_NAME)?.value
  const user = token ? await verificarSessionToken(token) : null
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 })

  const acm = await getAcm(params.id)
  if (!acm) return NextResponse.json({ error: "não encontrada" }, { status: 404 })

  const url = new URL(req.url)
  const inline = url.searchParams.get("inline") === "1"

  let buffer: Buffer
  try {
    // renderToBuffer aceita um Element React
    buffer = await renderToBuffer(React.createElement(AcmPdfDocument, { acm }) as any)
  } catch (e) {
    console.error("[acm-pdf] falha ao renderizar:", e)
    return NextResponse.json({ error: "falha ao gerar PDF", detail: (e as Error).message }, { status: 500 })
  }

  const filename = `ACM_${slugifyApelido(acm.imovelAlvo.apelido || acm.slug)}.pdf`
  const disposition = inline ? `inline; filename="${filename}"` : `attachment; filename="${filename}"`

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(buffer.length),
      "Content-Disposition": disposition,
      "Cache-Control": "private, no-store",
    },
  })
}
