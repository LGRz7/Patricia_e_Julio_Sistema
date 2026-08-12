import { Hero } from "@/components/home/Hero";
import { Manifesto } from "@/components/home/Manifesto";
import { EtapasScroll } from "@/components/home/EtapasScroll";
import { Profissionais } from "@/components/home/Profissionais";
import { Destaques } from "@/components/home/Destaques";
import { Categorias } from "@/components/home/Categorias";
import { QuizCTA } from "@/components/home/QuizCTA";
import { Institucional } from "@/components/home/Institucional";
import { Jornada } from "@/components/home/Jornada";
import { ContatoFinal } from "@/components/home/ContatoFinal";
import { FAQ } from "@/components/home/FAQ";
import { getImoveisMerged } from "@/lib/painel/imoveis-store.server";

// Server Component — lê imóveis publicados do store (base + admin)
export const revalidate = 30; // ISR: revalida a cada 30s

export default async function HomePage() {
  const todos = await getImoveisMerged();
  const destaques = todos.filter((i) => i.status === "disponivel");

  return (
    <>
      <Hero />
      <Manifesto />
      <EtapasScroll />
      <Profissionais />
      <Categorias />
      <Destaques imoveis={destaques} />
      <QuizCTA />
      <Institucional />
      <Jornada />
      <ContatoFinal />
      <FAQ />
    </>
  );
}
