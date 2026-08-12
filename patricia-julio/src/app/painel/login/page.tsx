"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { AlertCircle, Home, Lock, Mail, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react"
import { site } from "@/data/site"

// Wrapper obrigatório pra useSearchParams poder ser prerenderizado (Next 14)
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[100svh] bg-beige" />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next") || "/painel"

  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [remember, setRemember] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Nota: o redirect quando já autenticado é feito no middleware (src/middleware.ts).
  // Antes tinha um useEffect fazendo fetch em /api/auth/me — foi removido pra eliminar
  // o "piscar" que aparecia entre a hidratação e a navegação.

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !senha) return
    setEnviando(true)
    setErro(null)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha, remember }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data?.error || "Falha ao entrar")
        setEnviando(false)
        return
      }
      // Ok — vai pro destino
      router.replace(next)
      router.refresh()
    } catch (err) {
      setErro("Falha de rede: " + (err as Error).message)
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-[100svh] bg-beige flex flex-col relative overflow-hidden">
      {/* Ornamentos de fundo */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-30" style={{ background: "radial-gradient(circle, rgba(86,124,141,0.35), transparent 65%)" }} />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[560px] h-[560px] rounded-full opacity-25" style={{ background: "radial-gradient(circle, rgba(200,217,230,0.6), transparent 65%)" }} />

      {/* Top nav */}
      <header className="relative z-10 px-5 lg:px-10 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-navy hover:text-teal transition-colors">
          <ArrowLeft size={14} />
          <span className="text-[12px] font-medium">Voltar ao site</span>
        </Link>
        <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal">Painel Interno</span>
      </header>

      {/* Card central */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-[420px]">
          {/* Logo/mark */}
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 rounded-2xl grid place-items-center mb-4 shadow-lg" style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)", boxShadow: "0 20px 40px -10px rgba(47,65,86,0.4)" }}>
              <Home size={22} className="text-beige" strokeWidth={2} />
            </div>
            <h1 className="font-display text-[26px] font-bold text-navy tracking-tight leading-tight">Painel dos Corretores</h1>
            <p className="text-[12.5px] text-teal mt-1.5">Ferramenta interna · Patrícia & Júlio</p>
          </div>

          {/* Form card */}
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl bg-white border border-sky/60 p-6 lg:p-7 space-y-4"
            style={{ boxShadow: "0 30px 60px -18px rgba(47,65,86,0.25)" }}
          >
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-teal mb-1.5" htmlFor="email">
                Usuário ou email
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal pointer-events-none" />
                <input
                  id="email"
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patricia ou julio"
                  className="w-full h-12 pl-10 pr-3 rounded-xl bg-beige border border-sky text-navy text-[14px] outline-none focus:border-teal focus:ring-[3px] focus:ring-teal/15 transition-all"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-teal mb-1.5" htmlFor="senha">
                Senha
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal pointer-events-none" />
                <input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Sua senha"
                  className="w-full h-12 pl-10 pr-11 rounded-xl bg-beige border border-sky text-navy text-[14px] outline-none focus:border-teal focus:ring-[3px] focus:ring-teal/15 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-teal hover:text-navy"
                  tabIndex={-1}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-[12px] text-navy cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="accent-navy w-4 h-4"
              />
              Manter conectado por 7 dias neste dispositivo
            </label>

            {erro && (
              <div className="flex items-start gap-2 p-3 rounded-xl border" style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.25)" }}>
                <AlertCircle size={14} className="text-red-700 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-red-800 leading-relaxed">{erro}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={enviando || !email || !senha}
              className="w-full h-12 rounded-xl text-beige text-[13.5px] font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #2F4156, #567C8D)",
                boxShadow: "0 14px 28px -10px rgba(47,65,86,0.5)",
              }}
            >
              {enviando ? <Loader2 size={14} className="animate-spin" /> : null}
              {enviando ? "Entrando..." : "Entrar no painel"}
            </button>

            <p className="text-[11px] text-teal text-center leading-relaxed">
              Acesso restrito. Se esqueceu a senha, fale com quem administra o sistema.
            </p>
          </form>

          <p className="text-center text-[11px] text-navy/60 mt-6">
            {site.assinatura} · {site.regiao}
          </p>
        </div>
      </main>
    </div>
  )
}
