"use client"

import Image from "next/image"
import {
  BadgeCheck, Info, LogOut, Phone, User,
} from "lucide-react"
import { profissionais } from "@/data/profissionais"
import { useUsuario } from "@/hooks/painel/useUsuario"

export default function PerfilPage() {
  const { usuario, sair } = useUsuario()

  return (
    <div className="px-5 lg:px-10 pt-6 lg:pt-10 pb-10 space-y-6 max-w-5xl">
      {/* HEADER */}
      <header>
        <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal">Painel dos Corretores</div>
        <h1 className="mt-1 font-display text-[24px] lg:text-[30px] font-bold text-navy tracking-tight leading-tight">
          Meu perfil
        </h1>
        <p className="mt-1.5 text-[13px] text-teal leading-relaxed max-w-lg">
          Dados da equipe e informações de contato.
        </p>
      </header>

      {/* SESSÃO ATUAL */}
      {usuario && (
        <section className="rounded-3xl border border-sky/60 bg-white p-5 lg:p-6">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full grid place-items-center text-beige font-display font-bold text-[16px] shadow-[0_8px_16px_-6px_rgba(47,65,86,0.35)]"
              style={{ background: usuario.papel === "julio" ? "#567C8D" : "#2F4156" }}
            >
              {usuario.papel === "patricia" ? "P" : usuario.papel === "julio" ? "J" : usuario.nome?.[0] || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-teal">Você entrou como</div>
              <div className="mt-0.5 font-display text-[17px] font-bold text-navy truncate">{usuario.nome}</div>
              <div className="text-[11.5px] text-teal">Sessão ativa por 7 dias neste dispositivo</div>
            </div>
            <button
              onClick={sair}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-sky text-[12px] font-semibold text-navy hover:bg-beige transition-colors"
            >
              <LogOut size={13} />
              Sair
            </button>
          </div>
        </section>
      )}

      {/* EQUIPE (readonly) */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <User size={14} className="text-teal" />
          <h2 className="font-display text-[14px] font-bold uppercase tracking-wider text-navy">Sua equipe</h2>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {profissionais.map((p) => (
            <article key={p.id} className="rounded-3xl border border-sky/60 bg-white overflow-hidden">
              <div className="relative w-full aspect-[4/5] bg-sky/30">
                {p.foto ? (
                  <Image
                    src={p.foto}
                    alt={p.fotoAlt}
                    fill
                    sizes="(min-width: 1024px) 400px, 100vw"
                    className="object-cover object-center"
                  />
                ) : null}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-display text-[17px] font-bold text-navy leading-tight">{p.nome}</div>
                    <div className="text-[11.5px] text-teal mt-0.5">{p.papel}</div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-beige border border-sky/70 text-[10.5px] font-bold text-navy">
                    <BadgeCheck size={11} className="text-teal" />
                    {p.creci}
                  </span>
                </div>
                <p className="mt-3 text-[12.5px] text-navy/75 leading-relaxed">{p.bio}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.especialidades.map((esp) => (
                    <span key={esp} className="px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-sky/50 text-navy">
                      {esp}
                    </span>
                  ))}
                </div>
                {p.whatsapp && (
                  <div className="mt-4 pt-3 border-t border-sky/60 flex items-center gap-2 text-[12px] text-navy">
                    <Phone size={12} className="text-teal" />
                    <span className="tabular-nums">{formatBrPhone(p.whatsapp)}</span>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-beige/60 border border-sky/60">
          <Info size={13} className="text-teal flex-shrink-0 mt-0.5" />
          <p className="text-[11.5px] text-navy/75 leading-relaxed">
            Dados da equipe são gerenciados centralmente pelo administrador. Alterações são feitas fora do painel.
          </p>
        </div>
      </section>
    </div>
  )
}

/** Formata "5521999999999" → "+55 (21) 99999-9999" */
function formatBrPhone(raw: string): string {
  const d = raw.replace(/\D/g, "")
  if (d.length !== 13 && d.length !== 12) return raw
  const cc = d.slice(0, 2)
  const ddd = d.slice(2, 4)
  const rest = d.slice(4)
  if (rest.length === 9) return `+${cc} (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`
  return `+${cc} (${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`
}
