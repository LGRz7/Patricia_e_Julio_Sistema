"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { faq } from "@/data/faq";

const ease = [0.16, 1, 0.3, 1] as const;

export function FAQ() {
  const [aberto, setAberto] = useState<number | null>(0);

  return (
    <section className="editorial py-24 md:py-32">
      <div className="grid gap-12 md:grid-cols-[0.6fr_1fr] md:gap-20">
        {/* coluna título (editorial, assimétrica) */}
        <div className="md:sticky md:top-28 md:self-start">
          <p className="mb-5 text-fluid-sm uppercase tracking-[0.25em] text-teal">
            Antes de você perguntar
          </p>
          <h2 className="font-display text-fluid-xl font-semibold leading-tight tracking-tight md:text-fluid-2xl">
            As dúvidas que quase todo mundo tem.
          </h2>
          <p className="mt-6 max-w-sm text-fluid-base text-navy/70">
            E se a sua não estiver aqui, é só mandar uma mensagem — a gente
            responde de gente pra gente.
          </p>
        </div>

        {/* accordion */}
        <ul className="divide-y divide-navy/10 border-y border-navy/10">
          {faq.map((item, i) => {
            const ativo = aberto === i;
            return (
              <li key={i}>
                <button
                  onClick={() => setAberto(ativo ? null : i)}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left"
                  aria-expanded={ativo}
                >
                  <span className="font-display text-fluid-lg font-medium tracking-tight">
                    {item.pergunta}
                  </span>
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-navy/20 transition-all duration-400 ease-editorial ${
                      ativo ? "rotate-45 bg-navy text-beige" : "text-navy"
                    }`}
                  >
                    <Plus size={18} />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {ativo && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.45, ease }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-prose pb-6 text-fluid-base leading-relaxed text-navy/70">
                        {item.resposta}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
