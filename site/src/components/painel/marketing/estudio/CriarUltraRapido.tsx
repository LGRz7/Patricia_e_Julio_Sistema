"use client"

/**
 * CriarUltraRapido.tsx — Modo ULTRA SIMPLIFICADO
 * 
 * UMA ÚNICA TEXTAREA onde o corretor descreve TUDO que quer.
 * Sistema gera automaticamente SEM perguntar persona, tipo, nada.
 * Depois pode editar o resultado descrevendo mudanças.
 */

import { useState } from "react"
import { ArrowLeft, Sparkles, Loader2, Wand2 } from "lucide-react"
import { analisarPedidoLivre, type EntradaParse, type ResultadoParse } from "@/lib/painel/marketing-parser"

interface Props {
  onGerar: (resultado: ResultadoParse) => void
  onVoltar: () => void
}

const EXEMPLOS = [
  "Post de apartamento em Icaraí, 2 quartos, 78m², R$ 620 mil, vista mar",
  "Story sobre financiamento: prestação de R$ 2100 é melhor que aluguel de R$ 2500",
  "Carrossel com 3 dicas sobre morar em Piratininga",
  "Post de lançamento em Itaipuaçu, apartamentos a partir de R$ 350 mil",
]

export function CriarUltraRapido({ onGerar, onVoltar }: Props) {
  const [texto, setTexto] = useState("")
  const [gerando, setGerando] = useState(false)
  const [exemploIdx] = useState(() => Math.floor(Math.random() * EXEMPLOS.length))

  const podeGerar = texto.trim().length >= 10

  function gerar() {
    if (!podeGerar) return
    setGerando(true)
    try {
      // Sistema decide TUDO automaticamente
      const entrada: EntradaParse = {
        tipo: "post", // Default, o parser pode mudar baseado no texto
        texto: texto.trim(),
        personaId: "upgrade-familiar", // Default inteligente
      }
      const resultado = analisarPedidoLivre(entrada)
      onGerar(resultado)
    } finally {
      setGerando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-3xl space-y-6">
        {/* HEADER MINIMALISTA */}
        <div className="text-center space-y-3">
          <div 
            className="w-20 h-20 mx-auto rounded-3xl grid place-items-center text-beige"
            style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)" }}
          >
            <Wand2 size={32} strokeWidth={2} />
          </div>
          
          <div>
            <h1 className="font-display text-[32px] lg:text-[42px] font-bold text-navy tracking-tight leading-tight">
              Descreve o post que você quer
            </h1>
            <p className="mt-3 text-[15px] text-teal leading-relaxed max-w-xl mx-auto">
              Escreve como você falaria comigo. Sistema cria automaticamente e depois você pode pedir ajustes.
            </p>
          </div>
        </div>

        {/* TEXTAREA GIGANTE */}
        <div className="rounded-3xl border-2 border-sky/60 bg-white p-6 lg:p-8 space-y-4">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={`Exemplo: ${EXEMPLOS[exemploIdx]}\n\nOu descreve do seu jeito...`}
            rows={8}
            autoFocus
            className="w-full px-5 py-4 rounded-2xl bg-beige/60 border border-sky text-navy text-[16px] leading-relaxed outline-none focus:border-teal focus:ring-[4px] focus:ring-teal/15 transition-all resize-y font-medium"
            style={{ minHeight: "240px" }}
          />

          <div className="flex items-center gap-3 text-[12px] text-navy/60">
            <Sparkles size={14} className="text-teal flex-shrink-0" />
            <span className="leading-relaxed">
              O sistema identifica automaticamente: tipo de post, bairro, preço, características e escolhe o template perfeito.
            </span>
          </div>
        </div>

        {/* BOTÕES */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={onVoltar}
            disabled={gerando}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-navy text-[14px] font-bold bg-white border-2 border-sky hover:border-teal transition-colors disabled:opacity-40"
          >
            <ArrowLeft size={16} /> Voltar
          </button>

          <button
            onClick={gerar}
            disabled={!podeGerar || gerando}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-beige text-[15px] font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-xl"
            style={{
              background: "linear-gradient(135deg, #2F4156, #567C8D)",
            }}
          >
            {gerando ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Criando seu post...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Criar Post
              </>
            )}
          </button>
        </div>

        {/* NOTA DE RODAPÉ */}
        <p className="text-center text-[11px] text-teal opacity-75">
          Depois de criar, você pode pedir mudanças descrevendo o que quer ajustar
        </p>
      </div>
    </div>
  )
}
