import { NextResponse, type NextRequest } from "next/server"
import { jwtVerify } from "jose"

const COOKIE_NAME = "pj_painel_session"

function getSecret(): Uint8Array {
  const secret = process.env.PAINEL_JWT_SECRET || process.env.JWT_SECRET
  if (!secret || secret.length < 24) {
    if (process.env.NODE_ENV === "production") throw new Error("PAINEL_JWT_SECRET não configurado")
    return new TextEncoder().encode("pj-dev-secret-please-change-me-in-prod-32chars")
  }
  return new TextEncoder().encode(secret)
}

async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false
  try {
    await jwtVerify(token, getSecret(), { algorithms: ["HS256"] })
    return true
  } catch {
    return false
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Só protege /painel/*
  if (!pathname.startsWith("/painel")) return NextResponse.next()

  const token = req.cookies.get(COOKIE_NAME)?.value
  const autenticado = await isValidSession(token)

  // /painel/login: se já tá logado, manda pro destino solicitado (ou /painel).
  // Isso mata o "piscar" que existia quando o useEffect do form fazia o redirect só depois de hidratar.
  if (pathname === "/painel/login" || pathname.startsWith("/painel/login/")) {
    if (autenticado) {
      const url = req.nextUrl.clone()
      const next = req.nextUrl.searchParams.get("next")
      url.pathname = next && next.startsWith("/painel") ? next : "/painel"
      url.search = ""
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // Rotas autenticadas: exige sessão válida
  if (autenticado) return NextResponse.next()

  // Redireciona pro login preservando destino
  const url = req.nextUrl.clone()
  url.pathname = "/painel/login"
  url.searchParams.set("next", pathname + (req.nextUrl.search || ""))
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/painel/:path*"],
}
