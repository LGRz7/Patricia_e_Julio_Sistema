/**
 * Hierarquia Estado → Cidade → Bairro para o mapa do painel.
 * Foco em RJ (região de atuação dos corretores) com extensão pra outros estados.
 * Extraído do sistema Glitch e adaptado.
 */
export const locations: Record<string, Record<string, string[]>> = {
  "Rio de Janeiro": {
    "São Gonçalo": ["Centro", "Alcântara", "Neves", "Colubandê", "Maria Paula", "Trindade", "Zé Garoto", "Brasilândia", "Vila Yara", "Estrela do Norte", "Porto Novo", "Ipiíba", "Monjolos", "Parada 40", "Boa Vista", "Mutuá", "Rocha"],
    "Niterói": ["Centro", "Icaraí", "Santa Rosa", "São Francisco", "Ingá", "Fonseca", "Barreto", "Charitas", "Piratininga", "Itaipu", "Camboinhas", "Várzea das Moças", "Engenho do Mato"],
    "Rio de Janeiro": ["Centro", "Copacabana", "Ipanema", "Leblon", "Botafogo", "Flamengo", "Tijuca", "Barra da Tijuca", "Recreio", "Méier", "Vila Isabel", "Lapa", "Santa Teresa", "Gávea", "Jardim Botânico", "Lagoa", "Humaitá", "Laranjeiras", "Catete", "Glória", "São Conrado", "Penha", "Madureira", "Bangu", "Campo Grande", "Jacarepaguá"],
    "Maricá": ["Centro", "São José do Imbassaí", "Itaipuaçu", "Ponta Negra", "Cordeirinho", "Guaratiba", "Araçatiba"],
    "Duque de Caxias": ["Centro", "25 de Agosto", "Jardim Primavera", "Campos Elíseos", "Xerém"],
    "Nova Iguaçu": ["Centro", "Posse", "Comendador Soares", "Cabuçu"],
    "Petrópolis": ["Centro", "Quitandinha", "Itaipava", "Corrêas"],
    "Cabo Frio": ["Centro", "Passagem", "Braga", "São Cristóvão", "Peró"],
    "Angra dos Reis": ["Centro", "Praia do Anil", "Frade", "Angra Turismo"],
  },
  "São Paulo": {
    "São Paulo": ["Centro", "Pinheiros", "Vila Mariana", "Moema", "Itaim Bibi", "Jardins", "Vila Madalena", "Perdizes", "Higienópolis", "Consolação", "Brooklin", "Vila Olímpia", "Morumbi", "Butantã", "Tatuapé", "Mooca", "Liberdade", "Bela Vista", "Santana", "Lapa"],
    "Campinas": ["Centro", "Cambuí", "Guanabara", "Taquaral", "Vila Itapura", "Bonfim", "Barão Geraldo", "Sousas"],
    "Santos": ["Centro", "Gonzaga", "Boqueirão", "Aparecida", "Pompéia", "Ponta da Praia", "José Menino"],
  },
  "Minas Gerais": {
    "Belo Horizonte": ["Centro", "Savassi", "Funcionários", "Lourdes", "Buritis", "Belvedere", "Pampulha", "Mangabeiras", "Serra", "Anchieta"],
  },
  "Espírito Santo": {
    "Vitória": ["Centro", "Praia do Canto", "Jardim da Penha", "Mata da Praia"],
    "Vila Velha": ["Centro", "Praia da Costa", "Itaparica", "Coqueiral de Itaparica"],
  },
}

export function estados(): string[] { return Object.keys(locations) }
export function cidadesDe(estado: string): string[] { return Object.keys(locations[estado] || {}) }
export function bairrosDe(estado: string, cidade: string): string[] {
  const b = locations[estado]?.[cidade]
  if (!b || b.length === 0) return ["Todos"]
  return ["Todos", ...b]
}

/**
 * Categorias de imóvel — espelham TipoImovel.
 */
export const categoriasImovel = [
  { id: "todos", label: "Todos", emoji: "🏠" },
  { id: "apartamento", label: "Apartamentos", emoji: "🏢" },
  { id: "casa", label: "Casas", emoji: "🏡" },
  { id: "cobertura", label: "Coberturas", emoji: "🏙️" },
  { id: "terreno", label: "Terrenos", emoji: "🌳" },
  { id: "comercial", label: "Comercial", emoji: "🏪" },
] as const
