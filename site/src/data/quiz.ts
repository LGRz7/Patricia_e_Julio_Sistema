import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Home,
  HelpCircle,
  KeyRound,
  TrendingUp,
  Repeat,
  MapPin,
  Compass,
  Wallet,
  Banknote,
  Gem,
} from "lucide-react";

export interface OpcaoQuiz {
  valor: string;
  label: string;
  icon: LucideIcon;
}

export interface PerguntaQuiz {
  id: string;
  pergunta: string;
  /** rótulo curto usado no resumo da mensagem do WhatsApp */
  resumo: string;
  opcoes: OpcaoQuiz[];
}

export const perguntasQuiz: PerguntaQuiz[] = [
  {
    id: "tipo",
    pergunta: "O que você está procurando?",
    resumo: "Tipo de imóvel",
    opcoes: [
      { valor: "Apartamento", label: "Apartamento", icon: Building2 },
      { valor: "Casa", label: "Casa", icon: Home },
      { valor: "Ainda não sei", label: "Ainda não sei", icon: HelpCircle },
    ],
  },
  {
    id: "objetivo",
    pergunta: "É para morar ou investir?",
    resumo: "Objetivo",
    opcoes: [
      { valor: "Para morar", label: "Para morar", icon: KeyRound },
      { valor: "Para investir", label: "Para investir", icon: TrendingUp },
      { valor: "Os dois", label: "Os dois", icon: Repeat },
    ],
  },
  {
    id: "regiao",
    pergunta: "Qual região te interessa?",
    resumo: "Região",
    opcoes: [
      { valor: "São Gonçalo", label: "São Gonçalo", icon: MapPin },
      { valor: "Niterói", label: "Niterói", icon: MapPin },
      { valor: "Maricá / Região dos Lagos", label: "Maricá / Lagos", icon: MapPin },
      { valor: "Tanto faz", label: "Tanto faz", icon: Compass },
    ],
  },
  {
    id: "faixa",
    pergunta: "Qual faixa de investimento?",
    resumo: "Faixa de investimento",
    opcoes: [
      { valor: "Até R$ 250 mil", label: "Até R$ 250 mil", icon: Wallet },
      { valor: "R$ 250 mil a R$ 400 mil", label: "R$ 250–400 mil", icon: Banknote },
      { valor: "Acima de R$ 400 mil", label: "Acima de R$ 400 mil", icon: Gem },
    ],
  },
];
