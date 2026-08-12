import type { Metadata } from "next";
import { Quiz } from "@/components/quiz/Quiz";

export const metadata: Metadata = {
  title: "Encontre seu imóvel",
  description:
    "Responda 4 perguntas rápidas e a Patrícia e o Júlio te mostram os imóveis certos pra você no WhatsApp.",
};

export default function QuizPage() {
  return (
    <div className="editorial flex min-h-screen flex-col justify-center pt-32 pb-24 md:pt-40">
      <header className="mb-14 max-w-2xl">
        <p className="mb-4 text-fluid-sm uppercase tracking-[0.25em] text-teal">
          Encontre seu imóvel
        </p>
        <h1 className="font-display text-fluid-2xl font-semibold leading-[1.02] tracking-tightest">
          Responde rapidinho e a gente acha o que combina com você.
        </h1>
        <p className="mt-5 text-fluid-base text-navy/70">
          São 4 perguntas. No fim, você fala direto no WhatsApp com tudo já
          resumido — sem repetir nada.
        </p>
      </header>

      <Quiz />
    </div>
  );
}
