import type { Imovel } from "@/types/imovel";

/**
 * Imóveis. Conteúdo de EXEMPLO marcado com `exemplo: true`.
 * Base real usada: anúncio fornecido (Parada 40, São Gonçalo,
 * a partir de R$170.000). Trocar por imóveis reais e fotos próprias.
 *
 * Imagens apontam para placeholders em /public/imoveis/ — substituir
 * pelas fotos reais (o cliente vai enviar imagens de imóveis/prédio).
 */
export const imoveis: Imovel[] = [
  {
    slug: "apartamento-parada-40",
    titulo: "Apartamento na Parada 40",
    localizacao: "Parada 40, São Gonçalo / RJ",
    valor: 170000,
    tipo: "apartamento",
    status: "disponivel",
    quartos: 1,
    banheiros: 1,
    vagas: 1,
    area: 38,
    resumo:
      "Apartamento bem localizado, perto de todo o comércio da região, com opção de vaga e unidades garden.",
    descricao:
      "Apartamento de 1 quarto na Parada 40, em São Gonçalo. Localização prática, com fácil acesso e perto de todo o comércio da região. Boa opção para morar ou investir, com unidades garden e vaga de garagem disponíveis.",
    diferenciais: [
      "Excelente localização",
      "Perto do comércio da região",
      "Opção com vaga de garagem",
      "Unidades garden disponíveis",
    ],
    imagens: [
      { src: "/imoveis/parada-40.png", alt: "Fachada do edifício na Parada 40, São Gonçalo", orientacao: "horizontal" },
      { src: "/imoveis/placeholder-interior.svg", alt: "Interior do apartamento (imagem provisória)", orientacao: "vertical" },
    ],
    responsavel: "patricia",
    exemplo: true,
  },
  {
    slug: "casa-alferes-tiradentes",
    titulo: "Casa em Condomínio · Residencial Alferes Tiradentes",
    localizacao: "Várzea das Moças, Niterói / RJ",
    valor: 290000,
    tipo: "casa",
    status: "disponivel",
    resumo:
      "Casa em condomínio às margens da RJ-106, entre Niterói, Maricá e a Região dos Lagos. Infraestrutura e comodidade para a família.",
    descricao:
      "Às margens da RJ-106, o Residencial Alferes Tiradentes oferece a infraestrutura e a comodidade que toda família precisa. Uma ótima oportunidade para morar ou investir no que há de melhor entre Niterói, Maricá e a Região dos Lagos. Construção WE Engenharia.",
    diferenciais: [
      "Condomínio com infraestrutura",
      "Localização entre Niterói, Maricá e Região dos Lagos",
      "Fácil acesso pela RJ-106",
      "Ótima opção para morar ou investir",
    ],
    imagens: [
      { src: "/imoveis/casa-alferes-tiradentes.png", alt: "Casa no Residencial Alferes Tiradentes, Várzea das Moças, Niterói", orientacao: "vertical" },
    ],
    responsavel: "patricia",
    maisFotosNoWhatsapp: true,
  },
];

export function getImovel(slug: string): Imovel | undefined {
  return imoveis.find((i) => i.slug === slug);
}

export function getImoveisDestaque(): Imovel[] {
  return imoveis.filter((i) => i.status === "disponivel");
}
