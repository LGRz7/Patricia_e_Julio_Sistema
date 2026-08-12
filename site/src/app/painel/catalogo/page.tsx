"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Building2, Plus, Pencil, Trash2, Search, ExternalLink, AlertCircle, RefreshCw } from "lucide-react"
import { apiDeleteImovel, apiListImoveis } from "@/lib/painel/imoveis-api"
import { fmtReais } from "@/lib/painel/rota"
import type { Imovel } from "@/types/imovel"

export default function CatalogoPage() {
  const [lista, setLista] = useState<Imovel[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState("")
  const [filtroTipo, setFiltroTipo] = useState<string>("todos")
  const [confirmDel, setConfirmDel] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  async function recarregar() {
    setCarregando(true); setErro(null)
    try {
      const list = await apiListImoveis()
      setLista(list)
    } catch (e) {
      setErro("Falha ao carregar: " + (e as Error).message)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { recarregar() }, [])

  const filtrados = useMemo(() => {
    return lista.filter((i) => {
      if (filtroTipo !== "todos" && i.tipo !== filtroTipo) return false
      if (busca && !`${i.titulo} ${i.localizacao}`.toLowerCase().includes(busca.toLowerCase())) return false
      return true
    })
  }, [lista, busca, filtroTipo])

  async function excluir(slug: string) {
    setExcluindo(true)
    try {
      await apiDeleteImovel(slug)
      setConfirmDel(null)
      await recarregar()
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <div className="px-5 lg:px-10 pt-6 lg:pt-10 pb-10 space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal">Catálogo</div>
          <h1 className="mt-1 font-display text-[24px] lg:text-[30px] font-bold text-navy leading-tight">Imóveis publicados</h1>
          <p className="text-[12.5px] text-navy/70 mt-1 max-w-xl">
            {lista.length} imóveis no total. Ao salvar ou excluir aqui, o site público atualiza <strong>na hora</strong> — sem precisar publicar de novo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={recarregar}
            disabled={carregando}
            className="h-11 px-4 rounded-full border border-sky text-navy text-[12.5px] font-semibold flex items-center gap-1.5 bg-white hover:bg-beige disabled:opacity-50"
          >
            <RefreshCw size={13} className={carregando ? "animate-spin" : ""} /> Recarregar
          </button>
          <Link
            href="/painel/catalogo/novo"
            className="h-11 px-4 rounded-full text-beige text-[12.5px] font-bold flex items-center gap-1.5"
            style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)", boxShadow: "0 10px 22px -8px rgba(47,65,86,0.45)" }}
          >
            <Plus size={14} strokeWidth={2.4} /> Novo imóvel
          </Link>
        </div>
      </header>

      {erro && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertCircle size={16} className="text-red-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-[12.5px] text-red-800">{erro}</div>
          <button onClick={() => setErro(null)} className="text-red-700 text-[12px]">Ok</button>
        </div>
      )}

      <div className="p-4 rounded-2xl bg-sky/40 border border-sky flex items-start gap-3">
        <AlertCircle size={16} className="text-navy flex-shrink-0 mt-0.5" />
        <div className="text-[12px] text-navy leading-relaxed">
          <strong>Publicação automática:</strong> imóveis salvos aqui aparecem no site em segundos. Nada de exportar arquivo ou fazer commit.
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-teal" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título ou endereço..."
            className="w-full h-11 pl-9 pr-3 rounded-full bg-white border border-sky text-navy text-[13px] outline-none focus:border-teal"
          />
        </div>
        {["todos", "apartamento", "casa", "cobertura", "terreno", "comercial"].map((t) => (
          <button
            key={t}
            onClick={() => setFiltroTipo(t)}
            className="h-11 px-4 rounded-full text-[12px] font-semibold transition-colors capitalize"
            style={{
              background: filtroTipo === t ? "#2F4156" : "#FFFFFF",
              color:      filtroTipo === t ? "#F5EFEB" : "#2F4156",
              border:     filtroTipo === t ? "1px solid transparent" : "1px solid #C8D9E6",
            }}
          >
            {t === "todos" ? "Todos" : t + "s"}
          </button>
        ))}
      </div>

      {/* Grid */}
      {carregando ? (
        <div className="p-10 text-center text-teal text-[13px]">Carregando imóveis...</div>
      ) : filtrados.length === 0 ? (
        <div className="p-10 rounded-3xl bg-white border border-sky/60 text-center">
          <Building2 size={26} className="mx-auto text-teal mb-2" strokeWidth={1.5} />
          <p className="text-[13px] font-bold text-navy">{lista.length === 0 ? "Nenhum imóvel cadastrado ainda" : "Nenhum imóvel nesse filtro"}</p>
          <p className="text-[11.5px] text-teal mt-1">
            {lista.length === 0 ? (
              <Link href="/painel/catalogo/novo" className="underline font-semibold">Cadastre o primeiro →</Link>
            ) : "Ajuste a busca ou os filtros."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
          {filtrados.map((i) => (
            <Card key={i.slug} imovel={i} onExcluir={() => setConfirmDel(i.slug)} />
          ))}
        </div>
      )}

      {/* Modal confirmar exclusão */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 grid place-items-center p-5" style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-[380px] rounded-2xl bg-beige border border-sky/60 shadow-xl overflow-hidden">
            <div className="p-5">
              <h3 className="font-display font-bold text-[16px] text-navy">Excluir imóvel?</h3>
              <p className="text-[12.5px] text-navy/70 mt-2">
                O site público vai deixar de mostrar esse imóvel imediatamente. Se ele estiver na base do repositório, essa &quot;remoção&quot; só afeta a publicação — pra remover em definitivo, o dev precisa editar <code className="text-[10.5px] px-1 rounded bg-white">data/imoveis.ts</code>.
              </p>
            </div>
            <div className="p-4 border-t border-sky/60 flex gap-2">
              <button onClick={() => setConfirmDel(null)} disabled={excluindo} className="flex-1 h-10 rounded-xl bg-white border border-sky text-navy text-[12.5px] font-semibold disabled:opacity-50">Cancelar</button>
              <button onClick={() => excluir(confirmDel)} disabled={excluindo} className="flex-1 h-10 rounded-xl bg-navy text-beige text-[12.5px] font-bold disabled:opacity-50">
                {excluindo ? "Excluindo…" : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Card({ imovel, onExcluir }: { imovel: Imovel; onExcluir: () => void }) {
  const cover = imovel.imagens?.[0]?.src || "/imoveis/placeholder-fachada.svg"
  return (
    <div className="group rounded-3xl overflow-hidden bg-white border border-sky/60 hover:border-teal transition-all hover:shadow-[0_20px_44px_-12px_rgba(47,65,86,0.2)]">
      <div className="relative aspect-[4/3]">
        <Image
          src={cover}
          alt={imovel.imagens?.[0]?.alt || imovel.titulo}
          fill
          sizes="240px"
          className="object-cover"
        />
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-beige/95 text-navy backdrop-blur-sm">{imovel.tipo}</span>
        </div>
        {imovel.status !== "disponivel" && (
          <div className="absolute inset-0 bg-navy/50 grid place-items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-beige">{imovel.status}</span>
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <div>
          <h3 className="font-display font-bold text-[14px] text-navy leading-tight line-clamp-1">{imovel.titulo}</h3>
          <p className="text-[11px] text-teal line-clamp-1 mt-0.5">{imovel.localizacao}</p>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-sky/60">
          <div className="text-[14px] font-bold text-navy tabular-nums">
            {imovel.valor ? fmtReais(imovel.valor) : <span className="text-teal text-[11px] font-medium">Sob consulta</span>}
          </div>
          <div className="flex gap-1">
            <Link
              href={`/imoveis/${imovel.slug}`}
              target="_blank"
              className="w-7 h-7 rounded-full grid place-items-center text-teal hover:bg-beige"
              title="Ver no site público"
            >
              <ExternalLink size={11} />
            </Link>
            <Link
              href={`/painel/catalogo/${imovel.slug}/editar`}
              className="w-7 h-7 rounded-full grid place-items-center text-teal hover:bg-beige"
              title="Editar"
            >
              <Pencil size={12} />
            </Link>
            <button
              onClick={onExcluir}
              className="w-7 h-7 rounded-full grid place-items-center text-teal hover:bg-beige hover:text-navy"
              title="Remover publicação"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
