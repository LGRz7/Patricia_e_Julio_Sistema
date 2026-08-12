export type StatusImovel = "disponivel" | "reservado" | "vendido";

export type TipoImovel =
  | "apartamento"
  | "casa"
  | "cobertura"
  | "terreno"
  | "comercial";

export interface ImagemImovel {
  src: string;
  alt: string;
  /** Orientação ajuda a compor o grid editorial assimétrico */
  orientacao?: "horizontal" | "vertical";
}

export interface Imovel {
  /** usado na URL: /imoveis/[slug] */
  slug: string;
  titulo: string;
  localizacao: string;
  /** valor em reais; null quando não autorizado a exibir */
  valor: number | null;
  tipo: TipoImovel;
  status: StatusImovel;
  quartos?: number;
  suites?: number;
  banheiros?: number;
  vagas?: number;
  /** área em m² */
  area?: number;
  /** frase curta de chamada (sem clichê) */
  resumo: string;
  descricao: string;
  diferenciais: string[];
  condominio?: number | null;
  imagens: ImagemImovel[];
  /** id do profissional responsável (ver data/profissionais.ts) */
  responsavel: string;
  /** quando true, exibe chamada para pedir mais fotos no WhatsApp */
  maisFotosNoWhatsapp?: boolean;
  /** marca conteúdo provisório/exemplo até chegar material real */
  exemplo?: boolean;
}
