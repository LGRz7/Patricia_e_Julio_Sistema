"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect } from "react";
import { X } from "lucide-react";
import { navLinks } from "./nav-links";
import { site } from "@/data/site";

interface Props {
  aberto: boolean;
  aoFechar: () => void;
}

export function MenuMobile({ aberto, aoFechar }: Props) {
  // bloqueia o scroll do body quando o menu está aberto
  useEffect(() => {
    if (aberto) {
      document.documentElement.classList.add("lenis-stopped");
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.classList.remove("lenis-stopped");
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [aberto]);

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          className="fixed inset-0 z-50 bg-navy text-beige md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex h-full flex-col px-6 py-6">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-semibold">
                {site.nome}
              </span>
              <button
                onClick={aoFechar}
                aria-label="Fechar menu"
                className="rounded-full p-2 hover:bg-beige/10"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="mt-16 flex flex-col gap-6">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.15 + i * 0.07,
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <Link
                    href={link.href}
                    onClick={aoFechar}
                    className="font-display text-4xl font-semibold tracking-tightest"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="mt-auto text-fluid-sm text-beige/70">
              {site.assinatura}
              <br />
              {site.regiao}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
