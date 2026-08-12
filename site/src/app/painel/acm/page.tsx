"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Calculator, FileText, Plus, ArrowRight, TrendingUp, AlertCircle } from "lucide-react"
import { apiListAcms } from "@/lib/painel/acm-api"
import type { ACM } from "@/types/acm"

export default function AcmListPage() {
  const [acms, setAcms] = useState<ACM[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    apiListAcms()
      .then((list) => { if (mounted) setAcms(list) })
      .catch((e: Error) => { if (mounted) { setErro(e.message); setAcms([]) } })
    return () => { mounted = false }
  }, [])

  const carregando = acms === null

  return (
    <div className="px-5 lg:px-10 pt-6 lg:pt-10 pb-10 space-y-6">
      {/* HERO */}
      <section
        className="relative overflow-hidden rounded-3xl px-6 py-7 lg:px-9 lg:py-9 text-beige"
        style={{ background: "linear-gradient(135deg, #2F4156 0%, #567C8D 100%)" }}
      >
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-beige/70">
            <Calculator size={12} strokeWidth={2.2} />
            Análise Comparativa de Mercado
          </div>
          <h1 className="mt-2 font-display text-[26px] lg:text-[34px] font-bold leading-[1.05] tracking-tight">
            Precifique cada imóvel com dado.
          </h1>
          <p className="mt-3 text-[13px] text-beige/80 leading-relaxed max-w-md">
            Cole o texto de 4 anúncios semelhantes no bairro. O sistema calcula a média ponderada por preço/m² e sugere um valor pra você apresentar ao proprietário — com PDF pronto.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/painel/acm/nova"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-beige text-navy text-[12.5px] font-bold hover:bg-white transition-colors"
            >
              <Plus size={14} strokeWidth={2.2} />
              Nova ACM
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-6 -bottom-8 w-[220px] h-[220px] rounded-full opacity-40" style={{ background: "radial-gradient(circle, rgba(200,217,230,0.4), transparent 70%)" }} />
      </section>

      {/* LISTA */}
      <section className="rounded-3xl border border-sky/60 bg-white p-5 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-[17px] font-bold text-navy">Suas análises</h2>
            <p className="text-[11.5px] text-teal mt-0.5">Da mais recente à mais antiga.</p>
          </div>
        </div>

        {erro && (
          <div className="flex items-start gap-2 p-3 rounded-2xl border mb-4" style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.25)" }}>
            <AlertCircle size={14} className="text-red-700 flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-red-800 leading-relaxed">{erro}</p>
          </div>
        )}

        {carregando && (
          <ul className="space-y-2">
            {[0, 1, 2].map((i) => (
              <li key={i} className="p-4 rounded-2xl bg-beige/40 border border-sky/40">
                <div className="h-4 w-2/3 rounded bg-sky/40 animate-pulse" />
                <div className="mt-2 h-3 w-1/3 rounded bg-sky/25 animate-pulse" />
              </li>
            ))}
          </ul>
        )}

        {!carregando && acms && acms.length === 0 && (
          <div className="text-center py-10 space-y-3">
            <div className="mx-auto w-14 h-14 rounded-2xl grid place-items-center bg-sky/40 text-teal">
              <FileText size={22} strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-[13.5px] font-bold text-navy">Nenhuma análise ainda</p>
              <p className="text-[12px] text-teal mt-1">Comece pela sua primeira ACM — cerca de 5 minutos.</p>
            </div>
            <Link
              href="/painel/acm/nova"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-beige text-[12.5px] font-bold"
              style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)", boxShadow: "0 10px 22px -8px rgba(47,65,86,0.45)" }}
            >
              <Plus size={14} strokeWidth={2.2} /> Criar primeira ACM
            </Link>
          </div>
        )}

        {!carregando && acms && acms.length > 0 && (
          <ul className="space-y-2">
            {acms.map((acm) => (
              <li key={acm.id}>
                <Link
                  href={`/painel/acm/${acm.slug}`}
                  className="group flex items-center gap-3 p-4 rounded-2xl bg-beige/40 border border-sky/40 hover:border-teal hover:bg-white transition-all"
                >
                  <div className="w-10 h-10 rounded-xl grid place-items-center text-beige flex-shrink-0" style={{ background: acm.status === "concluida" ? "#567C8D" : "#2F4156" }}>
                    <TrendingUp size={16} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-bold text-navy truncate">{acm.imovelAlvo.apelido}</div>
                    <div className="text-[11px] text-teal mt-0.5 flex items-center gap-2 truncate">
                      <span>{acm.imovelAlvo.bairro}, {acm.imovelAlvo.cidade}</span>
                      <span className="text-sky">·</span>
                      <span>{acm.amostras.length} amostras</span>
                      <span className="text-sky">·</span>
                      <span className={acm.status === "concluida" ? "text-teal" : "text-amber-700"}>{acm.status === "concluida" ? "Concluída" : "Rascunho"}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[13px] font-bold text-navy tabular-nums">
                      {acm.calculo.valorSugerido > 0 ? fmtReais(acm.calculo.valorSugerido) : "—"}
                    </div>
                    <div className="text-[10.5px] text-teal">valor sugerido</div>
                  </div>
                  <ArrowRight size={14} className="text-teal group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function fmtReais(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v)
}
