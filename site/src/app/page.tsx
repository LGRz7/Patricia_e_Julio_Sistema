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

export default function HomePage() {
  return (
    <>
      <Hero />
      <Manifesto />
      <EtapasScroll />
      <Profissionais />
      <Categorias />
      <Destaques />
      <QuizCTA />
      <Institucional />
      <Jornada />
      <ContatoFinal />
      <FAQ />
    </>
  );
}
