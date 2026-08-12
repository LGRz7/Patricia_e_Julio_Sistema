"use client"

/**
 * CriarRapido.tsx — Modo "do zero" do Estúdio.
 * Corretor descreve o post em texto livre + tipo + persona.
 * O parser (marketing-parser.ts) escolhe o template certo e pré-preenche
 * os campos, abrindo o editor pronto pra ajuste + download.
 */

import { forwardRef, useRef, useState } from "react"
import {
  ArrowLeft, ArrowRight, Sparkles, Loader2, Image as ImageIcon, Trash2, PenLine,
  LayoutGrid, Video, MessageCircle, Image as ImageIconAlt, Users, Lightbulb,
} from "lucide-react"

import { PERSONAS } from "@/data/painel/personas"
import { analisarPedidoLivre, type EntradaParse, type ResultadoParse } from "@/lib/painel/marketing-parser"
import type { TipoCriativo } from "@/types/marketing"

const TIPOS: { id: TipoCriativo; label: string; desc: string; icon: typeof LayoutGrid }[] = [
  { id: "post",      label: "Post único",  desc: "1 imagem no feed",         icon: MessageCircle },
  { id: "carrossel", label: "Carrossel",   desc: "3-8 slides no feed",       icon: LayoutGrid },
  { id: "story",     label: "Story",       desc: "24h · vertical 9:16",      icon: ImageIconAlt },
  { id: "reels",     label: "Reels",       desc: "vídeo curto (só capa aqui)", icon: Video },
]

// Exemplos de brief pra popular o placeholder rotativo
const EXEMPLOS = [
  "vista permanente em Icaraí, 2 quartos, 78m², a partir de 620 mil",
  "aluguel 2500, prestação 2100 em Fonseca, financiamento com FGTS",
  "3 coisas que ninguém te conta sobre morar em Piratininga",
  "novo lançamento em Itaipuaçu, 350 mil, 1 vaga, entrega em 18 meses",
]

interface Props {
  onGerar: (resultado: ResultadoParse) => void
  onVoltar: () => void
}

export function CriarRapido({ onGerar, onVoltar }: Props) {
  const [tipo, setTipo] = useState<TipoCriativo>("post")
  const [texto, setTexto] = useState("")
  const [personaId, setPersonaId] = useState<string>("upgrade-familiar")
  const [foto, setFoto] = useState<string>("")
  const [fotoLoading, setFotoLoading] = useState(false)
  const [gerando, setGerando] = useState(false)
  const inputFotoRef = useRef<HTMLInputElement>(null)
  const [exemploIdx] = useState(() => Math.floor(Math.random() * EXEMPLOS.length))

  const podeGerar = tipo !== null && texto.trim().length >= 4 && !!personaId

  async function onEscolherFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      alert("Precisa ser uma imagem.")
      return
    }
    setFotoLoading(true)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader()
        fr.onload = () => resolve(String(fr.result || ""))
        fr.onerror = () => reject(new Error("Falha ao ler arquivo"))
        fr.readAsDataURL(file)
      })
      setFoto(dataUrl)
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setFotoLoading(false)
      if (inputFotoRef.current) inputFotoRef.current.value = ""
    }
  }

  function limparFoto() {
    setFoto("")
    if (inputFotoRef.current) inputFotoRef.current.value = ""
  }

  function gerar() {
    if (!podeGerar) return
    setGerando(true)
    try {
      const entrada: EntradaParse = {
        tipo,
        texto: texto.trim(),
        personaId,
        foto: foto || undefined,
      }
      const resultado = analisarPedidoLivre(entrada)
      onGerar(resultado)
    } finally {
      setGerando(false)
    }
  }

  return (
    <div className="px-5 lg:px-10 pt-6 lg:pt-10 pb-40 lg:pb-32 space-y-6 max-w-4xl">
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
            <PenLine size={18} strokeWidth={2} />
          </span>
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal">
              Criar do zero
            </div>
            <h1 className="mt-1 font-display text-[22px] lg:text-[28px] font-bold text-navy tracking-tight leading-tight">
              Descreve o post que você quer
            </h1>
            <p className="mt-1.5 text-[12.5px] text-teal leading-relaxed max-w-lg">
              O sistema lê seu texto, escolhe o template certo e já preenche os campos. Você só ajusta o que quiser antes de baixar.
            </p>
          </div>
        </div>
      </div>

      {/* FORM */}
      <div className="rounded-3xl border border-sky/60 bg-white p-5 lg:p-6 space-y-6">
        {/* Tipo */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <LayoutGrid size={11} className="text-teal" />
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-teal">
              1 · Que tipo?
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
                  onClick={() => setTipo(t.id)}
                  className={`rounded-2xl p-3.5 text-left border-2 transition-all ${
                    ativo
                      ? "border-teal shadow-[0_10px_24px_-8px_rgba(47,65,86,0.25)] bg-white"
                      : "border-sky/60 bg-beige/40 hover:border-sky"
                  }`}
                  aria-pressed={ativo}
                >
                  <span
                    className="w-8 h-8 rounded-lg grid place-items-center text-beige mb-2"
                    style={{ background: ativo ? "linear-gradient(135deg, #2F4156, #567C8D)" : "#CBD5E1" }}
                  >
                    <Icon size={14} strokeWidth={2} />
                  </span>
                  <div className="text-[12.5px] font-bold text-navy">{t.label}</div>
                  <div className="text-[10px] text-teal mt-0.5">{t.desc}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Texto livre */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <PenLine size={11} className="text-teal" />
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-teal">
              2 · Sobre o quê?
            </span>
          </div>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={`Ex: ${EXEMPLOS[exemploIdx]}`}
            rows={4}
            className="w-full px-4 py-3 rounded-2xl bg-beige border border-sky text-navy text-[13.5px] leading-relaxed outline-none focus:border-teal focus:ring-[3px] focus:ring-teal/15 transition-all resize-y"
          />
          <div className="mt-1.5 flex items-start gap-1.5 text-[10.5px] text-navy/60 leading-relaxed">
            <Lightbulb size={10} className="text-teal flex-shrink-0 mt-0.5" />
            <span>
              Escreva como você falaria. O sistema procura por bairro, preço, quartos, área, palavras como &quot;vista&quot;, &quot;lançamento&quot;, &quot;aluguel&quot;, &quot;guia&quot; e escolhe o template certo automaticamente.
            </span>
          </div>
        </div>

        {/* Persona */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Users size={11} className="text-teal" />
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-teal">
              3 · Pra qual persona?
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {PERSONAS.map((p) => {
              const ativa = personaId === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPersonaId(p.id)}
                  className={`rounded-2xl p-3 text-left border transition-all ${
                    ativa
                      ? "border-teal shadow-[0_8px_18px_-6px_rgba(47,65,86,0.28)] bg-white"
                      : "border-sky/60 bg-beige/40 hover:border-sky"
                  }`}
                  aria-pressed={ativa}
                >
                  <div className="text-[12.5px] font-bold text-navy leading-tight">
                    {p.name}
                  </div>
                  <div className="text-[10px] text-teal mt-0.5">
                    {p.age[0]}–{p.age[1]} anos · R$ {(p.incomeBrl[0] / 1000).toFixed(0)}k+
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Foto opcional — abordagem defensiva:
            input file visível estilizado (sem esconder), garantindo que o
            clique nativo funcione em qualquer browser/PWA. Preview do arquivo
            escolhido aparece abaixo. */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <ImageIcon size={11} className="text-teal" />
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-teal">
              4 · Foto (opcional)
            </span>
          </div>

          {foto ? (
            <div className="space-y-2 max-w-md">
              <div className="rounded-2xl border border-sky bg-beige/60 overflow-hidden">
                <div className="relative aspect-[4/5] max-h-[220px] bg-sky/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={foto} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center justify-between gap-2 p-2.5">
                  <span className="text-[11px] font-semibold text-teal inline-flex items-center gap-1">
                    <ImageIcon size={12} /> Foto carregada
                  </span>
                  <button
                    type="button"
                    onClick={limparFoto}
                    className="text-[11px] font-semibold text-red-700 hover:text-red-900 inline-flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Remover
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-teal">
                Pra trocar, escolha outra foto no botão abaixo.
              </p>
              <FileInputEstilizado ref={inputFotoRef} onChange={onEscolherFoto} carregando={fotoLoading} labelTroca />
            </div>
          ) : (
            <FileInputEstilizado ref={inputFotoRef} onChange={onEscolherFoto} carregando={fotoLoading} />
          )}
        </div>
      </div>

      {/* BOTTOM BAR STICKY (o input file foi removido daqui — vive dentro do FileInputEstilizado) */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-10 border-t border-sky/60 bg-beige/95 backdrop-blur-lg pb-safe">
        <div className="max-w-4xl mx-auto px-5 lg:px-10 py-3 flex items-center gap-3 flex-wrap">
          <button
            onClick={onVoltar}
            disabled={gerando}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-navy text-[12px] font-semibold bg-white border border-sky hover:bg-beige transition-colors disabled:opacity-40"
          >
            <ArrowLeft size={13} /> Voltar
          </button>

          <div className="ml-auto text-[10.5px] text-teal font-medium">
            {podeGerar
              ? `${tipo} · ${PERSONAS.find((p) => p.id === personaId)?.name}${foto ? " · com foto" : ""}`
              : "Preencha o tipo, o texto e a persona"}
          </div>

          <button
            onClick={gerar}
            disabled={!podeGerar || gerando}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-beige text-[12.5px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #2F4156, #567C8D)",
              boxShadow: "0 10px 22px -8px rgba(47,65,86,0.45)",
            }}
          >
            {gerando ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {gerando ? "Analisando..." : "Gerar preview"}
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}


// ============================================================
// FileInputEstilizado — input file NATIVO visível estilizado.
//
// Abordagem: NÃO esconde o input. Mostra ele como uma zona clicável
// grande, e usa CSS ::file-selector-button pra estilizar o botão nativo.
// Isso funciona em 100% dos browsers, incluindo Safari iOS em modo PWA
// (onde `<button onClick={ref.click()}>` ou `<label htmlFor>` podem
// falhar silenciosamente por causa de restrições de user-gesture).
// ============================================================

interface FileInputProps {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  carregando?: boolean
  labelTroca?: boolean
}

const FileInputEstilizado = forwardRef<HTMLInputElement, FileInputProps>(
  function FileInputEstilizado({ onChange, carregando, labelTroca }, ref) {
    return (
      <div
        className={`w-full max-w-md rounded-2xl border-2 border-dashed border-sky bg-beige/50 hover:bg-white hover:border-teal transition-colors ${
          carregando ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-2 py-6 px-4">
          {carregando ? (
            <Loader2 size={22} className="text-teal animate-spin" />
          ) : (
            <>
              <span className="w-11 h-11 rounded-full grid place-items-center bg-white text-teal">
                <ImageIcon size={18} />
              </span>
              <span className="text-[12.5px] font-bold text-navy">
                {labelTroca ? "Trocar foto" : "Escolher foto"}
              </span>
              <span className="text-[10.5px] text-teal text-center">
                Toca no botão abaixo · JPG ou PNG · do celular ou computador
              </span>
            </>
          )}

          {/* Input nativo estilizado — o próprio input tem que ser clicável */}
          <input
            ref={ref}
            type="file"
            accept="image/*"
            onChange={onChange}
            disabled={carregando}
            className="block w-full text-[11.5px] text-navy mt-3
              file:mr-3 file:cursor-pointer
              file:rounded-full file:border-0
              file:bg-navy file:text-beige
              file:px-4 file:py-2
              file:text-[11.5px] file:font-bold
              file:tracking-wider file:uppercase
              hover:file:bg-teal
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    )
  }
)
