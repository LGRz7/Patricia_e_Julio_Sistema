import type { Profissional } from "@/types/profissional";

/**
 * Profissionais reais. Textos institucionais mantidos curtos e honestos
 * (sem números, prêmios ou tempo de mercado inventados).
 * Foto provisória — substituir por foto real em /public/equipe/.
 */
export const profissionais: Profissional[] = [
  {
    id: "patricia",
    nome: "Patrícia Vidal",
    papel: "Corretora de Imóveis",
    creci: "CRECI 68850",
    bio: "Atende cada cliente de perto, do primeiro contato à entrega das chaves. Acredita que comprar um imóvel é uma decisão de confiança — e trata cada negociação com esse cuidado.",
    especialidades: ["Imóveis residenciais", "Primeira casa própria", "Atendimento personalizado"],
    foto: "/equipe/patricia-julio.png", // foto dos dois (em conjunto) — substituir por individuais se houver
    fotoAlt: "Patrícia Vidal, corretora de imóveis",
    whatsapp: "5521991734848",
  },
  {
    id: "julio",
    nome: "Júlio Aguiar",
    papel: "Corretor de Imóveis",
    creci: "CRECI 79271",
    bio: "Acompanha o cliente em cada etapa da compra com clareza e transparência. Foco em entender o que a pessoa realmente procura antes de apresentar qualquer imóvel.",
    especialidades: ["Imóveis residenciais", "Imóveis para investir", "Negociação"],
    foto: "/equipe/patricia-julio.png", // foto dos dois (em conjunto) — substituir por individuais se houver
    fotoAlt: "Júlio Aguiar, corretor de imóveis",
    whatsapp: "5521970706693",
  },
];

export function getProfissional(id: string): Profissional | undefined {
  return profissionais.find((p) => p.id === id);
}
