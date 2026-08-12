"use client"

import { Smartphone, Share2, PlusSquare, X, Download } from "lucide-react"
import { usePwaInstall } from "@/hooks/painel/usePwaInstall"

/**
 * Popup discreto que aparece após 3-4s sugerindo instalar como app.
 * Chrome/Android: usa beforeinstallprompt (botão dispara o prompt nativo).
 * iOS Safari: mostra passo-a-passo Share → Adicionar à Tela de Início.
 */
export function InstallPwaModal() {
  const { visible, installed, install, dismiss, isIos, canPrompt } = usePwaInstall()

  if (installed || !visible) return null

  return (
    <div
      className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center px-4 sm:px-6 pb-4 pointer-events-none"
      style={{ animation: "fadeIn 320ms ease" }}
    >
      <div
        className="pointer-events-auto w-full max-w-[420px] rounded-3xl overflow-hidden bg-beige border border-sky/60 shadow-[0_30px_60px_-12px_rgba(15,23,42,0.35)]"
        style={{ animation: "slideUp 380ms cubic-bezier(0.23,1,0.32,1)" }}
      >
        <div className="relative p-5" style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)" }}>
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 w-7 h-7 grid place-items-center rounded-full bg-beige/15 text-beige hover:bg-beige/25"
            aria-label="Fechar"
          >
            <X size={13} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl grid place-items-center bg-beige/15 border border-beige/25">
              <Smartphone size={20} className="text-beige" strokeWidth={2} />
            </div>
            <div>
              <div className="text-beige font-display font-bold text-[16px] leading-tight">Adicione ao seu celular</div>
              <div className="text-beige/75 text-[11.5px] mt-0.5">Painel abre em tela cheia, offline e sem navegador.</div>
            </div>
          </div>
        </div>

        {isIos ? (
          <div className="p-5 space-y-3">
            <p className="text-[12.5px] text-navy leading-relaxed">
              No <strong>Safari do iPhone</strong>, é só seguir:
            </p>
            <ol className="space-y-2.5">
              <Step n={1} icon={Share2}>Toque no botão <strong>Compartilhar</strong> na barra de baixo</Step>
              <Step n={2} icon={PlusSquare}>Escolha <strong>Adicionar à Tela de Início</strong></Step>
              <Step n={3} icon={Smartphone}>Confirme e o ícone aparece na tela inicial</Step>
            </ol>
            <div className="flex gap-2 pt-2">
              <button onClick={dismiss} className="flex-1 h-11 rounded-xl bg-white border border-sky/60 text-navy text-[12.5px] font-semibold">Entendi</button>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <p className="text-[12.5px] text-navy leading-relaxed">
              Instalação instantânea. Depois é só abrir pelo ícone na sua tela inicial — sem digitar URL, sem depender de navegador.
            </p>
            <div className="flex gap-2">
              <button onClick={dismiss} className="flex-1 h-11 rounded-xl bg-white border border-sky/60 text-navy text-[12.5px] font-semibold">
                Agora não
              </button>
              <button
                onClick={install}
                disabled={!canPrompt}
                className="flex-1 h-11 rounded-xl text-beige text-[12.5px] font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #2F4156, #567C8D)" }}
              >
                <Download size={14} strokeWidth={2.2} />
                Instalar
              </button>
            </div>
            {!canPrompt && (
              <p className="text-[10.5px] text-teal text-center">
                O navegador ainda não permitiu instalação nativa — tente pelo menu ⋮ → Adicionar à tela inicial.
              </p>
            )}
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  )
}

function Step({ n, icon: Icon, children }: { n: number; icon: typeof Share2; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 p-3 rounded-xl bg-white border border-sky/60">
      <div className="w-8 h-8 rounded-lg grid place-items-center bg-sky text-navy">
        <Icon size={15} strokeWidth={2} />
      </div>
      <div className="text-[12px] text-navy flex-1"><span className="font-bold text-teal">{n}.</span> {children}</div>
    </li>
  )
}
