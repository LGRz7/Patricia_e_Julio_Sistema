"use client"

/**
 * CriarDoCatalogo.tsx — Modo "a partir do catálogo" do Estúdio.
 *
 * Puxa a lista de imóveis já cadastrados no /painel/catalogo.
 * Corretor escolhe um imóvel → escolhe o tipo/foto → sistema abre o editor
 * já com bairro, título, preço, características e foto do imóvel.
 */

import { useEffect, useState } from "react"
import {
  ArrowLeft, ArrowRight, Loader2, AlertCircle, MapPin, Home,
  Sparkles, CheckCircle2, LayoutGrid, Video, MessageCircle, Image as ImageIconAlt,
  Search,
} from "lucide-react"
import { apiListImoveis } from "@/lib/painel/imoveis-api"
import type { Imovel } from "@/types/imovel"
import type { TipoCriativo } from "@/types/marketing"
import type { ResultadoParse } from "@/lib/painel/marketing-parser"

const TIPOS: { id: TipoCriativo; label: string; icon: typeof LayoutGrid }[] = [
  { id: "post",      label: "Post 4:5",       icon: MessageCircle },
  { id: "carrossel", label: "Carrossel",      icon: LayoutGrid },
  { id: "story",     label: "Story 9:16",     icon: ImageIconAlt },
  { id: "reels",     label: "Capa de Reels",  icon: Video },
]

interface Props {
  onGerar: (resultado: ResultadoParse) => void
  onVoltar: () => void
}

export function CriarDoCatalogo({ onGerar, onVoltar }: Props) {
  const [imoveis, setImoveis] = useState<Imovel[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState("")
  const [selecionado, setSelecionado] = useState<Imovel | null>(null)
  const [fotoIdx, setFotoIdx] = useState(0)
  const [tipo, setTipo] = useState<TipoCriativo>("post")

  // useEffect(() => {
  //   let mounted = true
  //   apiListImoveis()
  //     .then((list) => {
  //       if (!mounted) return
  //       // Prioriza disponíveis, ignora vendidos
  //       const disponiveis = list.filter((i) => i.status !== "vendido")
  //       setImoveis(disponiveis)
  //     })
  //     .catch((e: Error) => { if (mounted) { setErro(e.message); setImoveis([]) } })
  //   return () => { mounted = false }
  // }, [])

  const carregando = imoveis === null
  const filtrados = (imoveis || []).filter((i) => {
    if (!busca.trim()) return true
    const b = busca.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    const alvo = [i.titulo, i.localizacao, i.resumo].join(" ").toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    return alvo.includes(b)
  })

  function gerar() {
    if (!selecionado) return
    const foto = selecionado.imagens?.[fotoIdx]?.src || ""
    const resultado = montarResultado(selecionado, tipo, foto)
    onGerar(resultado)
  }

  // ============================================================
  // Rendering
  // ============================================================

  // Estado 2 — imóvel selecionado, escolhendo foto + tipo
  if (selecionado) {
    return (
      <RefinarSelecao
        imovel={selecionado}
        tipo={tipo}
        fotoIdx={fotoIdx}
        onTrocarTipo={setTipo}
        onTrocarFoto={setFotoIdx}
        onCancelar={() => setSelecionado(null)}
        onConfirmar={gerar}
      />
    )
  }

  // Estado 1 — lista de imóveis
  return (
    <div className="px-5 lg:px-10 pt-6 lg:pt-10 pb-10 space-y-6 max-w-6xl">
      {/* HEADER */}
      <div>
        <button
          type="button"
          onClick={onVoltar}
          className="inline-flex items-center gap-1.5 text-[12px] text-teal hover:text-navy transition-colors"
        >
          <ArrowLeft size={13} />
          Voltar
        </button>
        <div className="mt-2 flex items-start gap-3">
          <span
            className="w-11 h-11 rounded-2xl grid place-items-center text-beige flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)" }}
          >
            <Home size={18} strokeWidth={2} />
          </span>
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal">
              A partir do catálogo
            </div>
            <h1 className="mt-1 font-display text-[22px] lg:text-[28px] font-bold text-navy tracking-tight leading-tight">
              Escolhe um imóvel do seu catálogo
            </h1>
            <p className="mt-1.5 text-[12.5px] text-teal leading-relaxed max-w-lg">
              A gente pega bairro, preço, área, quartos e foto direto do cadastro. Você só confirma o formato e baixa.
            </p>
          </div>
        </div>
      </div>

      {/* Busca */}
      {(imoveis?.length ?? 0) > 3 && (
        <div className="relative max-w-md">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal pointer-events-none" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título, bairro..."
            className="w-full h-11 pl-10 pr-3.5 rounded-full bg-beige border border-sky text-navy text-[13px] outline-none focus:border-teal focus:ring-[3px] focus:ring-teal/15 transition-all"
          />
        </div>
      )}

      {/* Erro */}
      {erro && (
        <div className="flex items-start gap-2 p-3 rounded-2xl border" style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.25)" }}>
          <AlertCircle size={14} className="text-red-700 flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-red-800">{erro}</p>
        </div>
      )}

      {/* Loading */}
      {carregando && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-3xl bg-beige/40 border border-sky/40 aspect-[4/5]" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!carregando && imoveis && imoveis.length === 0 && (
        <div className="rounded-3xl border-2 border-dashed border-sky/70 bg-beige/30 p-10 text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl grid place-items-center bg-sky/40 text-teal">
            <Home size={22} strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-[13.5px] font-bold text-navy">Catálogo vazio</p>
            <p className="text-[12px] text-teal mt-1">Cadastre um imóvel primeiro em /painel/catalogo pra usar esse fluxo.</p>
          </div>
        </div>
      )}

      {/* Grid de imóveis */}
      {!carregando && filtrados.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((im) => (
            <ImovelCard
              key={im.slug}
              imovel={im}
              onClick={() => { setSelecionado(im); setFotoIdx(0) }}
            />
          ))}
        </div>
      )}

      {!carregando && filtrados.length === 0 && (imoveis?.length ?? 0) > 0 && (
        <div className="rounded-2xl border border-sky/60 bg-beige/40 p-6 text-center">
          <p className="text-[12.5px] text-navy">Nenhum imóvel bate com essa busca.</p>
        </div>
      )}
    </div>
  )
}

// ============================================================
// ImovelCard
// ============================================================
function ImovelCard({ imovel, onClick }: { imovel: Imovel; onClick: () => void }) {
  const capa = imovel.imagens?.[0]
  const temFotos = (imovel.imagens?.length || 0) > 0

  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left rounded-3xl border border-sky/60 bg-white overflow-hidden hover:border-teal hover:shadow-[0_16px_32px_-16px_rgba(47,65,86,0.28)] transition-all"
    >
      <div className="relative aspect-[4/5] bg-sky/30 overflow-hidden">
        {capa ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={capa.src}
            alt={capa.alt || imovel.titulo}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-teal">
            <Home size={40} strokeWidth={1.3} />
            <span className="text-[10.5px] font-medium">Sem foto ainda</span>
          </div>
        )}

        {imovel.imagens && imovel.imagens.length > 1 && (
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9.5px] font-bold text-beige"
                style={{ background: "rgba(37,51,71,0.7)", backdropFilter: "blur(4px)" }}>
            {imovel.imagens.length} fotos
          </span>
        )}

        {imovel.status === "reservado" && (
          <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[9.5px] font-bold text-beige"
                style={{ background: "rgba(217,138,0,0.9)" }}>
            Reservado
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="text-[13px] font-bold text-navy leading-tight line-clamp-2">
          {imovel.titulo}
        </div>
        <div className="mt-1 flex items-center gap-1 text-[10.5px] text-teal">
          <MapPin size={10} />
          <span className="truncate">{imovel.localizacao}</span>
        </div>

        <div className="mt-2.5 flex items-center justify-between">
          <div className="text-[13px] font-bold text-navy tabular-nums">
            {formatarValor(imovel.valor)}
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal group-hover:text-navy transition-colors">
            Usar <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>

        {!temFotos && (
          <div className="mt-2 text-[10px] text-navy/60 leading-tight">
            Sem fotos — vai gerar sem imagem. Sobe uma foto pelo Catálogo primeiro.
          </div>
        )}
      </div>
    </button>
  )
}

// ============================================================
// RefinarSelecao — tela 2: escolher foto + tipo
// ============================================================
function RefinarSelecao({
  imovel, tipo, fotoIdx, onTrocarTipo, onTrocarFoto, onCancelar, onConfirmar,
}: {
  imovel: Imovel
  tipo: TipoCriativo
  fotoIdx: number
  onTrocarTipo: (t: TipoCriativo) => void
  onTrocarFoto: (i: number) => void
  onCancelar: () => void
  onConfirmar: () => void
}) {
  const fotos = imovel.imagens || []
  const temFoto = fotos.length > 0

  return (
    <div className="px-5 lg:px-10 pt-6 lg:pt-10 pb-40 lg:pb-32 space-y-6 max-w-5xl">
      {/* HEADER */}
      <div>
        <button
          type="button"
          onClick={onCancelar}
          className="inline-flex items-center gap-1.5 text-[12px] text-teal hover:text-navy"
        >
          <ArrowLeft size={13} />
          Trocar imóvel
        </button>
        <div className="mt-2">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal">
            A partir do catálogo · {imovel.localizacao}
          </div>
          <h1 className="mt-1 font-display text-[22px] lg:text-[26px] font-bold text-navy tracking-tight leading-tight">
            {imovel.titulo}
          </h1>
        </div>
      </div>

      {/* Resumo do que vamos preencher */}
      <div className="rounded-2xl border border-teal/40 p-3 flex items-start gap-2"
           style={{ background: "rgba(86,124,141,0.06)" }}>
        <Sparkles size={13} className="text-teal flex-shrink-0 mt-0.5" />
        <div className="text-[11.5px] text-navy/85 leading-relaxed">
          <b>O que vai ser pré-preenchido:</b> bairro (<b>{imovel.localizacao}</b>){imovel.valor ? <>, preço (<b>{formatarValor(imovel.valor)}</b>)</> : null}{imovel.area ? <>, área (<b>{imovel.area}m²</b>)</> : null}{imovel.quartos ? <>, quartos (<b>{imovel.quartos}</b>)</> : null}{imovel.vagas ? <>, vagas (<b>{imovel.vagas}</b>)</> : null}. Você ajusta tudo depois.
        </div>
      </div>

      {/* Tipo */}
      <div className="rounded-3xl border border-sky/60 bg-white p-5 lg:p-6 space-y-6">
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <LayoutGrid size={11} className="text-teal" />
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-teal">
              1 · Formato do post
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {TIPOS.map((t) => {
              const Icon = t.icon
              const ativo = tipo === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onTrocarTipo(t.id)}
                  className={`rounded-2xl p-3.5 text-left border-2 transition-all ${
                    ativo
                      ? "border-teal shadow-[0_10px_24px_-8px_rgba(47,65,86,0.25)] bg-white"
                      : "border-sky/60 bg-beige/40 hover:border-sky"
                  }`}
                >
                  <span
                    className="w-8 h-8 rounded-lg grid place-items-center text-beige mb-2"
                    style={{ background: ativo ? "linear-gradient(135deg, #2F4156, #567C8D)" : "#CBD5E1" }}
                  >
                    <Icon size={14} strokeWidth={2} />
                  </span>
                  <div className="text-[12.5px] font-bold text-navy">{t.label}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Foto */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <ImageIconAlt size={11} className="text-teal" />
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-teal">
                2 · Qual foto usar?
              </span>
            </div>
            {temFoto && (
              <span className="text-[10.5px] text-teal">
                {fotos.length} foto{fotos.length > 1 ? "s" : ""} no cadastro
              </span>
            )}
          </div>

          {temFoto ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
              {fotos.map((img, i) => {
                const ativa = fotoIdx === i
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onTrocarFoto(i)}
                    className={`relative aspect-[4/5] rounded-xl overflow-hidden border-2 transition-all ${
                      ativa ? "border-teal shadow-[0_8px_18px_-6px_rgba(47,65,86,0.28)]" : "border-sky/40 hover:border-sky"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.src} alt={img.alt || `Foto ${i + 1}`} className="w-full h-full object-cover" />
                    {ativa && (
                      <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-teal text-beige grid place-items-center">
                        <CheckCircle2 size={12} strokeWidth={2.5} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-sky/70 bg-beige/40 p-6 text-center">
              <p className="text-[11.5px] text-navy/80">
                Esse imóvel não tem fotos cadastradas. O criativo vai ser gerado sem imagem (com placeholder).
              </p>
              <p className="text-[10.5px] text-teal mt-1">
                Sobe fotos no <b>/painel/catalogo</b> pra ter uma versão melhor.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-10 border-t border-sky/60 bg-beige/95 backdrop-blur-lg pb-safe">
        <div className="max-w-5xl mx-auto px-5 lg:px-10 py-3 flex items-center gap-3 flex-wrap">
          <button
            onClick={onCancelar}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-navy text-[12px] font-semibold bg-white border border-sky hover:bg-beige"
          >
            <ArrowLeft size={13} /> Voltar
          </button>
          <div className="ml-auto text-[10.5px] text-teal font-medium">
            {tipo} · {temFoto ? "foto " + (fotoIdx + 1) + " selecionada" : "sem foto"}
          </div>
          <button
            onClick={onConfirmar}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-beige text-[12.5px] font-bold"
            style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)", boxShadow: "0 10px 22px -8px rgba(47,65,86,0.45)" }}
          >
            <Sparkles size={14} /> Gerar preview <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Montagem do resultado (equivalente ao parser, mas usando dados do imóvel)
// ============================================================
function montarResultado(imovel: Imovel, tipo: TipoCriativo, foto: string): ResultadoParse {
  const bairro = extrairBairro(imovel.localizacao)
  const preco = imovel.valor ? String(imovel.valor) : ""
  const area = imovel.area ? `${imovel.area}m²` : ""
  const quartos = imovel.quartos ? `${imovel.quartos} quarto${imovel.quartos > 1 ? "s" : ""}` : ""
  const vagas = imovel.vagas ? `${imovel.vagas} vaga${imovel.vagas > 1 ? "s" : ""}` : ""
  const banheiros = imovel.banheiros ? `${imovel.banheiros} banheiro${imovel.banheiros > 1 ? "s" : ""}` : ""
  const caracteristicas = [area, quartos, banheiros, vagas].filter(Boolean).join(", ")

  const avisosBase: string[] = []
  if (!foto) avisosBase.push("Esse imóvel não tem foto cadastrada — o template vai renderizar com placeholder.")
  if (!preco) avisosBase.push("Valor não está cadastrado no catálogo. Preencha manualmente ou atualize o imóvel.")

  // Story
  if (tipo === "story") {
    return {
      templateId: "story-foto-grande",
      dados: {
        foto,
        bairro,
        gancho: gancho1(imovel),
        subtitulo: caracteristicas,
        cta: "Chama no WhatsApp",
      },
      avisos: avisosBase.filter((a) => !a.startsWith("Esse imóvel")).concat(
        !foto ? ["Story precisa de foto vertical — sobe uma no cadastro do imóvel."] : []
      ),
      explicacao: `Story 9:16 com foto grande de "${imovel.titulo}".`,
    }
  }

  // Reels — mesmo template do story visualmente, com aviso
  if (tipo === "reels") {
    return {
      templateId: "story-foto-grande",
      dados: {
        foto,
        bairro,
        gancho: gancho1(imovel),
        subtitulo: caracteristicas,
        cta: "Assista o vídeo",
      },
      avisos: avisosBase.concat([
        "Reels é vídeo — aqui você baixa só a capa/frame estático.",
        "Pra roteiro em vídeo, peça pro Yann via MazyOS.",
      ]),
      explicacao: `Capa de Reels 9:16 (frame estático).`,
    }
  }

  // Post / Carrossel → Imóvel Destaque
  const titulo = imovel.quartos
    ? `${imovel.quartos} quarto${imovel.quartos > 1 ? "s" : ""}${imovel.area ? `, ${imovel.area}m²` : ""}${imovel.vagas ? `, ${imovel.vagas} vaga${imovel.vagas > 1 ? "s" : ""}` : ""}`
    : imovel.titulo

  return {
    templateId: "imovel-destaque",
    dados: {
      foto,
      bairro,
      titulo,
      preco,
      gancho: gancho1(imovel),
      caracteristicas,
    },
    avisos: avisosBase,
    explicacao: `Post "Imóvel destaque" (4:5) usando os dados de "${imovel.titulo}".`,
  }
}

// ============================================================
// Helpers
// ============================================================
function formatarValor(v: number | null): string {
  if (v === null || !isFinite(v) || v <= 0) return "Sob consulta"
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v)
}

function extrairBairro(localizacao: string): string {
  // "Icaraí, Niterói" → "Icaraí"
  // "Icaraí · Niterói" → "Icaraí"
  const partes = localizacao.split(/[,·-]/).map((p) => p.trim()).filter(Boolean)
  return partes[0] || localizacao
}

function gancho1(imovel: Imovel): string {
  // Usa a primeira frase curta do resumo, ou o primeiro diferencial
  const resumo = imovel.resumo?.trim() || ""
  if (resumo && resumo.length <= 60) return resumo
  if (imovel.diferenciais && imovel.diferenciais.length > 0) {
    return imovel.diferenciais[0].trim().slice(0, 60)
  }
  return resumo.slice(0, 60).trim() || ""
}
