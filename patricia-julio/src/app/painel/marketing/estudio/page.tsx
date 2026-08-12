"use client"

/**
 * /painel/marketing/estudio — Estúdio prompt-first, LLM-driven.
 *
 * Regra: o corretor descreve o post em linguagem natural. O sistema chama o
 * OpenAI (GPT-4o) por baixo, que compõe HTML + copy novos respeitando a
 * memória (_memoria/*, identidade/*) e a paleta oficial. Playwright fotografa
 * cada slide → PNGs prontos pra baixar.
 *
 * Fluxo do usuário:
 *   1. Escolhe o formato (foto dos corretores · foto do imóvel · só copy)
 *   2. Se for imóvel, pega um do catálogo
 *   3. Escolhe uma persona (opcional — sistema decide se não escolher)
 *   4. Escreve o prompt (1 textarea)
 *   5. Clica Gerar → aguarda ~20-40s → grade de PNGs pra baixar
 */

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft, Sparkles, Loader2, Users, Home as HomeIcon, Type, Download,
  RefreshCw, ExternalLink, AlertCircle, ChevronDown, Building2, Check,
} from "lucide-react"

import { PERSONAS } from "@/data/painel/personas"
import { apiListImoveis } from "@/lib/painel/imoveis-api"
import type { Imovel } from "@/types/imovel"
import type { FormatoPost, TipoCriativo } from "@/types/marketing"

/* ============================================================
 * Formatos — a lista fechada.
 * ============================================================ */
const FORMATOS: {
  id: FormatoPost
  label: string
  short: string
  desc: string
  icon: typeof Users
}[] = [
  { id: "corretores", label: "Com foto dos corretores", short: "Corretores", desc: "Patrícia + Júlio juntos", icon: Users },
  { id: "imovel",     label: "Com foto do imóvel",       short: "Imóvel",     desc: "Puxa do catálogo",       icon: HomeIcon },
  { id: "copy",       label: "Só copy (sem imagem)",     short: "Só copy",    desc: "Criativo textual",       icon: Type },
]

const TIPOS_MIDIA: { id: TipoCriativo; label: string; ratio: string }[] = [
  { id: "post",      label: "Post único",  ratio: "4:5" },
  { id: "carrossel", label: "Carrossel",   ratio: "4:5" },
  { id: "story",     label: "Story",       ratio: "9:16" },
  { id: "reels",     label: "Reels (capa)",ratio: "9:16" },
]

interface SlideGerado {
  versao?: string
  index: number
  filename: string
  url: string
  width?: number
  height?: number
}

interface VersaoPost {
  versao: string
  slides: SlideGerado[]
}

interface RespostaGerar {
  ok?: boolean
  versoes?: VersaoPost[]
  slides?: SlideGerado[]
  legenda?: string
  htmlUrl?: string
  modelo?: string
  tokens?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
  error?: string
  hint?: string
  detail?: string
}

export default function EstudioPage() {
  // Estado do formulário
  const [formato, setFormato] = useState<FormatoPost>("corretores")
  const [tipo, setTipo] = useState<TipoCriativo>("post")
  const [personaId, setPersonaId] = useState<string>("")
  const [imovelSlug, setImovelSlug] = useState<string>("")
  const [prompt, setPrompt] = useState("")

  // Catálogo
  const [imoveis, setImoveis] = useState<Imovel[]>([])
  useEffect(() => {
    apiListImoveis()
      .then((l) => setImoveis(l.filter((i) => i.status !== "vendido")))
      .catch(() => setImoveis([]))
  }, [])

  // Geração
  const [gerando, setGerando] = useState(false)
  const [resultado, setResultado] = useState<RespostaGerar | null>(null)

  const podeGerar =
    !gerando &&
    prompt.trim().length >= 6 &&
    (formato !== "imovel" || !!imovelSlug)

  async function gerar() {
    if (!podeGerar) return
    setGerando(true)
    setResultado(null)
    try {
      const r = await fetch("/api/marketing/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          formato,
          tipo,
          personaId: personaId || undefined,
          imovelSlug: formato === "imovel" ? imovelSlug : undefined,
        }),
      })
      const data: RespostaGerar = await r.json()
      if (!r.ok) {
        setResultado({ error: data.error || `Falhou (${r.status})`, hint: data.hint, detail: data.detail })
      } else {
        setResultado(data)
      }
    } catch (err) {
      setResultado({ error: (err as Error).message })
    } finally {
      setGerando(false)
    }
  }

  const imovelSelecionado = imoveis.find((i) => i.slug === imovelSlug)

  return (
    <div className="px-5 lg:px-10 pt-6 lg:pt-10 pb-32 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="mb-6">
        <Link
          href="/painel/marketing"
          className="inline-flex items-center gap-1.5 text-[12px] text-teal hover:text-navy transition-colors"
        >
          <ArrowLeft size={13} />
          Voltar
        </Link>
        <div className="mt-2 flex items-start gap-3">
          <span
            className="w-11 h-11 rounded-2xl grid place-items-center text-beige flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)" }}
          >
            <Sparkles size={18} strokeWidth={2} />
          </span>
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal">
              Estúdio de Criativos
            </div>
            <h1 className="mt-1 font-display text-[24px] lg:text-[30px] font-bold text-navy tracking-tight leading-tight">
              Descreve o post — sistema cria
            </h1>
            <p className="mt-1.5 text-[13px] text-teal leading-relaxed max-w-xl">
              GPT-4o compõe copy + HTML + layout novos por pedido, com a memória de vocês. Playwright fotografa. Você baixa os PNGs prontos.
            </p>
          </div>
        </div>
      </div>

      {/* FORM */}
      <div className="space-y-5">
        {/* 1. FORMATO */}
        <SecaoBlock numero={1} titulo="Formato do post">
          <div className="grid gap-3 sm:grid-cols-3">
            {FORMATOS.map((f) => {
              const Icon = f.icon
              const ativo = formato === f.id
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormato(f.id)}
                  className={`rounded-2xl p-4 text-left border-2 transition-all ${
                    ativo
                      ? "border-teal shadow-[0_10px_24px_-8px_rgba(47,65,86,0.28)] bg-white"
                      : "border-sky/60 bg-beige/40 hover:border-sky"
                  }`}
                >
                  <span
                    className="w-10 h-10 rounded-xl grid place-items-center text-beige flex-shrink-0 mb-2"
                    style={{ background: ativo ? "linear-gradient(135deg, #2F4156, #567C8D)" : "#CBD5E1" }}
                  >
                    <Icon size={17} strokeWidth={2} />
                  </span>
                  <div className="text-[13px] font-bold text-navy">{f.label}</div>
                  <div className="text-[10.5px] text-teal mt-0.5">{f.desc}</div>
                </button>
              )
            })}
          </div>

          {formato === "imovel" && (
            <div className="mt-4">
              <ImovelPicker
                imoveis={imoveis}
                value={imovelSlug}
                onChange={setImovelSlug}
              />
            </div>
          )}
        </SecaoBlock>

        {/* 2. TIPO DE MÍDIA */}
        <SecaoBlock numero={2} titulo="Tipo de mídia" hint={formato === "copy" ? "Só copy → 1 imagem quadrada com texto (1080×1080)." : undefined}>
          <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-4">
            {TIPOS_MIDIA.map((t) => {
              const ativo = tipo === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTipo(t.id)}
                  className={`rounded-xl p-3 text-left border-2 transition-all ${
                    ativo
                      ? "border-teal bg-white shadow-[0_8px_18px_-6px_rgba(47,65,86,0.24)]"
                      : "border-sky/60 bg-beige/40 hover:border-sky"
                  }`}
                >
                  <div className="text-[12.5px] font-bold text-navy">{t.label}</div>
                  <div className="text-[10.5px] text-teal">{t.ratio}</div>
                </button>
              )
            })}
          </div>
        </SecaoBlock>

        {/* 3. PROMPT */}
        <SecaoBlock
          numero={3}
          titulo="Descreve o post"
          hint="Como se você tivesse dizendo pra um designer. O que quer, tom, o que não quer, CTA."
        >
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={placeholderPorFormato(formato)}
            rows={6}
            className="w-full px-4 py-3 rounded-2xl bg-beige border-2 border-sky text-navy text-[14px] leading-relaxed outline-none focus:border-teal focus:ring-[3px] focus:ring-teal/15 transition-all resize-y font-medium"
            style={{ minHeight: "170px" }}
            disabled={gerando}
          />
        </SecaoBlock>

        {/* 4. PERSONA (OPCIONAL) */}
        <SecaoBlock
          numero={4}
          titulo="Persona-alvo (opcional)"
          hint="Se deixar em branco, o GPT escolhe pelo texto do prompt."
        >
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {PERSONAS.map((p) => {
              const ativa = personaId === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPersonaId(ativa ? "" : p.id)}
                  className={`rounded-xl p-2.5 text-left border transition-all ${
                    ativa
                      ? "border-teal bg-white shadow-[0_6px_14px_-6px_rgba(47,65,86,0.2)]"
                      : "border-sky/60 bg-beige/40 hover:border-sky"
                  }`}
                >
                  <div className="text-[12px] font-bold text-navy leading-tight">{p.name}</div>
                  <div className="text-[10px] text-teal mt-0.5">
                    {p.age[0]}–{p.age[1]}a · R$ {(p.incomeBrl[0] / 1000).toFixed(0)}k+
                  </div>
                </button>
              )
            })}
          </div>
        </SecaoBlock>

        {/* AÇÃO */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={gerar}
            disabled={!podeGerar}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-beige text-[14px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #2F4156, #567C8D)",
              boxShadow: "0 12px 26px -10px rgba(47,65,86,0.5)",
            }}
          >
            {gerando ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {gerando ? "Gerando… (20-40s)" : "Gerar post"}
          </button>

          {gerando && (
            <div className="text-[11px] text-teal">
              GPT-4o escrevendo copy e HTML · Playwright fotografando…
            </div>
          )}
        </div>

        {/* RESULTADO / ERRO */}
        {resultado?.error && (
          <div className="mt-2 flex items-start gap-2 p-4 rounded-2xl border"
            style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.25)" }}>
            <AlertCircle size={16} className="text-red-700 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-[13px] font-semibold text-red-800">{resultado.error}</p>
              {resultado.hint && <p className="text-[11.5px] text-red-700/90">{resultado.hint}</p>}
              {resultado.detail && (
                <details className="text-[11px] text-red-700/80">
                  <summary className="cursor-pointer">detalhe técnico</summary>
                  <pre className="whitespace-pre-wrap mt-1">{resultado.detail}</pre>
                </details>
              )}
            </div>
          </div>
        )}

        {resultado?.slides && resultado.slides.length > 0 && (
          <ResultadoBlock resultado={resultado} onGerarDeNovo={gerar} />
        )}
      </div>
    </div>
  )
}

/* ============================================================
 * Sub-componentes
 * ============================================================ */

function SecaoBlock({
  numero, titulo, hint, children,
}: {
  numero: number
  titulo: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-3xl border border-sky/60 bg-white p-4 lg:p-5">
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal">
          {numero} ·
        </span>
        <h2 className="font-display text-[16px] font-bold text-navy leading-tight">
          {titulo}
        </h2>
      </div>
      {hint && <p className="text-[11px] text-teal mb-3 -mt-1.5 leading-relaxed">{hint}</p>}
      {children}
    </section>
  )
}

function ImovelPicker({
  imoveis, value, onChange,
}: {
  imoveis: Imovel[]
  value: string
  onChange: (slug: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selecionado = imoveis.find((i) => i.slug === value)

  if (imoveis.length === 0) {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11.5px] text-amber-800">
        <b>Sem imóveis no catálogo.</b> Cadastre em{" "}
        <Link href="/painel/catalogo" className="underline font-semibold">/painel/catalogo</Link>.
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-2xl bg-white border-2 border-sky/60 hover:border-teal transition-colors p-3 flex items-center gap-3 text-left"
      >
        <div className="w-12 h-12 rounded-lg bg-sky/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {selecionado?.imagens[0]?.src ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={selecionado.imagens[0].src} alt="" className="w-full h-full object-cover" />
          ) : (
            <Building2 size={16} className="text-teal" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-navy truncate">
            {selecionado?.titulo || "Escolha um imóvel"}
          </div>
          <div className="text-[11px] text-teal truncate">
            {selecionado?.localizacao || `${imoveis.length} disponíveis no catálogo`}
          </div>
        </div>
        <ChevronDown size={16} className={`text-teal transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-20 mt-2 left-0 right-0 max-h-72 overflow-y-auto rounded-2xl bg-white border-2 border-sky shadow-xl">
          {imoveis.map((i) => (
            <button
              key={i.slug}
              type="button"
              onClick={() => { onChange(i.slug); setOpen(false) }}
              className={`w-full flex items-center gap-3 p-3 text-left hover:bg-beige/60 ${
                i.slug === value ? "bg-beige" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-sky/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {i.imagens[0]?.src ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={i.imagens[0].src} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Building2 size={14} className="text-teal" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-bold text-navy truncate">{i.titulo}</div>
                <div className="text-[10.5px] text-teal truncate">
                  {i.localizacao}
                  {i.valor && <> · R$ {i.valor.toLocaleString("pt-BR")}</>}
                </div>
              </div>
              {i.slug === value && <Check size={14} className="text-teal flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ResultadoBlock({
  resultado, onGerarDeNovo,
}: {
  resultado: RespostaGerar
  onGerarDeNovo: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [slideAtual, setSlideAtual] = useState(0)
  const [versaoAtual, setVersaoAtual] = useState(0)
  
  // Determina se temos múltiplas versões (post único com 5 variações)
  const versoes = resultado.versoes || []
  const temMultiplasVersoes = versoes.length > 1
  
  // Se tem versões estruturadas, usa elas; senão usa slides antigo
  const slides = temMultiplasVersoes 
    ? versoes[versaoAtual]?.slides || []
    : resultado.slides || []
  
  const isCarrossel = slides.length > 1

  // Auto-play entre versões (troca a cada 3 segundos)
  useEffect(() => {
    if (!temMultiplasVersoes) return
    
    const intervalo = setInterval(() => {
      setVersaoAtual((prev) => (prev + 1) % versoes.length)
    }, 3000)
    
    return () => clearInterval(intervalo)
  }, [temMultiplasVersoes, versoes.length])

  async function baixarTodos() {
    // Se tem múltiplas versões, baixa todas
    const todosSlides = temMultiplasVersoes
      ? versoes.flatMap(v => v.slides)
      : slides
      
    for (const s of todosSlides) {
      const a = document.createElement("a")
      a.href = s.url
      a.download = s.filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      await new Promise((r) => setTimeout(r, 200))
    }
  }

  function proximoSlide() {
    setSlideAtual((prev) => (prev + 1) % slides.length)
  }

  function slideAnterior() {
    setSlideAtual((prev) => (prev - 1 + slides.length) % slides.length)
  }

  return (
    <section className="rounded-3xl border-2 border-teal/40 bg-white p-5 lg:p-6"
      style={{ background: "linear-gradient(135deg, #FFFFFF 0%, #F5EFEB 100%)" }}>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal/15 text-[10px] font-bold uppercase tracking-wider text-teal mb-2">
            <Sparkles size={11} />
            Pronto
          </div>
          <h2 className="font-display text-[20px] font-bold text-navy leading-tight">
            {temMultiplasVersoes 
              ? `${versoes.length} versões geradas`
              : `${slides.length} slide${slides.length !== 1 ? "s" : ""} gerado${slides.length !== 1 ? "s" : ""}`
            }
          </h2>
          <p className="text-[11.5px] text-teal mt-1">
            {temMultiplasVersoes && (
              <span className="font-semibold">Auto-play ativo · </span>
            )}
            Modelo: {resultado.modelo} · {resultado.tokens?.total_tokens ?? "?"} tokens
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={baixarTodos}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-beige text-[12px] font-bold"
            style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)" }}
          >
            <Download size={13} />
            Baixar {temMultiplasVersoes ? "todas" : "todos"}
          </button>
          <button
            onClick={onGerarDeNovo}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-navy text-[12px] font-semibold bg-white border border-sky hover:bg-beige"
          >
            <RefreshCw size={13} />
            Gerar outra versão
          </button>
          {resultado.htmlUrl && (
            <a
              href={resultado.htmlUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-teal text-[11.5px] font-semibold hover:bg-white/60"
            >
              <ExternalLink size={12} />
              Ver HTML
            </a>
          )}
        </div>
      </div>

      {/* Preview Estilo Instagram */}
      <div className="mb-5 flex justify-center">
        <div className="w-full max-w-[420px] rounded-3xl overflow-hidden border-2 border-navy/10 bg-white shadow-2xl">
          {/* Header Instagram */}
          <div className="flex items-center gap-2.5 p-3 border-b border-gray-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal to-navy flex items-center justify-center text-beige text-[13px] font-bold">
              PJ
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-gray-900">julio_e_patricia_corretores</div>
              <div className="text-[11px] text-gray-500">Niterói · Maricá · RJ</div>
            </div>
            <button className="text-gray-900 text-[20px] font-bold">⋯</button>
          </div>

          {/* Imagem com Carrossel */}
          <div className="relative aspect-[4/5] bg-beige overflow-hidden">
            {/* Slide Atual */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slides[slideAtual]?.url}
              alt={`Slide ${slideAtual + 1}`}
              className="w-full h-full object-cover"
            />

            {/* Indicador de Versão (quando tem múltiplas versões) */}
            {temMultiplasVersoes && (
              <div className="absolute top-3 right-3 bg-navy/90 text-beige text-[10px] font-bold px-2.5 py-1.5 rounded-full z-20">
                Versão {versaoAtual + 1}/{versoes.length}
              </div>
            )}

            {/* Setas de Navegação (só aparecem se for carrossel) */}
            {isCarrossel && (
              <>
                {/* Seta Esquerda */}
                {slideAtual > 0 && (
                  <button
                    onClick={slideAnterior}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-gray-800 hover:bg-white transition-all z-10"
                    aria-label="Slide anterior"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="transform rotate-180">
                      <path d="M4 1L9 6L4 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}

                {/* Seta Direita */}
                {slideAtual < slides.length - 1 && (
                  <button
                    onClick={proximoSlide}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-gray-800 hover:bg-white transition-all z-10"
                    aria-label="Próximo slide"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M4 1L9 6L4 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}

                {/* Indicadores de Slide (bolinhas no topo) */}
                <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSlideAtual(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === slideAtual
                          ? "w-7 bg-white"
                          : "w-1.5 bg-white/60 hover:bg-white/80"
                      }`}
                      aria-label={`Ir para slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Botões de Controle de Versão (quando tem múltiplas) */}
            {temMultiplasVersoes && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-10">
                {versoes.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setVersaoAtual(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === versaoAtual
                        ? "bg-white scale-125"
                        : "bg-white/50 hover:bg-white/75"
                    }`}
                    aria-label={`Ver versão ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer Instagram */}
          <div className="p-3 space-y-2">
            {/* Ações */}
            <div className="flex items-center gap-4">
              <button className="text-[24px]">♡</button>
              <button className="text-[24px]">💬</button>
              <button className="text-[24px]">✈️</button>
              <button className="ml-auto text-[24px]">🔖</button>
            </div>

            {/* Curtidas */}
            <div className="text-[13px] font-semibold text-gray-900">
              12.847 curtidas
            </div>

            {/* Legenda Preview */}
            {resultado.legenda && (
              <div className="text-[13px] text-gray-900">
                <span className="font-semibold">julio_e_patricia_corretores</span>{" "}
                <span className="text-gray-700">
                  {resultado.legenda.split("\n")[0].slice(0, 80)}
                  {resultado.legenda.length > 80 && "..."}
                </span>
              </div>
            )}

            <button className="text-[13px] text-gray-500">Ver todos os comentários</button>
            <div className="text-[10px] text-gray-400 uppercase">Há 1 hora</div>
          </div>
        </div>
      </div>

      {/* Grade de Thumbnails por Versão */}
      {temMultiplasVersoes && (
        <div className="mb-5 space-y-4">
          {versoes.map((versao, vIdx) => (
            <div key={versao.versao}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-teal">
                  Versão {vIdx + 1} - {versao.versao}
                </h3>
                <button
                  onClick={() => setVersaoAtual(vIdx)}
                  className="text-[11px] font-semibold text-teal hover:text-navy"
                >
                  {vIdx === versaoAtual ? "✓ Visualizando" : "Ver"}
                </button>
              </div>
              <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
                {versao.slides.map((s, idx) => (
                  <a
                    key={s.filename}
                    href={s.url}
                    download={s.filename}
                    className="group block rounded-xl overflow-hidden border border-sky/50 bg-beige hover:border-teal transition-all relative"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.url} alt={s.filename} className="w-full h-auto block" />
                    <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/10 transition-colors flex items-center justify-center">
                      <Download size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                    <div className="absolute bottom-1 right-1 bg-navy/80 text-beige text-[9px] font-bold px-1.5 py-0.5 rounded">
                      {idx + 1}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grade de Thumbnails (carrossel ou post único sem versões) */}
      {!temMultiplasVersoes && slides.length > 0 && (
        <div className="mb-5">
          <h3 className="text-[12px] font-bold uppercase tracking-wider text-teal mb-3">Download individual</h3>
          <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
            {slides.map((s, idx) => (
              <a
                key={s.filename}
                href={s.url}
                download={s.filename}
                className="group block rounded-xl overflow-hidden border border-sky/50 bg-beige hover:border-teal transition-all relative"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.url} alt={s.filename} className="w-full h-auto block" />
                <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/10 transition-colors flex items-center justify-center">
                  <Download size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                </div>
                <div className="absolute bottom-1 right-1 bg-navy/80 text-beige text-[9px] font-bold px-1.5 py-0.5 rounded">
                  {idx + 1}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Legenda Completa */}
      {resultado.legenda && (
        <div className="rounded-2xl border border-sky/50 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal">
              Legenda sugerida (Instagram)
            </span>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(resultado.legenda || "")
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1500)
                } catch {}
              }}
              className="text-[11px] font-semibold text-teal hover:text-navy"
            >
              {copied ? "✓ Copiado" : "Copiar"}
            </button>
          </div>
          <pre className="whitespace-pre-wrap text-[12px] text-navy leading-relaxed font-sans">
            {resultado.legenda}
          </pre>
        </div>
      )}
    </section>
  )
}

function placeholderPorFormato(formato: FormatoPost): string {
  switch (formato) {
    case "corretores":
      return `Ex.: "carrossel de 5 slides apresentando a gente pra família que tá saindo do aluguel em Niterói. tom acolhedor. mostrar que atendemos junto — casal atende casal. CTA final: chama no WhatsApp que a gente monta um tour."`
    case "imovel":
      return `Ex.: "post pra vender esse imóvel pra família em upgrade. destacar o jardim e o condomínio fechado. sem clichê imobiliário. CTA: agende visita."`
    case "copy":
      return `Ex.: "post reflexivo sobre por que uma família 7-15k não deveria mais pagar aluguel em 2026. tom conversa de amiga, 3 parágrafos curtos, sem exclamação. fecha convidando pra chamar."`
  }
}
