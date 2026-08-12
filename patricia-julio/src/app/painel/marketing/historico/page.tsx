"use client"

import Link from "next/link"
import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  ArrowLeft, Plus, AlertCircle, Filter, Loader2, Clock, CheckCircle2, Trophy,
  Sparkles, MapPin, MessageSquare, ExternalLink, Trash2, Copy, Ban,
} from "lucide-react"
import { apiListPedidos, apiDeletePedido, apiUpdatePedido } from "@/lib/painel/marketing-api"
import { PERSONAS, getPersona } from "@/data/painel/personas"
import type { PedidoCriativo, StatusPedido } from "@/types/marketing"

export default function HistoricoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-teal text-sm">Carregando...</div>}>
      <HistoricoInner />
    </Suspense>
  )
}

function HistoricoInner() {
  const params = useSearchParams()
  const destaqueSlug = params.get("p")
  const novoRecem = params.get("novo") === "1"

  const [pedidos, setPedidos] = useState<PedidoCriativo[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<StatusPedido | "todos">("todos")
  const [filtroPersona, setFiltroPersona] = useState<string>("todas")
  const [aplicando, setAplicando] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    apiListPedidos()
      .then((p) => { if (mounted) setPedidos(p) })
      .catch((e: Error) => { if (mounted) { setErro(e.message); setPedidos([]) } })
    return () => { mounted = false }
  }, [])

  const carregando = pedidos === null

  const filtrados = useMemo(() => {
    if (!pedidos) return []
    return pedidos.filter((p) => {
      if (filtroStatus !== "todos" && p.status !== filtroStatus) return false
      if (filtroPersona !== "todas" && p.personaId !== filtroPersona) return false
      return true
    })
  }, [pedidos, filtroStatus, filtroPersona])

  async function alterarStatus(id: string, novoStatus: StatusPedido) {
    setAplicando(id)
    try {
      const atualizado = await apiUpdatePedido(id, { status: novoStatus })
      setPedidos((list) => (list || []).map((p) => (p.id === atualizado.id ? atualizado : p)))
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setAplicando(null)
    }
  }

  async function remover(id: string) {
    if (!confirm("Remover esse pedido? Não desfaz.")) return
    setAplicando(id)
    try {
      await apiDeletePedido(id)
      setPedidos((list) => (list || []).filter((p) => p.id !== id))
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setAplicando(null)
    }
  }

  return (
    <div className="px-5 lg:px-10 pt-6 lg:pt-10 pb-10 space-y-6 max-w-5xl">
      {/* HEADER */}
      <div>
        <Link href="/painel/marketing" className="inline-flex items-center gap-1.5 text-[12px] text-teal hover:text-navy transition-colors">
          <ArrowLeft size={13} />
          Voltar
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal">Marketing · Histórico</div>
            <h1 className="mt-1 font-display text-[24px] lg:text-[30px] font-bold text-navy tracking-tight leading-tight">
              Seus pedidos de criativo
            </h1>
            <p className="mt-1.5 text-[13px] text-teal leading-relaxed max-w-lg">
              Todos os pedidos com status. Marque como &quot;publicado&quot; quando postar no IG/FB pra alimentar sua meta semanal.
            </p>
          </div>
          <Link
            href="/painel/marketing/gerar"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-beige text-[12.5px] font-bold"
            style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)", boxShadow: "0 10px 22px -8px rgba(47,65,86,0.45)" }}
          >
            <Plus size={14} strokeWidth={2.2} /> Novo pedido
          </Link>
        </div>
      </div>

      {/* Aviso "recém-criado" */}
      {novoRecem && destaqueSlug && (
        <div className="rounded-2xl border p-3 flex items-start gap-2" style={{ background: "rgba(15,122,84,0.06)", borderColor: "rgba(15,122,84,0.28)" }}>
          <CheckCircle2 size={14} className="text-green-700 flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-green-900 leading-relaxed">
            Pedido enviado com sucesso. O Yann vai processar via MazyOS — você recebe uma notificação quando o criativo estiver pronto pra baixar.
          </p>
        </div>
      )}

      {/* Filtros */}
      <section className="rounded-2xl border border-sky/60 bg-white p-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Filter size={12} className="text-teal" />
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-teal">Filtros</span>
        </div>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value as StatusPedido | "todos")}
          className="h-9 px-3 rounded-full bg-beige border border-sky text-navy text-[12px] font-semibold outline-none focus:border-teal cursor-pointer"
        >
          <option value="todos">Todos os status</option>
          <option value="pendente">Pendentes</option>
          <option value="gerando">Gerando</option>
          <option value="pronto">Prontos</option>
          <option value="publicado">Publicados</option>
          <option value="cancelado">Cancelados</option>
        </select>
        <select
          value={filtroPersona}
          onChange={(e) => setFiltroPersona(e.target.value)}
          className="h-9 px-3 rounded-full bg-beige border border-sky text-navy text-[12px] font-semibold outline-none focus:border-teal cursor-pointer"
        >
          <option value="todas">Todas as personas</option>
          {PERSONAS.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {(filtroStatus !== "todos" || filtroPersona !== "todas") && (
          <button
            type="button"
            onClick={() => { setFiltroStatus("todos"); setFiltroPersona("todas") }}
            className="text-[11px] font-semibold text-teal hover:text-navy"
          >
            Limpar
          </button>
        )}
        <span className="ml-auto text-[11px] text-teal tabular-nums">
          {filtrados.length} pedido{filtrados.length !== 1 ? "s" : ""}
        </span>
      </section>

      {erro && (
        <div className="flex items-start gap-2 p-3 rounded-2xl border" style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.25)" }}>
          <AlertCircle size={14} className="text-red-700 flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-red-800 leading-relaxed">{erro}</p>
        </div>
      )}

      {/* Loading */}
      {carregando && (
        <ul className="space-y-2">
          {[0, 1, 2].map((i) => (
            <li key={i} className="p-4 rounded-3xl bg-beige/40 border border-sky/40">
              <div className="h-4 w-2/3 rounded bg-sky/40 animate-pulse" />
              <div className="mt-2 h-3 w-1/3 rounded bg-sky/25 animate-pulse" />
            </li>
          ))}
        </ul>
      )}

      {/* Empty state */}
      {!carregando && pedidos && pedidos.length === 0 && (
        <div className="rounded-3xl border border-sky/60 bg-white p-10 text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl grid place-items-center bg-sky/40 text-teal">
            <MessageSquare size={22} strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-[13.5px] font-bold text-navy">Nenhum pedido ainda</p>
            <p className="text-[12px] text-teal mt-1">Peça seu primeiro criativo em menos de 30 segundos.</p>
          </div>
          <Link
            href="/painel/marketing/gerar"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-beige text-[12.5px] font-bold"
            style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)" }}
          >
            <Plus size={14} /> Pedir criativo
          </Link>
        </div>
      )}

      {/* Filtered empty */}
      {!carregando && pedidos && pedidos.length > 0 && filtrados.length === 0 && (
        <div className="rounded-2xl border border-sky/60 bg-beige/40 p-6 text-center">
          <p className="text-[12.5px] text-navy">Nenhum pedido bate com esses filtros.</p>
        </div>
      )}

      {/* Lista */}
      {!carregando && filtrados.length > 0 && (
        <ul className="space-y-3">
          {filtrados.map((p) => (
            <PedidoCard
              key={p.id}
              pedido={p}
              destaque={destaqueSlug === p.slug}
              aplicando={aplicando === p.id}
              onStatus={(s) => alterarStatus(p.id, s)}
              onRemover={() => remover(p.id)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

// ============================================================
// Card de pedido
// ============================================================
function PedidoCard({
  pedido, destaque, aplicando, onStatus, onRemover,
}: {
  pedido: PedidoCriativo
  destaque?: boolean
  aplicando?: boolean
  onStatus: (s: StatusPedido) => void
  onRemover: () => void
}) {
  const persona = getPersona(pedido.personaId)
  const criadoEm = formatarData(pedido.criadoEm)

  return (
    <li
      className={`rounded-3xl bg-white border p-4 lg:p-5 transition-all ${
        destaque ? "border-teal shadow-[0_20px_40px_-14px_rgba(47,65,86,0.35)]" : "border-sky/60"
      }`}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal">
              {tipoLabel(pedido.tipo)}
            </span>
            <span className="text-sky">·</span>
            <span className="text-[10.5px] text-teal">{persona?.name || pedido.personaId}</span>
            <span className="text-sky">·</span>
            <span className="text-[10.5px] text-navy/60 tabular-nums">{criadoEm}</span>
          </div>
          <h3 className="mt-1 font-display text-[15px] font-bold text-navy leading-tight">
            {pedido.gancho}
          </h3>
          <div className="mt-1.5 flex items-center gap-3 flex-wrap text-[11px] text-navy/75">
            {pedido.bairro && (
              <span className="inline-flex items-center gap-1"><MapPin size={10} className="text-teal" />{pedido.bairro}</span>
            )}
            {pedido.faixaPreco && (
              <span className="inline-flex items-center gap-1"><Sparkles size={10} className="text-teal" />{pedido.faixaPreco}</span>
            )}
            {pedido.criadoPor && (
              <span className="text-navy/50">por {pedido.criadoPor}</span>
            )}
          </div>
          {pedido.briefing && (
            <p className="mt-2 text-[11.5px] text-navy/70 leading-relaxed italic border-l-2 border-sky pl-3">
              {pedido.briefing}
            </p>
          )}
        </div>

        <StatusPill status={pedido.status} />
      </div>

      {/* Criativos entregues */}
      {pedido.criativos && pedido.criativos.length > 0 && (
        <div className="mt-4 pt-4 border-t border-sky/50">
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-teal mb-2">
            Criativos entregues ({pedido.criativos.length})
          </div>
          <div className="space-y-2">
            {pedido.criativos.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-2xl bg-beige/40 border border-sky/40">
                <div className="w-9 h-9 rounded-lg grid place-items-center bg-navy/8 text-teal flex-shrink-0">
                  <Sparkles size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-bold text-navy truncate">{c.titulo}</div>
                  {c.legendaSugerida && (
                    <div className="text-[10.5px] text-navy/70 truncate">{c.legendaSugerida}</div>
                  )}
                </div>
                {c.arquivoUrl && (
                  <a
                    href={c.arquivoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-semibold text-teal hover:text-navy hover:bg-sky/40"
                  >
                    <ExternalLink size={11} /> Abrir
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="mt-4 pt-4 border-t border-sky/50 flex items-center gap-2 flex-wrap">
        {pedido.status === "pronto" && (
          <button
            type="button"
            disabled={aplicando}
            onClick={() => onStatus("publicado")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-beige text-[11px] font-bold disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)" }}
          >
            {aplicando ? <Loader2 size={11} className="animate-spin" /> : <Trophy size={11} />}
            Marcar como publicado
          </button>
        )}
        {pedido.status === "pendente" && (
          <>
            <button
              type="button"
              disabled={aplicando}
              onClick={() => copiarBriefing(pedido)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-navy text-[11px] font-semibold bg-white border border-sky hover:bg-beige"
            >
              <Copy size={11} /> Copiar brief pro MazyOS
            </button>
            <button
              type="button"
              disabled={aplicando}
              onClick={() => onStatus("cancelado")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-red-700 text-[11px] font-semibold hover:bg-red-50"
            >
              <Ban size={11} /> Cancelar
            </button>
          </>
        )}
        {pedido.status !== "publicado" && (
          <button
            type="button"
            disabled={aplicando}
            onClick={onRemover}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-navy/60 text-[11px] font-semibold hover:text-red-700 hover:bg-red-50 ml-auto"
          >
            <Trash2 size={11} /> Remover
          </button>
        )}
      </div>
    </li>
  )
}

// ============================================================
// Helpers
// ============================================================
function tipoLabel(t: PedidoCriativo["tipo"]): string {
  const map: Record<PedidoCriativo["tipo"], string> = {
    carrossel: "Carrossel",
    reels: "Reels",
    story: "Story",
    post: "Post",
  }
  return map[t] || t
}

function copiarBriefing(pedido: PedidoCriativo) {
  const persona = getPersona(pedido.personaId)
  const bloco = `[PEDIDO DE CRIATIVO · MARKETING · PATRÍCIA E JÚLIO]

Tipo: ${tipoLabel(pedido.tipo)}
Persona: ${persona?.name || pedido.personaId}
${pedido.bairro ? `Bairro: ${pedido.bairro}\n` : ""}${pedido.faixaPreco ? `Faixa de preço: ${pedido.faixaPreco}\n` : ""}Gancho: ${pedido.gancho}
${pedido.briefing ? `\nBriefing extra:\n${pedido.briefing}\n` : ""}
--- CONTEXTO DA PERSONA ---
${persona ? [
  `Idade: ${persona.age[0]}–${persona.age[1]} anos`,
  `Renda: R$ ${persona.incomeBrl[0]}–${persona.incomeBrl[1] >= 999999 ? "livre" : persona.incomeBrl[1]}`,
  `Regiões: ${persona.regions.join(", ")}`,
  `Produto: ${persona.product}`,
  `Dores: ${persona.pain.join(" · ")}`,
  `Ganchos: ${persona.hook.join(" · ")}`,
  `Objeção: ${persona.objection}`,
  `Fechamento: ${persona.closer}`,
].join("\n") : ""}

Regras editoriais globais:
- Uma persona por criativo
- Bairro no card, preço no primeiro slide
- Foto/vídeo por dentro (não fachada solta)
- CRECI de ambos no rodapé (Patrícia Vidal / CRECI 68850 · Júlio Aguiar / CRECI 79271)
- Zero clichê ("realize seu sonho", "vamos juntos", "alavancar")
- CTA claro: Chama no WhatsApp / Agende visita
- Paleta: Navy #2F4156 · Teal #567C8D · Sky Blue #C8D9E6 · Beige #F5EFEB
`
  navigator.clipboard?.writeText(bloco).then(
    () => alert("Briefing completo copiado. Cole no chat com o MazyOS."),
    () => alert("Falha ao copiar. Selecione e copie manualmente."),
  )
}

function formatarData(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" })
  } catch { return iso.slice(0, 10) }
}

function StatusPill({ status }: { status: StatusPedido }) {
  const cor = statusCor(status)
  const label = statusLabel(status)
  const Icon = statusIcon(status)
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0"
      style={{ background: `${cor}12`, color: cor, border: `1px solid ${cor}33` }}
    >
      <Icon size={11} strokeWidth={2.4} />
      {label}
    </span>
  )
}
function statusLabel(s: StatusPedido): string {
  const map: Record<StatusPedido, string> = {
    pendente:   "Pendente",
    gerando:    "Gerando",
    pronto:     "Pronto",
    publicado:  "Publicado",
    cancelado:  "Cancelado",
  }
  return map[s] || s
}
function statusCor(s: StatusPedido): string {
  const map: Record<StatusPedido, string> = {
    pendente:   "#D98A00",
    gerando:    "#567C8D",
    pronto:     "#0F7A54",
    publicado:  "#2F4156",
    cancelado:  "#94A3B8",
  }
  return map[s] || "#94A3B8"
}
function statusIcon(s: StatusPedido) {
  const map: Record<StatusPedido, typeof Clock> = {
    pendente:   Clock,
    gerando:    Loader2,
    pronto:     CheckCircle2,
    publicado:  Trophy,
    cancelado:  Ban,
  }
  return map[s] || Clock
}
