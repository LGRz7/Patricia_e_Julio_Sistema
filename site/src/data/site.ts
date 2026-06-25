/**
 * Dados globais do site, centralizados.
 *
 * ⚠️ PLACEHOLDERS: os contatos abaixo ainda NÃO foram fornecidos.
 * Preencher antes de publicar. Enquanto estiverem null/placeholder,
 * a UI esconde ou indica claramente que está pendente.
 */

export const site = {
  nome: "Patrícia e Júlio",
  assinatura: "Corretores de Imóveis",
  descricao:
    "Corretores de imóveis em São Gonçalo e região. Atendimento próximo e seguro para você encontrar o imóvel certo, para morar ou investir.",
  regiao: "São Gonçalo / RJ e região",

  // ⚠️ A PREENCHER — pendentes informados pelo cliente
  whatsappGeral: "5521991734848" as string | null, // Patrícia (contato principal)
  telefone: null as string | null,
  email: null as string | null,
  instagram: "@julio_e_patricia_corretores" as string | null,
  facebook: null as string | null,
  horarioAtendimento: null as string | null,

  url: "https://patriciaejulio.com.br", // provisório (sem hospedagem definida)
  instagramUrl: "https://www.instagram.com/julio_e_patricia_corretores/",
} as const;

/** Categorias/atalhos editoriais. Ajustar conforme a operação real. */
export const categorias = [
  { id: "apartamentos", label: "Apartamentos" },
  { id: "casas", label: "Casas" },
  { id: "investir", label: "Para investir" },
  { id: "regiao", label: "São Gonçalo" },
] as const;
