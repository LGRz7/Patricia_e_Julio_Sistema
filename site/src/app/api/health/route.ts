import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/health — marcador de versão pra confirmar qual deploy está no ar
 * e checar rapidamente se as env vars críticas estão configuradas na Vercel.
 * Não expõe valores secretos, só booleanos de presença.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    versao: "2026-08-19-oom-fix",
    env: {
      vercel: !!process.env.VERCEL,
      cloudflare: !!(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN),
      huggingface: !!process.env.HUGGINGFACE_API_TOKEN,
      openrouter: !!process.env.OPENROUTER_API_KEY,
      pollinations: !!process.env.POLLINATIONS_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      blob: !!process.env.BLOB_READ_WRITE_TOKEN,
      jwtSecret: !!process.env.PAINEL_JWT_SECRET,
    },
    ts: new Date().toISOString(),
  })
}
