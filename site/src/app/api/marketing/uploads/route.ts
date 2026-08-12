import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { promises as fs } from "fs"
import path from "path"
import { randomUUID } from "crypto"
import { COOKIE_NAME, verificarSessionToken } from "@/lib/painel/auth"
import { verificarAdmin, autor } from "@/lib/painel/admin-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 30

/**
 * POST /api/marketing/uploads
 *
 * Sobe um arquivo (imagem/PDF/vídeo) e devolve URL pública.
 * Em produção: usa Vercel Blob (se BLOB_READ_WRITE_TOKEN existir).
 * Em dev: salva em `public/uploads/marketing/` e devolve caminho relativo.
 *
 * Body: multipart/form-data com campo `file` OU JSON com `dataUrl` + `nome`.
 * Auth: bearer admin token OU JWT session.
 */
export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value
  const user = token ? await verificarSessionToken(token) : null
  const admin = verificarAdmin(req)
  const a = autor(user, admin)
  if (!a.autorizado) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 })
  }

  // Detecta modo (multipart ou JSON)
  const ct = req.headers.get("content-type") || ""

  let arquivoBuffer: Buffer
  let nomeArquivo: string
  let contentType: string

  if (ct.startsWith("multipart/form-data")) {
    const form = await req.formData()
    const file = form.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "envie um arquivo no campo `file`" }, { status: 400 })
    }
    const buf = Buffer.from(await file.arrayBuffer())
    arquivoBuffer = buf
    nomeArquivo = file.name || `upload-${Date.now()}`
    contentType = file.type || "application/octet-stream"
  } else if (ct.startsWith("application/json")) {
    let body: { dataUrl?: string; nome?: string }
    try { body = await req.json() }
    catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }) }
    if (!body.dataUrl) return NextResponse.json({ error: "envie dataUrl OU multipart" }, { status: 400 })
    const m = body.dataUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (!m) return NextResponse.json({ error: "dataUrl inválido" }, { status: 400 })
    contentType = m[1]
    arquivoBuffer = Buffer.from(m[2], "base64")
    nomeArquivo = body.nome || `upload-${Date.now()}${extPorContentType(contentType)}`
  } else {
    return NextResponse.json({ error: "content-type não suportado (use multipart/form-data ou application/json)" }, { status: 415 })
  }

  // Sanitiza nome do arquivo
  const nomeSanitizado = sanitizarNome(nomeArquivo)
  const chave = `marketing/${new Date().toISOString().slice(0, 7)}/${randomUUID().slice(0, 8)}-${nomeSanitizado}`

  // Escolha do backend
  try {
    const tokenBlob = process.env.BLOB_READ_WRITE_TOKEN
    if (tokenBlob) {
      const { put } = await import("@vercel/blob")
      const uploaded = await put(chave, arquivoBuffer, {
        access: "public",
        contentType,
        allowOverwrite: false,
        token: tokenBlob,
      })
      return NextResponse.json({
        url: uploaded.url,
        pathname: uploaded.pathname,
        bytes: arquivoBuffer.length,
        contentType,
        storage: "vercel-blob",
        autor: a,
      })
    }
  } catch (e) {
    console.warn("[uploads] blob falhou:", (e as Error).message)
  }

  // Fallback: filesystem (dev)
  const destino = path.join(process.cwd(), "public", "uploads", chave)
  await fs.mkdir(path.dirname(destino), { recursive: true })
  await fs.writeFile(destino, arquivoBuffer)
  const urlPublica = `/uploads/${chave}`
  return NextResponse.json({
    url: urlPublica,
    pathname: chave,
    bytes: arquivoBuffer.length,
    contentType,
    storage: "filesystem",
    autor: a,
  })
}

// ============================================================
// Helpers
// ============================================================
function sanitizarNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
}
function extPorContentType(ct: string): string {
  const map: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "application/pdf": ".pdf",
    "video/mp4": ".mp4",
    "video/quicktime": ".mov",
  }
  return map[ct] || ""
}
