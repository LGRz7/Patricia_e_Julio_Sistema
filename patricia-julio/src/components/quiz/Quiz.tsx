"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { perguntasQuiz } from "@/data/quiz";
import { linkWhatsapp, mensagemQuiz } from "@/lib/whatsapp";
import { WhatsappIcon } from "@/components/ui/WhatsappIcon";

const ease = [0.16, 1, 0.3, 1] as const;

export function Quiz() {
  const total = perguntasQuiz.length;
  const [passo, setPasso] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [finalizado, setFinalizado] = useState(false);
  const [direcao, setDirecao] = useState(1);

  const pergunta = perguntasQuiz[passo];

  function escolher(valor: string) {
    const novas = { ...respostas, [pergunta.id]: valor };
    setRespostas(novas);
    if (passo < total - 1) {
      setDirecao(1);
      setTimeout(() => setPasso((p) => p + 1), 180);
    } else {
      setTimeout(() => setFinalizado(true), 180);
    }
  }

  function voltar() {
    if (finalizado) {
      setFinalizado(false);
      return;
    }
    if (passo > 0) {
      setDirecao(-1);
      setPasso((p) => p - 1);
    }
  }

  const resumo = perguntasQuiz
    .filter((p) => respostas[p.id])
    .map((p) => ({ pergunta: p.resumo, resposta: respostas[p.id] }));

  const wa = linkWhatsapp({ mensagem: mensagemQuiz(resumo) });
  const progressoPct = finalizado ? 100 : (passo / total) * 100;

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* barra de progresso */}
      <div className="mb-12 h-[3px] w-full overflow-hidden rounded-full bg-navy/10">
        <motion.div
          className="h-full bg-teal"
          animate={{ width: `${progressoPct}%` }}
          transition={{ duration: 0.5, ease }}
        />
      </div>

      {/* botão voltar */}
      {(passo > 0 || finalizado) && (
        <button
          onClick={voltar}
          className="mb-8 inline-flex items-center gap-2 text-fluid-sm text-navy/60 transition-colors hover:text-navy"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
      )}

      <AnimatePresence mode="wait" custom={direcao}>
        {!finalizado ? (
          <motion.div
            key={pergunta.id}
            custom={direcao}
            initial={{ opacity: 0, x: direcao * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direcao * -40 }}
            transition={{ duration: 0.45, ease }}
          >
            <p className="mb-3 text-fluid-sm uppercase tracking-[0.25em] text-teal">
              Pergunta {passo + 1} de {total}
            </p>
            <h2 className="font-display text-fluid-xl font-semibold leading-tight tracking-tight md:text-fluid-2xl">
              {pergunta.pergunta}
            </h2>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {pergunta.opcoes.map((op) => {
                const Icon = op.icon;
                const ativo = respostas[pergunta.id] === op.valor;
                return (
                  <button
                    key={op.valor}
                    onClick={() => escolher(op.valor)}
                    className={`group flex items-center gap-4 rounded-2xl border p-5 text-left transition-all duration-300 ease-editorial ${
                      ativo
                        ? "border-navy bg-navy text-beige"
                        : "border-navy/15 hover:-translate-y-0.5 hover:border-navy hover:shadow-lg hover:shadow-navy/5"
                    }`}
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${
                        ativo ? "bg-beige/15 text-beige" : "bg-sky/40 text-navy"
                      }`}
                    >
                      <Icon size={20} />
                    </span>
                    <span className="font-display text-fluid-base font-medium">
                      {op.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="resultado"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-sky/40 px-4 py-2 text-fluid-sm text-navy">
              <Sparkles size={16} /> Tudo pronto
            </span>
            <h2 className="mt-6 font-display text-fluid-2xl font-semibold leading-[1.05] tracking-tightest">
              Encontramos boas opções pra você.
            </h2>
            <p className="mt-5 max-w-md text-fluid-base text-navy/70">
              Com base no que você respondeu, a Patrícia e o Júlio já podem te
              mostrar imóveis que fazem sentido — com fotos e detalhes. É só
              continuar no WhatsApp.
            </p>

            {/* resumo das respostas */}
            <ul className="mt-8 space-y-3 rounded-2xl bg-beige/60 p-6">
              {resumo.map((r) => (
                <li key={r.pergunta} className="flex items-center gap-3 text-fluid-base">
                  <Check size={18} className="text-teal" />
                  <span className="text-navy/60">{r.pergunta}:</span>
                  <span className="font-medium text-navy">{r.resposta}</span>
                </li>
              ))}
            </ul>

            <a
              href={wa ?? "/contato"}
              {...(wa ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="mt-10 inline-flex items-center gap-3 rounded-full bg-[#25D366] px-8 py-4 text-fluid-base font-medium text-white shadow-lg shadow-[#25D366]/30 transition-transform duration-300 ease-editorial hover:scale-[1.03]"
            >
              <WhatsappIcon size={24} />
              Ver minhas opções no WhatsApp
            </a>

            <p className="mt-6 text-fluid-sm text-navy/50">
              Prefere ver tudo antes?{" "}
              <Link href="/imoveis" className="text-teal underline-offset-4 hover:underline">
                Conheça os imóveis disponíveis
              </Link>
              .
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
