"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, ArrowRight, Check, Save, Loader2, AlertCircle, Home, Building2, TrendingUp,
} from "lucide-react"
import type { ACM, AmostraACM, ImovelAlvoACM } from "@/types/acm"
import { computeSugestao } from "@/lib/painel/acm-calc"
import { apiCreateAcm } from "@/lib/painel/acm-api"
import { Step1Alvo } from "./Step1Alvo"
import { Step2Amostras } from "./Step2Amostras"
import { Step3Revisao } from "./Step3Revisao"

type Step = 1 | 2 | 3

const STEPS: { n: Step; label: string; icon: typeof Home }[] = [
  { n: 1, label: "Imóvel-alvo", icon: Home },
  { n: 2, label: "Amostras",    icon: Building2 },
  { n: 3, label: "Revisão",     icon: TrendingUp },
]

function alvoVazio(): ImovelAlvoACM {
  return {
    apelido: "",
    endereco: "",
    bairro: "",
    cidade: "Niterói",
    areaTotal: 0,
    quartos: 0,
    banheiros: 0,
    vagas: 0,
  }
}

export function NovaAcmWizard() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [alvo, setAlvo] = useState<ImovelAlvoACM>(alvoVazio())
  const [amostras, setAmostras] = useState<AmostraACM[]>([])
  const [cenariosAtivos, setCenariosAtivos] = useState<string[]>([])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Cálculo em tempo real — passa pro Step3 e serve pra validar botão "Concluir"
  const calculo = useMemo(
    () => computeSugestao(alvo, amostras, cenariosAtivos),
    [alvo, amostras, cenariosAtivos],
  )

  // ============================================================
  // Validações por passo
  // ============================================================
  const step1Valido = !!(
    alvo.apelido.trim() &&
    alvo.bairro.trim() &&
    alvo.cidade &&
    alvo.areaTotal > 0 &&
    alvo.quartos > 0 &&
    alvo.banheiros > 0
  )

  const amostrasPreenchidas = amostras.filter(
    (a) => a.precoAnuncio > 0 && a.areaTotal > 0
  ).length
  const step2Valido = amostrasPreenchidas >= 2 && amostrasPreenchidas <= 6

  const podeAvancar =
    (step === 1 && step1Valido) ||
    (step === 2 && step2Valido) ||
    step === 3

  // ============================================================
  // Ações
  // ============================================================
  const proximo = useCallback(() => {
    if (!podeAvancar) return
    setErro(null)
    setStep((s) => (s < 3 ? ((s + 1) as Step) : s))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [podeAvancar])

  const voltar = useCallback(() => {
    setErro(null)
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const irPara = useCallback((n: Step) => {
    // Só permite navegar pra passos anteriores livremente; pra frente só se válido
    if (n < step) { setStep(n); window.scrollTo({ top: 0 }); return }
    if (n === 2 && !step1Valido) return
    if (n === 3 && !step2Valido) return
    setStep(n)
    window.scrollTo({ top: 0 })
  }, [step, step1Valido, step2Valido])

  async function salvar(concluir: boolean) {
    if (!step1Valido) { setStep(1); setErro("Preencha o imóvel-alvo antes de salvar."); return }
    setSalvando(true)
    setErro(null)
    try {
      const acm = await apiCreateAcm({
        imovelAlvo: alvo,
        amostras,
        calculo,
        status: concluir ? "concluida" : "rascunho",
      } as Omit<ACM, "id" | "slug" | "criadoEm" | "atualizadoEm">)
      router.push(`/painel/acm/${acm.slug}`)
    } catch (e) {
      setErro((e as Error).message)
      setSalvando(false)
    }
  }

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="pb-40 lg:pb-32">
      <div className="px-5 lg:px-10 pt-6 lg:pt-10 space-y-6 max-w-4xl">
        {/* HEADER */}
        <div>
          <Link href="/painel/acm" className="inline-flex items-center gap-1.5 text-[12px] text-teal hover:text-navy transition-colors">
            <ArrowLeft size={13} />
            Voltar pra lista
          </Link>
          <h1 className="mt-2 font-display text-[24px] lg:text-[30px] font-bold text-navy tracking-tight leading-tight">
            Nova análise comparativa
          </h1>
          <p className="mt-1.5 text-[13px] text-teal leading-relaxed max-w-lg">
            Em 3 passos: identifica o imóvel-alvo, adiciona amostras semelhantes e revisa o valor sugerido antes de fechar.
          </p>
        </div>

        {/* PROGRESS */}
        <ProgressBar step={step} onGoto={irPara} step1Valido={step1Valido} step2Valido={step2Valido} />

        {/* STEP CONTENT */}
        {step === 1 && (
          <Step1Alvo
            alvo={alvo}
            onChange={(patch) => setAlvo((s) => ({ ...s, ...patch }))}
          />
        )}

        {step === 2 && (
          <Step2Amostras
            alvo={alvo}
            amostras={amostras}
            onChange={setAmostras}
          />
        )}

        {step === 3 && (
          <Step3Revisao
            alvo={alvo}
            amostras={amostras}
            cenariosAtivos={cenariosAtivos}
            onCenariosChange={setCenariosAtivos}
            onAmostraChange={(id, patch) => {
              setAmostras((list) => list.map((a) => (a.id === id ? { ...a, ...patch } : a)))
            }}
          />
        )}

        {/* ERRO */}
        {erro && (
          <div className="flex items-start gap-2 p-3 rounded-2xl border" style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.25)" }}>
            <AlertCircle size={14} className="text-red-700 flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-red-800 leading-relaxed">{erro}</p>
          </div>
        )}
      </div>

      {/* BOTTOM BAR STICKY */}
      <div
        className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-10 border-t border-sky/60 bg-beige/95 backdrop-blur-lg pb-safe"
        aria-label="Navegação do wizard"
      >
        <div className="max-w-4xl mx-auto px-5 lg:px-10 py-3 flex items-center gap-2 flex-wrap">
          <button
            onClick={voltar}
            disabled={step === 1 || salvando}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-navy text-[12px] font-semibold bg-white border border-sky hover:bg-beige transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={13} />
            Voltar
          </button>

          <div className="ml-auto flex items-center gap-2 flex-wrap">
            {step >= 2 && (
              <button
                onClick={() => salvar(false)}
                disabled={salvando}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-navy text-[12px] font-bold bg-white border border-sky hover:bg-beige transition-colors disabled:opacity-40"
              >
                {salvando ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Salvar rascunho
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={proximo}
                disabled={!podeAvancar}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-beige text-[12.5px] font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-transform active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)", boxShadow: "0 10px 22px -8px rgba(47,65,86,0.45)" }}
              >
                Próximo
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={() => salvar(true)}
                disabled={salvando || !step2Valido}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-beige text-[12.5px] font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-transform active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)", boxShadow: "0 10px 22px -8px rgba(47,65,86,0.45)" }}
              >
                {salvando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Concluir análise
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Progress bar (3 pontos)
// ============================================================
function ProgressBar({
  step, onGoto, step1Valido, step2Valido,
}: {
  step: Step
  onGoto: (n: Step) => void
  step1Valido: boolean
  step2Valido: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((s, i) => {
        const isCurrent = s.n === step
        const isCompleted = s.n < step
        const canGoto = s.n < step || (s.n === 2 && step1Valido) || (s.n === 3 && step2Valido) || s.n === 1
        const Icon = s.icon

        return (
          <div key={s.n} className="flex items-center gap-2 flex-1">
            <button
              type="button"
              onClick={() => canGoto && onGoto(s.n)}
              disabled={!canGoto}
              className="flex items-center gap-2 group disabled:cursor-not-allowed"
              aria-current={isCurrent ? "step" : undefined}
            >
              <span
                className={`w-9 h-9 rounded-full grid place-items-center text-[12px] font-bold flex-shrink-0 transition-all ${
                  isCurrent
                    ? "text-beige shadow-[0_10px_20px_-6px_rgba(47,65,86,0.5)]"
                    : isCompleted
                      ? "text-beige"
                      : "text-navy/50"
                }`}
                style={
                  isCurrent
                    ? { background: "linear-gradient(135deg, #2F4156, #567C8D)" }
                    : isCompleted
                      ? { background: "#567C8D" }
                      : { background: "rgba(200,217,230,0.6)" }
                }
              >
                {isCompleted ? <Check size={14} strokeWidth={2.5} /> : <Icon size={14} strokeWidth={2} />}
              </span>
              <div className="hidden sm:block text-left">
                <div className={`text-[10px] font-bold uppercase tracking-wider ${isCurrent ? "text-teal" : "text-navy/50"}`}>
                  Passo {s.n}
                </div>
                <div className={`text-[12px] font-semibold ${isCurrent ? "text-navy" : "text-navy/60"}`}>
                  {s.label}
                </div>
              </div>
            </button>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px" style={{ background: isCompleted ? "#567C8D" : "rgba(200,217,230,0.7)" }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
