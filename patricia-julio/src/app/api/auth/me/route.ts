import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { COOKIE_NAME, verificarSessionToken } from "@/lib/painel/auth"

export const runtime = "nodejs"

export async function GET() {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ user: null }, { status: 200 })
  const user = await verificarSessionToken(token)
  return NextResponse.json({ user }, { status: user ? 200 : 200 })
}
