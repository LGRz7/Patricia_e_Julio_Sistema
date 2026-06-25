"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { ImagemImovel } from "@/types/imovel";

export function Galeria({ imagens }: { imagens: ImagemImovel[] }) {
  const [aberta, setAberta] = useState(false);
  const [atual, setAtual] = useState(0);

  const abrir = (i: number) => {
    setAtual(i);
    setAberta(true);
  };
  const proxima = () => setAtual((a) => (a + 1) % imagens.length);
  const anterior = () => setAtual((a) => (a - 1 + imagens.length) % imagens.length);

  if (imagens.length === 0) return null;

  return (
    <>
      {/* grid editorial com proporções variadas conforme orientação */}
      <div
        className={`grid gap-4 ${
          imagens.length === 1 ? "" : "md:grid-cols-2"
        }`}
      >
        {imagens.map((img, i) => {
          const vertical = img.orientacao === "vertical";
          const sozinha = imagens.length === 1;
          const destaque = i === 0 && imagens.length > 1 && !vertical;
          return (
            <button
              key={img.src}
              onClick={() => abrir(i)}
              className={`group relative overflow-hidden rounded-2xl bg-sky/30 ${
                sozinha
                  ? vertical
                    ? "mx-auto aspect-[3/4] w-full max-w-md"
                    : "aspect-[16/9]"
                  : destaque
                  ? "md:col-span-2 aspect-[16/9]"
                  : vertical
                  ? "aspect-[3/4]"
                  : "aspect-[4/3]"
              }`}
              aria-label={`Abrir imagem: ${img.alt}`}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                quality={90}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.03]"
              />
            </button>
          );
        })}
      </div>

      {/* modal de tela cheia */}
      <AnimatePresence>
        {aberta && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/95 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAberta(false)}
          >
            <button
              onClick={() => setAberta(false)}
              aria-label="Fechar galeria"
              className="absolute right-5 top-5 rounded-full p-2 text-beige hover:bg-beige/10"
            >
              <X size={28} />
            </button>

            {imagens.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    anterior();
                  }}
                  aria-label="Imagem anterior"
                  className="absolute left-4 rounded-full p-2 text-beige hover:bg-beige/10"
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    proxima();
                  }}
                  aria-label="Próxima imagem"
                  className="absolute right-4 rounded-full p-2 text-beige hover:bg-beige/10"
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}

            <motion.div
              key={atual}
              className="relative h-[80vh] w-[90vw] max-w-5xl"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={imagens[atual].src}
                alt={imagens[atual].alt}
                fill
                className="object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
